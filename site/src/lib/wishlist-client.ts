/**
 * Wishlist client-side controller.
 *
 * 從 site/src/pages/wishlist.astro 抽出來的純 JS 模組,
 * 負責所有與 GAS Web App 互動的邏輯、render、互動處理。
 *
 * 模板那邊只負責:DOM 結構、scoped CSS、注入 GAS_URL。
 * 啟動方式:模板載 module 後呼叫 `initWishlist({ gasUrl })`。
 *
 * 為何拆檔:
 *   原本 wishlist.astro 是 ~750 行單檔(template + scoped CSS + 400 行 JS),
 *   再加 feature 會痛。抽出 JS 後:
 *     - 邏輯獨立可單元測試
 *     - render / API / event 三層職責明確
 *     - 模板回到 200 行內,純看結構與樣式
 */

const STORAGE_KEY = 'wishlist_voter_token';
const TOP_N = 3; // 跟 GAS config 對齊 — Top N 進排程
const NEW_BADGE_HOURS = 48; // 48h 內提的算「新」

// ============================================================
// Types
// ============================================================
interface WishlistItem {
  id: string;
  title: string;
  description?: string;
  votes: number;
  created_at?: string;
}

interface SidebarBucket {
  scheduled: Array<{ title: string }>;
  shipped: Array<{ title: string }>;
}

interface WishlistState {
  week: string | null;
  items: WishlistItem[];
  myVoteThisWeek: string | null;
  sidebar: SidebarBucket;
  sortBy: 'votes' | 'newest';
  expandedIds: Set<string>;
}

interface InitOptions {
  gasUrl: string;
}

// ============================================================
// Local state — 單一資料來源,所有 render 從這出
// ============================================================
const state: WishlistState = {
  week: null,
  items: [],
  myVoteThisWeek: null,
  sidebar: { scheduled: [], shipped: [] },
  sortBy: 'votes',
  expandedIds: new Set(),
};

let GAS_URL = '';

// ============================================================
// Voter token + fingerprint
// ============================================================
function getVoterToken(): string {
  let token = localStorage.getItem(STORAGE_KEY);
  if (!token) {
    token =
      'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}

function fpParams(): Record<string, string> {
  return {
    voter_token: getVoterToken(),
    ua: navigator.userAgent || '',
    lang: navigator.language || '',
    screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
  };
}

// ============================================================
// API — 加 cache busting 防 GAS / 瀏覽器 cache
// ============================================================
async function apiGet(action: string, extra: Record<string, string> = {}): Promise<any> {
  if (!GAS_URL) return { ok: false, error: 'gas_not_configured' };
  const params = new URLSearchParams({ action, ...extra, _t: String(Date.now()) });
  try {
    const resp = await fetch(`${GAS_URL}?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    });
    return await resp.json();
  } catch (err) {
    return { ok: false, error: 'network_error' };
  }
}

async function apiPost(action: string, data: Record<string, string> = {}): Promise<any> {
  if (!GAS_URL) {
    toast('系統尚未設定 GAS 連線', 'error');
    return { ok: false, error: 'gas_not_configured' };
  }
  const body = new URLSearchParams({ action, ...fpParams(), ...data });
  try {
    const resp = await fetch(GAS_URL, { method: 'POST', body });
    return await resp.json();
  } catch (err) {
    return { ok: false, error: 'network_error' };
  }
}

// ============================================================
// UI helpers
// ============================================================
function toast(msg: string, type?: 'error'): void {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast show';
  if (type === 'error') {
    el.style.background = 'var(--color-neg, #6b4444)';
  } else {
    el.style.background = 'var(--color-ink)';
  }
  setTimeout(() => el.classList.remove('show'), 3000);
}

function escapeHtml(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!),
  );
}

function isNewProposal(item: WishlistItem): boolean {
  if (!item.created_at) return false;
  const ageMs = Date.now() - new Date(item.created_at).getTime();
  return ageMs < NEW_BADGE_HOURS * 60 * 60 * 1000;
}

// ============================================================
// RENDER — 純函式,吃 state 不打 API
// ============================================================
function render(): void {
  renderWeekInfo();
  renderItems();
  renderSidebar();
  renderToolbar();
}

function renderWeekInfo(): void {
  const weekInfo = document.getElementById('week-info');
  if (!weekInfo) return;
  if (!state.week) {
    weekInfo.textContent = '無法連線';
    return;
  }
  weekInfo.innerHTML = `
    <span>本週 <strong>${state.week}</strong></span>
    <span>${state.myVoteThisWeek ? '你已投票 ✓' : '你還沒投'}</span>
  `;
}

function renderToolbar(): void {
  const toolbar = document.getElementById('vote-toolbar') as HTMLElement | null;
  const stats = document.getElementById('vote-stats');
  if (!toolbar || !stats) return;
  if (state.items.length === 0) {
    toolbar.hidden = true;
    return;
  }
  toolbar.hidden = false;
  const totalVotes = state.items.reduce((sum, i) => sum + i.votes, 0);
  stats.textContent = `${state.items.length} 個提案 · 本週共 ${totalVotes} 票`;
}

function renderItems(): void {
  const list = document.getElementById('items-list');
  if (!list) return;

  if (state.items.length === 0) {
    list.innerHTML = `
      <div class="empty-vote">
        <div class="empty-vote__title">本週還沒有可投票的提案</div>
        <div class="empty-vote__body">
          想看到什麼 skill?第一個提出來,大家投你
        </div>
        <button type="button" class="btn-download btn-download--large" id="go-propose">
          去提案 →
        </button>
      </div>
    `;
    document.getElementById('go-propose')?.addEventListener('click', () => {
      switchTab('propose');
    });
    return;
  }

  // 票數排序(始終算 rank,因為 rank 跟「進前 3」判定都需要)
  const byVotes = [...state.items].sort((a, b) => {
    if (b.votes !== a.votes) return b.votes - a.votes;
    // 同票數時:已投的排前面(讓使用者一眼看到自己的),否則新的排前面
    if (state.myVoteThisWeek === a.id) return -1;
    if (state.myVoteThisWeek === b.id) return 1;
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });

  // rank map by id
  const rankById: Record<string, number> = {};
  byVotes.forEach((item, i) => {
    rankById[item.id] = i + 1;
  });

  // 第 3 名的票數(用來算「再幾票進前 3」)
  const cutoffVotes = byVotes[TOP_N - 1] ? byVotes[TOP_N - 1].votes : 0;

  // 本週最高票(比例條基準)
  const maxVotes = byVotes[0] ? byVotes[0].votes : 0;

  // 依使用者選的 sort 決定顯示順序
  let displayed: WishlistItem[];
  if (state.sortBy === 'newest') {
    displayed = [...state.items].sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return bTime - aTime;
    });
  } else {
    displayed = byVotes;
  }

  // 拼出 rows;votes 排序時插入「前 3 / 其他」分隔線(newest 排序時不插)
  const showTopDivider = state.sortBy === 'votes';
  let html = '';
  let dividerInserted = false;

  displayed.forEach((item) => {
    const rank = rankById[item.id];
    const isVoted = state.myVoteThisWeek === item.id;
    const isInTop = rank <= TOP_N;
    const isBelowCut = rank > TOP_N;
    const isExpanded = state.expandedIds.has(item.id);
    const gapToCut = isBelowCut ? Math.max(0, cutoffVotes - item.votes) : 0;
    const barWidth = maxVotes > 0 ? Math.max(2, (item.votes / maxVotes) * 100) : 0;
    const showNewBadge = isNewProposal(item);

    // 進入第 4 名時插入分隔線(只在 votes 排序下)
    if (showTopDivider && isBelowCut && !dividerInserted) {
      html += `<div class="top-divider">前 ${TOP_N}</div>`;
      dividerInserted = true;
    }

    const newBadge = showNewBadge ? `<span class="new-badge">New</span>` : '';

    const gapBadge = isBelowCut
      ? `<span class="gap-badge">${gapToCut === 0 ? '平手' : `+${gapToCut + 1}`}</span>`
      : '<span></span>'; // 保持 grid 欄位佔位

    // Button 文字 + 狀態
    let buttonHtml: string;
    if (state.myVoteThisWeek === item.id) {
      buttonHtml = `<button class="vote-cta is-mine" disabled>已投 ✓</button>`;
    } else if (state.myVoteThisWeek) {
      buttonHtml = `<button class="vote-cta" disabled>本週已投</button>`;
    } else {
      buttonHtml = `<button class="vote-cta" data-vote-id="${item.id}">投票</button>`;
    }

    const descHtml = item.description
      ? `<p class="wishlist-card__desc">${escapeHtml(item.description)}</p>`
      : `<p class="wishlist-card__desc-empty">(無描述)</p>`;

    html += `
      <div class="wishlist-card ${isVoted ? 'is-voted' : ''} ${isBelowCut ? 'is-below-cut' : ''} ${isExpanded ? 'is-expanded' : ''}"
           data-id="${item.id}">
        <div class="wishlist-card__rank ${isInTop ? 'is-top' : ''}">#${rank}</div>
        <div class="wishlist-card__count">${item.votes}</div>
        <div class="wishlist-card__title">
          <span class="wishlist-card__title-text">${escapeHtml(item.title)}</span>
          ${newBadge}
        </div>
        ${gapBadge}
        <div class="vote-bar">
          <div class="vote-bar__fill" style="width: ${barWidth}%"></div>
        </div>
        ${buttonHtml}
        <div class="wishlist-card__expand">
          ${descHtml}
        </div>
      </div>
    `;
  });

  list.innerHTML = html;

  // 綁投票事件 — stopPropagation 防止觸發展開
  list.querySelectorAll<HTMLButtonElement>('button[data-vote-id]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.voteId;
      if (id) vote(id);
    });
  });
  // disabled 按鈕也擋掉冒泡,避免點到「本週已投」時意外展開
  list.querySelectorAll<HTMLButtonElement>('.vote-cta:disabled').forEach((btn) => {
    btn.addEventListener('click', (e) => e.stopPropagation());
  });

  // 綁整列點擊 → 切換展開
  list.querySelectorAll<HTMLElement>('.wishlist-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      if (!id) return;
      if (state.expandedIds.has(id)) {
        state.expandedIds.delete(id);
      } else {
        state.expandedIds.add(id);
      }
      render();
    });
  });
}

// ============================================================
// Sidebar helpers
// ============================================================

/**
 * 計算到本週日 23:59 還有幾天(以日曆日為單位)。
 * 跟 GAS isoWeek 對齊 — ISO 週的 Sunday 是 day 7。
 * 邊界:當天就是週日且 < 23:59 顯示「今天」;> 23:59 顯示「已結算」
 * 週一顯示 6 天(不算今天),週六顯示 1 天,週日當天顯示「今天」。
 */
function daysUntilSundayClose(): { label: string; isToday: boolean } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  if (day === 0) {
    // 已經是週日:看當天 23:59:59 之前還來不來得及
    const closeAt = new Date(now);
    closeAt.setHours(23, 59, 59, 999);
    if (now > closeAt) return { label: '已結算', isToday: false };
    return { label: '今天', isToday: true };
  }

  const daysToSun = 7 - day;
  return { label: `${daysToSun} 天`, isToday: false };
}

/**
 * 找使用者投的那一票,在主欄按票數排序後排第幾名。
 * 沒投回 null。
 */
function findMyVoteInfo(): {
  item: WishlistItem;
  rank: number;
  isInTop: boolean;
  gapToCut: number;
} | null {
  if (!state.myVoteThisWeek) return null;
  const item = state.items.find((i) => i.id === state.myVoteThisWeek);
  if (!item) return null;
  // 跟 renderItems 用同樣的票數排序邏輯
  const byVotes = [...state.items].sort((a, b) => {
    if (b.votes !== a.votes) return b.votes - a.votes;
    if (state.myVoteThisWeek === a.id) return -1;
    if (state.myVoteThisWeek === b.id) return 1;
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });
  const rank = byVotes.findIndex((i) => i.id === state.myVoteThisWeek) + 1;
  const cutoffVotes = byVotes[TOP_N - 1] ? byVotes[TOP_N - 1].votes : 0;
  const isInTop = rank <= TOP_N;
  const gapToCut = isInTop ? 0 : Math.max(0, cutoffVotes - item.votes + 1);
  return { item, rank, isInTop, gapToCut };
}

// ============================================================
// RENDER helpers (continued)
// ============================================================

function renderCountdown(): void {
  const el = document.getElementById('countdown-days');
  if (!el) return;
  const { label, isToday } = daysUntilSundayClose();
  el.textContent = label;
  // 今天結算時數字變暖色強調(用 warn 變數)
  el.style.color = isToday ? 'var(--color-warn, #8a6d3b)' : '';
}

function renderMyVote(): void {
  const el = document.getElementById('my-vote-status');
  if (!el) return;
  const info = findMyVoteInfo();

  if (!info) {
    el.innerHTML = `<div class="my-vote-status__empty">本週還沒投票</div>`;
    return;
  }

  const { item, rank, isInTop, gapToCut } = info;
  const rankHtml = isInTop
    ? `<span class="my-vote-status__rank">目前 <strong>#${rank}</strong> · 在前 ${TOP_N}</span>`
    : `<span class="my-vote-status__rank">目前 <strong>#${rank}</strong> · 再 <strong>${gapToCut}</strong> 票進前 ${TOP_N}</span>`;

  el.innerHTML = `
    <div class="my-vote-status__title">${escapeHtml(item.title)}</div>
    ${rankHtml}
  `;
}

function renderSidebar(): void {
  // 倒數 + 我的投票
  renderCountdown();
  renderMyVote();

  // 準備中 / 已完成清單 + 計數
  const schedEl = document.getElementById('sidebar-scheduled');
  const shipEl = document.getElementById('sidebar-shipped');
  const schedCount = document.getElementById('sidebar-scheduled-count');
  const shipCount = document.getElementById('sidebar-shipped-count');

  const schedItems = state.sidebar.scheduled || [];
  const shipItems = state.sidebar.shipped || [];

  if (schedEl) {
    schedEl.innerHTML = schedItems.length
      ? schedItems.map((i) => `<li title="${escapeHtml(i.title)}">${escapeHtml(i.title)}</li>`).join('')
      : '<li class="sidebar-list__empty">—</li>';
  }
  if (shipEl) {
    shipEl.innerHTML = shipItems.length
      ? shipItems.map((i) => `<li title="${escapeHtml(i.title)}">${escapeHtml(i.title)}</li>`).join('')
      : '<li class="sidebar-list__empty">—</li>';
  }

  if (schedCount) schedCount.textContent = schedItems.length > 0 ? String(schedItems.length) : '';
  if (shipCount) shipCount.textContent = shipItems.length > 0 ? String(shipItems.length) : '';
}

// ============================================================
// Tab 切換
// ============================================================
function switchTab(tabName: string): void {
  document.querySelectorAll<HTMLButtonElement>('.filter-btn[data-tab]').forEach((b) => {
    const active = b.dataset.tab === tabName;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll<HTMLElement>('.wishlist-section').forEach((s) => (s.hidden = true));
  const section = document.getElementById('tab-' + tabName);
  if (section) section.hidden = false;
  if (tabName === 'results') loadResults();
}

// ============================================================
// 載入 + 投票
// ============================================================
async function loadItems(): Promise<void> {
  const [data, me] = await Promise.all([
    apiGet('items'),
    apiGet('me', { voter_token: getVoterToken() }),
  ]);

  if (!data.ok) {
    const list = document.getElementById('items-list');
    if (list) {
      list.innerHTML = `<p class="empty">載入失敗:${data.error}。請確認 GAS_URL 已設定。</p>`;
    }
    const weekInfo = document.getElementById('week-info');
    if (weekInfo) weekInfo.textContent = '無法連線';
    return;
  }

  state.week = data.week;
  state.items = data.items || [];
  state.sidebar = data.sidebar || { scheduled: [], shipped: [] };
  state.myVoteThisWeek = me.ok ? me.voted_for : null;

  render();
}

async function vote(ideaId: string): Promise<void> {
  if (state.myVoteThisWeek) {
    toast('你本週已經投過了', 'error');
    return;
  }

  // === Optimistic update ===
  // 先在 local state 改完,立刻 render,然後才打 API
  const item = state.items.find((i) => i.id === ideaId);
  if (!item) return;

  const previousState = {
    myVote: state.myVoteThisWeek,
    itemVotes: item.votes,
  };

  state.myVoteThisWeek = ideaId;
  item.votes += 1;
  render();

  // 觸發剛投完的閃光動畫
  requestAnimationFrame(() => {
    const card = document.querySelector<HTMLElement>(`.wishlist-card[data-id="${ideaId}"]`);
    if (card) {
      card.classList.add('is-just-voted');
      setTimeout(() => card.classList.remove('is-just-voted'), 600);
    }
  });

  // === 打 API ===
  const result = await apiPost('vote', { idea_id: ideaId });
  if (result.ok) {
    toast('投票成功!');
    // 背景同步一次,確保票數跟 server 對齊(不阻塞使用者)
    loadItems();
  } else {
    // === Rollback ===
    state.myVoteThisWeek = previousState.myVote;
    item.votes = previousState.itemVotes;
    render();

    const messages: Record<string, string> = {
      already_voted_cookie: '你本週已經投過了',
      already_voted_fingerprint: '此裝置本週已經投過',
      rate_limited: '操作太頻繁,請稍候再試',
      idea_not_available: '此提案目前無法投票',
    };
    toast(messages[result.error] || '投票失敗:' + result.error, 'error');
  }
}

// ============================================================
// 歷史結果
// ============================================================
async function loadResults(): Promise<void> {
  const list = document.getElementById('results-list');
  if (!list) return;
  const data = await apiGet('results');
  if (!data.ok) {
    list.innerHTML = `<p class="empty">載入失敗</p>`;
    return;
  }
  const weeks = Object.keys(data.history || {}).sort().reverse();
  if (weeks.length === 0) {
    list.innerHTML = '<p class="empty">還沒有歷史結果</p>';
    return;
  }
  list.innerHTML = weeks
    .map(
      (w) => `
    <div class="results-week">
      <div class="results-week__week">${w}</div>
      <ol>
        ${data.history[w]
          .sort((a: any, b: any) => a.rank - b.rank)
          .map(
            (item: any) =>
              `<li>${escapeHtml(item.title)}<span class="v">${item.votes} votes</span></li>`,
          )
          .join('')}
      </ol>
    </div>
  `,
    )
    .join('');
}

// ============================================================
// 提案表單
// ============================================================
function bindProposeForm(): void {
  const proposeBtn = document.getElementById('propose-submit');
  if (!proposeBtn) return;

  proposeBtn.addEventListener('click', async () => {
    const titleEl = document.getElementById('propose-title') as HTMLInputElement | null;
    const descEl = document.getElementById('propose-desc') as HTMLTextAreaElement | null;
    if (!titleEl || !descEl) return;

    const title = titleEl.value.trim();
    const description = descEl.value.trim();
    if (!title) {
      toast('請填寫 skill 名稱', 'error');
      return;
    }
    const result = await apiPost('propose', { title, description });
    if (result.ok) {
      titleEl.value = '';
      descEl.value = '';
      if (result.status === 'pending') {
        toast('提案已送出,等候 Vt 審核');
      } else {
        toast('提案已上架,可以投票了');
        // 切回投票 tab 並 reload
        switchTab('vote');
        loadItems();
      }
    } else {
      toast('提案失敗:' + result.error, 'error');
    }
  });
}

// ============================================================
// Event bindings(tab / sort)
// ============================================================
function bindTabs(): void {
  document.querySelectorAll<HTMLButtonElement>('.filter-btn[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab) switchTab(tab);
    });
  });
}

function bindSortToggle(): void {
  document.querySelectorAll<HTMLButtonElement>('.sort-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sort = btn.dataset.sort as 'votes' | 'newest' | undefined;
      if (!sort || state.sortBy === sort) return;
      state.sortBy = sort;
      document.querySelectorAll<HTMLButtonElement>('.sort-btn').forEach((b) => {
        const active = b.dataset.sort === sort;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
      renderItems();
    });
  });
}

// ============================================================
// Public entry
// ============================================================
export function initWishlist(opts: InitOptions): void {
  GAS_URL = opts.gasUrl;
  bindTabs();
  bindSortToggle();
  bindProposeForm();
  loadItems();
}

/**
 * 輕量 markdown render(配合 SKILL.md 已知格式,不引入 unified/remark)。
 *
 * 全站零斜體規則:`**xxx**` 與 `*xxx*` 都渲染為 <strong>,不產生 <em>。
 *
 * 額外特性(相對於先前內嵌版本):
 *   - H1/H2/H3 加 slug id,給 sticky TOC 用
 *   - 純文字 `references/xxx.md` 自動轉為內部連結
 *     - 在 SKILL 詳情頁:連到 ./ref/{slug}
 *     - 在 ref 子頁:連到 ../{slug}
 */

/**
 * 把標題文字轉成 URL slug(只留中文、英數、連字號)。
 * H2 章節名通常含中文,用 unicode-aware 處理。
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s]+/g, '-')
    .replace(/[^\p{Letter}\p{Number}\-]+/gu, '') // 留下字母/數字/連字號
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface RenderOptions {
  /**
   * `references/xxx.md` 純文字提及時要產生的相對連結 prefix。
   * - 詳情頁:`./ref/`(連到 ./ref/{slug})
   * - ref 子頁:`../`(連到 ../{slug})
   * - 不要產生連結:傳 null
   */
  refLinkPrefix?: string | null;
}

/**
 * 把 SKILL.md / reference markdown body 渲染成 HTML。
 */
export function renderMarkdown(md: string, opts: RenderOptions = {}): string {
  const refLinkPrefix = opts.refLinkPrefix ?? null;
  let html = md;

  // 1) 程式碼區塊先抽出,避免內部被其他規則破壞
  const codeBlocks: string[] = [];
  html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    codeBlocks.push(`<pre><code class="lang-${lang}">${escaped}</code></pre>`);
    return `\u0000CODEBLOCK_${codeBlocks.length - 1}\u0000`;
  });

  // 2) 行內 code
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // 3) Headers — 帶 id slug
  html = html.replace(/^### (.+)$/gm, (_, title) => {
    const id = slugify(title);
    return `<h3 id="${id}">${title}</h3>`;
  });
  html = html.replace(/^## (.+)$/gm, (_, title) => {
    const id = slugify(title);
    return `<h2 id="${id}">${title}</h2>`;
  });
  html = html.replace(/^# (.+)$/gm, (_, title) => {
    const id = slugify(title);
    return `<h1 id="${id}">${title}</h1>`;
  });

  // 4) Bold / Italic — 零斜體:** 與 * 都渲為 <strong>
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>');

  // 5) Lists — 連續行成 <ul>
  html = html.replace(/(?:^- .+\n?)+/gm, (block) => {
    const items = block
      .trim()
      .split('\n')
      .map((line) => line.replace(/^- /, ''))
      .map((item) => `<li>${item}</li>`)
      .join('');
    return `<ul>${items}</ul>`;
  });

  // 6) Paragraphs — 已是 html tag 開頭就不包 p
  html = html
    .split(/\n\n+/)
    .map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      if (/^<(h[1-6]|ul|ol|pre|blockquote)/.test(trimmed)) return trimmed;
      if (trimmed.startsWith('\u0000CODEBLOCK_')) return trimmed;
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n\n');

  // 7) 還原程式碼區塊
  html = html.replace(/\u0000CODEBLOCK_(\d+)\u0000/g, (_, i) => codeBlocks[parseInt(i, 10)]);

  // 8) references/xxx.md 自動轉連結(在已渲染 HTML 上做,跳過 <code> / <a> 內)
  //    僅在 refLinkPrefix 有值時啟用
  if (refLinkPrefix) {
    // 用 token 化方式:先把 <code>...</code>、<a ...>...</a>、<pre>...</pre> 區塊抽掉,
    // 替換完再放回,避免在這些區塊內亂動
    const protectedBlocks: string[] = [];
    const protect = (re: RegExp) => {
      html = html.replace(re, (m) => {
        protectedBlocks.push(m);
        return `\u0000PROT_${protectedBlocks.length - 1}\u0000`;
      });
    };
    protect(/<pre[\s\S]*?<\/pre>/g);
    protect(/<code[\s\S]*?<\/code>/g);
    protect(/<a[\s\S]*?<\/a>/g);

    // 比對 references/{filename}.md(中英都可),把 .md 去掉當 slug
    html = html.replace(/references\/([a-z0-9_-]+)\.md/gi, (full, name) => {
      const slug = name.toLowerCase();
      return `<a href="${refLinkPrefix}${slug}" class="ref-link"><code>references/${name}.md</code></a>`;
    });

    // 還原 protected blocks
    html = html.replace(/\u0000PROT_(\d+)\u0000/g, (_, i) => protectedBlocks[parseInt(i, 10)]);
  }

  return html;
}

/**
 * 從已渲染 HTML 撈 H2 標題,給 sticky TOC 用。
 * 同時撈 H3 作為次層(可選)。
 */
export interface TocEntry {
  level: 2 | 3;
  id: string;
  text: string;
}

export function extractToc(html: string): TocEntry[] {
  const toc: TocEntry[] = [];
  const re = /<(h2|h3) id="([^"]+)">([^<]+)<\/(h2|h3)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    toc.push({
      level: m[1] === 'h2' ? 2 : 3,
      id: m[2],
      text: m[3].trim(),
    });
  }
  return toc;
}

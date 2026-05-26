#!/usr/bin/env bash
# Lion Skill Library — installer for Claude Code (macOS / Linux)
#
# Usage:
#   curl -fsSL https://vincenthsiehisme.github.io/lion-skill-library/install.sh | bash -s -- list
#   curl -fsSL https://vincenthsiehisme.github.io/lion-skill-library/install.sh | bash -s -- install <name>
#   curl -fsSL https://vincenthsiehisme.github.io/lion-skill-library/install.sh | bash -s -- install --all
#
# Flags:
#   --scope project    Install to ./.claude/skills/ instead of ~/.claude/skills/
#   --force            Overwrite existing skill of the same name
#
# Repo: https://github.com/Vincenthsiehisme/lion-skill-library

set -euo pipefail

# ---------- Config ----------
BASE_URL="${LION_SKILL_BASE_URL:-https://vincenthsiehisme.github.io/lion-skill-library}"
MANIFEST_URL="${BASE_URL}/manifest.json"
USER_SKILLS_DIR="${HOME}/.claude/skills"
PROJECT_SKILLS_DIR="$(pwd)/.claude/skills"

# ---------- Colors (NO_COLOR aware) ----------
if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
  BLUE='\033[0;34m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; BOLD=''; DIM=''; RESET=''
fi

log()  { printf '%b\n' "$*" >&2; }
ok()   { log "  ${GREEN}✓${RESET} $*"; }
warn() { log "  ${YELLOW}!${RESET} $*"; }
err()  { log "  ${RED}✗${RESET} $*"; }
info() { log "${BLUE}→${RESET} $*"; }

# ---------- Deps check ----------
need() {
  command -v "$1" >/dev/null 2>&1 || {
    err "缺少必要工具：$1"
    log "  請先安裝 $1 後再試。"
    exit 1
  }
}
need curl
need unzip

# JSON parser: prefer jq, fall back to python3
JSON_PARSER=""
if command -v jq >/dev/null 2>&1; then
  JSON_PARSER="jq"
elif command -v python3 >/dev/null 2>&1; then
  JSON_PARSER="python3"
else
  err "需要 jq 或 python3 任一來解析 manifest。"
  log "  macOS: brew install jq"
  log "  Linux: apt install jq  /  yum install jq"
  exit 1
fi

# ---------- Manifest fetch & cache ----------
MANIFEST_CACHE="$(mktemp -t lion-skill-manifest.XXXXXX.json)"
trap 'rm -f "${MANIFEST_CACHE}"' EXIT

fetch_manifest() {
  info "讀取 manifest：${DIM}${MANIFEST_URL}${RESET}"
  if ! curl -fsSL "${MANIFEST_URL}" -o "${MANIFEST_CACHE}"; then
    err "無法下載 manifest。檢查網路或 BASE_URL 環境變數。"
    exit 1
  fi
  ok "manifest 已載入"
}

# json_get <field-path-args>
# Usage examples:
#   json_get '.skills[].name'                       (jq style)
#   json_get_skill_field <name> <field>             (helper below)
json_get_skill_field() {
  local skill_name="$1"
  local field="$2"
  if [[ "${JSON_PARSER}" == "jq" ]]; then
    jq -r --arg n "${skill_name}" --arg f "${field}" \
      '.skills[] | select(.name == $n) | .[$f] // empty' \
      "${MANIFEST_CACHE}"
  else
    python3 - "${skill_name}" "${field}" <<'PY' "${MANIFEST_CACHE}"
import json, sys
name, field, path = sys.argv[1], sys.argv[2], sys.argv[3]
with open(path) as f:
    data = json.load(f)
for s in data.get('skills', []):
    if s.get('name') == name:
        v = s.get(field, '')
        print(v if v is not None else '')
        break
PY
  fi
}

# Print one line per skill: "<name>\t<version>\t<category>\t<description>"
json_list_skills() {
  if [[ "${JSON_PARSER}" == "jq" ]]; then
    jq -r '.skills[] | [.name, .version, .category, .description] | @tsv' \
      "${MANIFEST_CACHE}"
  else
    python3 - <<'PY' "${MANIFEST_CACHE}"
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
for s in data.get('skills', []):
    print('\t'.join([
        s.get('name', ''),
        s.get('version', ''),
        s.get('category', ''),
        s.get('description', ''),
    ]))
PY
  fi
}

json_all_names() {
  if [[ "${JSON_PARSER}" == "jq" ]]; then
    jq -r '.skills[].name' "${MANIFEST_CACHE}"
  else
    python3 - <<'PY' "${MANIFEST_CACHE}"
import json, sys
with open(sys.argv[1]) as f:
    data = json.load(f)
for s in data.get('skills', []):
    print(s.get('name', ''))
PY
  fi
}

# ---------- Commands ----------
cmd_list() {
  fetch_manifest
  log ""
  log "${BOLD}可安裝的 skill：${RESET}"
  log ""
  printf '  %-25s %-8s %-10s %s\n' "NAME" "VERSION" "CATEGORY" "DESCRIPTION" >&2
  printf '  %-25s %-8s %-10s %s\n' "----" "-------" "--------" "-----------" >&2
  while IFS=$'\t' read -r name version category description; do
    # 截斷 description 避免換行爆版
    if [[ ${#description} -gt 60 ]]; then
      description="${description:0:57}..."
    fi
    printf '  %-25s %-8s %-10s %s\n' "${name}" "${version}" "${category}" "${description}" >&2
  done < <(json_list_skills)
  log ""
  log "${DIM}安裝指令：curl -fsSL ${BASE_URL}/install.sh | bash -s -- install <name>${RESET}"
}

install_one() {
  local skill_name="$1"
  local target_dir="$2"
  local force="$3"

  local version
  version="$(json_get_skill_field "${skill_name}" "version")"
  if [[ -z "${version}" ]]; then
    err "找不到 skill：${skill_name}"
    log "  用 list 看可用清單：curl -fsSL ${BASE_URL}/install.sh | bash -s -- list"
    return 1
  fi

  local zip_filename
  zip_filename="$(json_get_skill_field "${skill_name}" "zipFilename")"
  if [[ -z "${zip_filename}" ]]; then
    err "manifest 內 ${skill_name} 缺少 zipFilename 欄位。"
    return 1
  fi

  local install_path="${target_dir}/${skill_name}"
  if [[ -d "${install_path}" && "${force}" != "true" ]]; then
    warn "${skill_name} 已存在於 ${install_path}（用 --force 覆蓋，或先手動刪除）"
    return 0
  fi

  info "下載 ${BOLD}${skill_name}${RESET} v${version}"
  local zip_url="${BASE_URL}/downloads/${zip_filename}"
  local tmp_zip
  tmp_zip="$(mktemp -t "${skill_name}.XXXXXX.zip")"
  local tmp_dir
  tmp_dir="$(mktemp -d -t "${skill_name}.XXXXXX")"
  # shellcheck disable=SC2064
  trap "rm -rf '${tmp_zip}' '${tmp_dir}'; rm -f '${MANIFEST_CACHE}'" EXIT

  if ! curl -fsSL "${zip_url}" -o "${tmp_zip}"; then
    err "下載失敗：${zip_url}"
    return 1
  fi

  if ! unzip -q "${tmp_zip}" -d "${tmp_dir}"; then
    err "解壓失敗：${zip_filename}"
    return 1
  fi

  # 兼容兩種 zip 結構：
  #   1) 內含 <name>/SKILL.md  → 有外層資料夾
  #   2) 直接 SKILL.md         → 無外層資料夾（fallback）
  local src_dir=""
  if [[ -f "${tmp_dir}/${skill_name}/SKILL.md" ]]; then
    src_dir="${tmp_dir}/${skill_name}"
  elif [[ -f "${tmp_dir}/SKILL.md" ]]; then
    src_dir="${tmp_dir}"
  else
    err "zip 結構異常：找不到 SKILL.md"
    log "  zip 內容："
    find "${tmp_dir}" -maxdepth 2 | sed 's/^/    /' >&2
    return 1
  fi

  mkdir -p "${target_dir}"

  # 覆蓋：先刪舊的
  if [[ -d "${install_path}" && "${force}" == "true" ]]; then
    rm -rf "${install_path}"
  fi

  # 搬過去
  if ! cp -R "${src_dir}" "${install_path}"; then
    err "搬移失敗：${install_path}"
    return 1
  fi

  # ---- D3 驗證：確認 SKILL.md 真的在 ----
  if [[ -f "${install_path}/SKILL.md" ]]; then
    ok "${skill_name} v${version} 已安裝到 ${install_path}"
  else
    err "${skill_name} 安裝後驗證失敗：${install_path}/SKILL.md 不存在"
    return 1
  fi
}

cmd_install() {
  local install_all="false"
  local skill_name=""
  local force="false"
  local target_dir="${USER_SKILLS_DIR}"

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --all) install_all="true"; shift ;;
      --force) force="true"; shift ;;
      --scope)
        shift
        if [[ "${1:-}" == "project" ]]; then
          target_dir="${PROJECT_SKILLS_DIR}"
        elif [[ "${1:-}" == "user" ]]; then
          target_dir="${USER_SKILLS_DIR}"
        else
          err "--scope 只接受 'project' 或 'user'"
          exit 1
        fi
        shift
        ;;
      --*)
        err "未知 flag：$1"
        exit 1
        ;;
      *)
        if [[ -z "${skill_name}" ]]; then
          skill_name="$1"
        else
          err "多餘參數：$1"
          exit 1
        fi
        shift
        ;;
    esac
  done

  if [[ "${install_all}" == "false" && -z "${skill_name}" ]]; then
    err "請指定 skill 名稱，或用 --all 安裝全部。"
    log "  用 list 看可用清單。"
    exit 1
  fi

  fetch_manifest

  log ""
  log "${BOLD}安裝目標：${RESET}${target_dir}"
  log ""

  if [[ "${install_all}" == "true" ]]; then
    local failed=0
    local installed=0
    while IFS= read -r name; do
      [[ -z "${name}" ]] && continue
      if install_one "${name}" "${target_dir}" "${force}"; then
        installed=$((installed + 1))
      else
        failed=$((failed + 1))
      fi
    done < <(json_all_names)
    log ""
    if [[ ${failed} -eq 0 ]]; then
      ok "全部完成：${installed} 個 skill 已安裝"
    else
      warn "完成：${installed} 個成功，${failed} 個失敗"
    fi
  else
    install_one "${skill_name}" "${target_dir}" "${force}"
  fi

  log ""
  log "${DIM}下次符合觸發條件時，Claude 會自動載入。${RESET}"
  log "${DIM}重啟 Claude Code session 讓變更生效。${RESET}"
}

cmd_help() {
  cat >&2 <<EOF
${BOLD}Lion Skill Library — installer${RESET}

${BOLD}USAGE${RESET}
  curl -fsSL ${BASE_URL}/install.sh | bash -s -- <command> [options]

${BOLD}COMMANDS${RESET}
  list                       列出所有可安裝的 skill
  install <name>             安裝指定 skill
  install --all              安裝整個庫
  help                       顯示這份說明

${BOLD}OPTIONS${RESET}
  --scope project            安裝到 ./.claude/skills/（當前目錄，專案級）
  --scope user               安裝到 ~/.claude/skills/（預設，使用者級）
  --force                    覆蓋既有同名 skill

${BOLD}EXAMPLES${RESET}
  # 列出可用清單
  curl -fsSL ${BASE_URL}/install.sh | bash -s -- list

  # 裝單一 skill
  curl -fsSL ${BASE_URL}/install.sh | bash -s -- install example-greeting

  # 裝到當前專案
  curl -fsSL ${BASE_URL}/install.sh | bash -s -- install example-greeting --scope project

  # 強制覆蓋更新
  curl -fsSL ${BASE_URL}/install.sh | bash -s -- install example-greeting --force

  # 一次裝整個庫
  curl -fsSL ${BASE_URL}/install.sh | bash -s -- install --all

${BOLD}ENVIRONMENT${RESET}
  LION_SKILL_BASE_URL        覆寫預設的 manifest 來源（debug 用）
  NO_COLOR                   設為任意值停用顏色輸出

${BOLD}MORE${RESET}
  ${BASE_URL}/install        完整安裝教學
  https://github.com/Vincenthsiehisme/lion-skill-library
EOF
}

# ---------- Main ----------
main() {
  if [[ $# -eq 0 ]]; then
    cmd_help
    exit 0
  fi

  local cmd="$1"; shift
  case "${cmd}" in
    list)        cmd_list "$@" ;;
    install)     cmd_install "$@" ;;
    help|--help|-h) cmd_help ;;
    *)
      err "未知指令：${cmd}"
      log ""
      cmd_help
      exit 1
      ;;
  esac
}

main "$@"

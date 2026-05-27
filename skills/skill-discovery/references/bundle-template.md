# Discovery Bundle Template

`skill-discovery` produces this markdown bundle after external reference discovery. The bundle gives the user and downstream `knowledge-extractor` enough context to decide which URLs to read next.

Save by default to:

```text
/home/claude/discovery-bundles/discovery-bundle-<topic>.md
```

Use `/home/claude/discovery-bundles/` as the primary Claude runtime path. If `/home/claude` is unavailable, fall back to the platform's configured artifact directory or `./discovery-bundles/`.

## Template

```markdown
# Discovery Bundle: <topic>

Generated on: <YYYY-MM-DD, timezone if known>
Entry route: A / B / C
Search need: <one-sentence description>
Reference target: <whole skill / description / gotchas / eval / handoff / other>
Search terms:
- <query 1>
- <query 2>
- <query 3>

## 1. Retained references

### L1 — Anthropic official

| Level | URL | One-line reason | Supports |
|---|---|---|---|
| High | https://... | ... | <section or design question> |

### L2 — anthropics/skills or Anthropic GitHub

| Level | URL | One-line reason | Supports |
|---|---|---|---|
| High | https://... | ... | <section or design question> |

### L3 — Reputable community sources

| Level | URL | One-line reason | Supports |
|---|---|---|---|
| Medium | https://... | ... | <section or design question> |

### L4 — General web, if used

| Level | URL | One-line reason | Supports |
|---|---|---|---|
| Low | https://... | ... | <section or design question> |

## 2. Excluded sources

| URL | Exclusion reason |
|---|---|
| https://... | Twitter/X thread; unsuitable for structured extraction. |

## 3. Recommended extraction queue

Send these URLs to `knowledge-extractor` first:

1. <High URL 1>
2. <High URL 2>
3. <High URL 3>

## 4. Handoff note

`skill-discovery` only triaged these sources. It did not deep-read them. `knowledge-extractor` should process selected URLs one at a time and mark which claims are author claims, transferable principles, or context-specific observations.

## 5. Upstream return note

Use this only for Route A or Route B.

- Route A (`skill-search` fallback): External discovery found <N> High references that may fill the internal example gap.
- Route B (`skill-brain` fallback): External discovery found references covering <domains / structures / patterns>.
```

## File-writing fallback

If the runtime cannot write to `/home/claude/discovery-bundles/`, try the platform's configured artifact directory or `./discovery-bundles/`. If no writable path is available, render the full bundle inline and mark the save path as `not available in this environment`. Do not claim that a bundle was saved unless the file was actually created.

## Length guidance

- Conversation summary: about 30 lines or fewer.
- Bundle: about 50–120 lines.
- If the bundle exceeds 150 lines, too many URLs or too much synthesis were included.

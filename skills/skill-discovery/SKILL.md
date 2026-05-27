---
name: skill-discovery
description: Use when the user explicitly asks for external references, Anthropic/GitHub examples, or best practices for Claude/agent skill design, or when internal skill-search/skill-brain has no precedent. Search L1/L2 first; return a screened URL list and handoff bundle only. Do not deep-read, compare, or synthesize sources.
---

# Skill Discovery

Use this skill for the **external reference discovery** stage of a skill lifecycle. The output is a screened list of useful URLs and a handoff bundle for downstream extraction. This skill does **not** read articles in depth, compare many cases strategically, or decide which pattern the user must adopt.

## 1. When to use

Trigger this skill only when the request requires **external reference discovery**. The user should either explicitly ask for external examples/references, or the upstream workflow should have already failed to find a usable internal precedent.

Use this skill when the user asks for any of the following:

- External references for skill design, skill structure, trigger wording, workflow design, evaluation, or best practices.
- Anthropic official guidance, Anthropic/Claude examples, or `anthropics/skills` examples.
- Industry examples for how similar agent/skill workflows are written.
- A fallback after `skill-search` found no internal example.
- A fallback after `skill-brain` judged that the topic has no strong internal precedent.

Common trigger phrases include:

- 「對外找 reference」
- 「業界怎麼做」
- 「Anthropic 官方有沒有」
- 「GitHub 上找一下」
- 「anthropics/skills」
- 「latest best practice」
- 「外部範例」

## 2. When not to use

Do not use this skill when the request belongs to another workflow:

| User intent | Route instead |
|---|---|
| The user already provided a URL, PDF, article, or repo and wants it read in depth. | `knowledge-extractor` |
| The user wants internal examples or templates and did not explicitly ask for external sources. | `skill-search` first |
| The user wants cross-case comparison, strategy synthesis, or a deck/report from multiple cases. | `strategy-case-report` |
| The user asks about project-specific product search, ES, IntentionSearch, or search-result mapping. | Project/domain search workflow such as `search-map`, if available |
| The user asks for current facts or news unrelated to skill design. | Direct web search, not this skill |

If a request enters this skill but later proves to be one of the above, stop the discovery workflow and redirect to the appropriate workflow.

## 3. Route classification

Before searching, classify the entry path. Use the route to decide what the output should emphasize.

| Route | Signal | Output emphasis |
|---|---|---|
| A. `skill-search` fallback | Prior context says internal search returned 0 matches. | Find comparable external structures or section patterns. |
| B. `skill-brain` fallback | Prior context says the domain has no internal precedent. | Find broader skill/workflow structures in the domain. |
| C. Direct user request | User directly asks for external examples or best practices. | Run the full discovery workflow. |

If the route is unclear, default to Route C.

## 4. Discovery workflow

### Step 1 — Build the search brief

Infer the following from context. Ask at most one clarification question only when the topic is still too vague to search.

- Reference target: whole skill structure, trigger/description wording, workflow steps, gotchas, evaluation design, handoff format, or another specific section.
- Source scope: Anthropic official docs, `anthropics/skills`, reputable AI engineering blogs, or general web.
- English search terms: translate Chinese requirements into English because high-signal external sources are usually in English.

Record the final brief in the bundle.

### Step 2 — Search by authority tier

Search in this order. Do not start from general web. Lightly open or inspect a result only when needed to verify that the URL is real, current, and actually matches the target. Do not perform article-level extraction, framework synthesis, or long summarization inside this skill.

| Tier | Source type | Query pattern | Stop rule |
|---|---|---|---|
| L1 | Anthropic official docs, engineering posts, research/news | `[topic] site:docs.claude.com`, `[topic] site:anthropic.com` | Stop after 2–3 strong results. |
| L2 | Anthropic-owned GitHub examples | `[topic] site:github.com/anthropics`, `anthropics skills [topic]` | Stop if L1+L2 already have 3 strong results. |
| L3 | Reputable community sources | `[topic] Simon Willison`, `[topic] Claude skill blog`, `[topic] AI engineering blog` | Add 1–2 contrastive references. |
| L4 | General web | `[topic] best practices`, `[topic] examples` | Use only when L1–L3 do not produce enough candidates; cap at 2. |

Selection rules:

- Return 5–10 screened URLs total when useful sources exist.
- If L1+L2 already contain at least 3 highly relevant results, early-stop with 3–5 URLs rather than filling the list with weaker sources.
- Use search snippets, titles, dates, source identity, and light verification for triage. Do not deep-read pages in this skill.
- Exclude Twitter/X threads, Reddit threads, thin Medium/SEO pages, and unrelated keyword matches unless the user explicitly requested social discussion.

### Step 3 — Score and filter

Assign one recommendation level to each retained URL.

| Level | Meaning | Criteria |
|---|---|---|
| High | Send to `knowledge-extractor` first. | Directly matches the user's target and comes from L1/L2, or is an unusually strong L3 source. |
| Medium | Useful supporting context. | Partially matches the target or comes from a reputable secondary source. |
| Low | Optional background only. | Related but indirect, older, or from a lower-authority source. |

Do not list zero-value results. Put only meaningful exclusions in the “Excluded sources” section.

### Step 4 — Produce both deliverables

Always produce both deliverables when the platform allows file writing.

1. **Conversation summary**: a compact, human-readable list for the user.
2. **Discovery bundle**: a markdown file for downstream use, saved by default to `/home/claude/discovery-bundles/discovery-bundle-<topic>.md` for Claude runtime environments. If `/home/claude` is unavailable, fall back to the platform's configured artifact directory or `./discovery-bundles/`. If file writing is unavailable, render the bundle content inline.

Do not ask the user whether to create the bundle. The bundle is part of this skill's output. Ask only whether they want to send the High-rated URLs to `knowledge-extractor` next. If no High-rated URL exists, recommend refining the search target instead of forcing a handoff.

## 5. Conversation output format

Use this structure. Keep it within roughly 30 lines.

```markdown
## Skill Discovery Bundle

Search need: <what the user wanted>
Entry route: A / B / C
Search terms: <English query terms used>

### Retained references

#### L1 — Anthropic official
| Level | URL | One-line reason |
|---|---|---|
| High | https://... | ... |

#### L2 — anthropics/skills or Anthropic GitHub
| Level | URL | One-line reason |
|---|---|---|
| High | https://... | ... |

#### L3/L4 — Supporting sources
| Level | URL | One-line reason |
|---|---|---|
| Medium | https://... | ... |

### Excluded sources
| URL | Reason |
|---|---|
| https://... | Twitter/X thread; not suitable for downstream extraction. |

### Recommended next step
Send the High-rated URLs to `knowledge-extractor` for deep reading.
Bundle saved at: `/home/claude/discovery-bundles/discovery-bundle-<topic>.md`
```

## 6. Handoff contract

This skill ends after producing the screened list and bundle.

If the user wants follow-up extraction, pass the selected URL(s) to `knowledge-extractor` one at a time. Do not deep-read the URLs inside this skill, even when the user says “all High-rated URLs are fine.”

## 7. Quality gates

Before final output, verify:

- The request truly needs external references.
- The search started from L1/L2 before L3/L4.
- The final list has 5–10 URLs, or 3–5 URLs when early-stop conditions are met.
- Each retained URL has a level and one-line reason.
- Weak or excluded sources are not mixed into the recommendation list.
- The output does not contain a strategic comparison or article-level synthesis.
- The bundle path is valid for the current environment, or the bundle is rendered inline when file writing is unavailable.

## 8. Gotchas

### G1. Dumping raw search results

Do not paste every result found. This skill exists to filter. Return a screened list only.

### G2. Reading sources too deeply

Do not summarize full articles, extract frameworks, or synthesize detailed lessons. That belongs to `knowledge-extractor`.

### G3. Confusing discovery with strategy comparison

If the user asks to compare many cases and derive a strategy, redirect to `strategy-case-report`.

### G4. Over-triggering on generic “find a template” requests

If the user did not specify external sources, route to `skill-search` first.

### G5. Searching in Chinese by default

Translate the user’s intent into English search terms unless the user explicitly wants Chinese sources.

### G6. Claiming a save path without verifying it

Use `/home/claude/discovery-bundles/` as the primary output path in Claude runtime environments. Before claiming the bundle was saved, ensure the directory exists or can be created. If `/home/claude` is unavailable, fall back to the platform’s configured artifact directory or `./discovery-bundles/`. If no writable path exists, render the bundle inline and state that file saving was unavailable.

## Reference files

- Search mechanics: `references/search-mechanics.md`
- Bundle template: `references/bundle-template.md`
- Trigger test cases: `references/eval-cases.md`

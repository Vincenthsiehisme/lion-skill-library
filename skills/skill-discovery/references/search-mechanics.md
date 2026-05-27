# Search Mechanics

This file defines the concrete search patterns for `skill-discovery`. The main `SKILL.md` defines when to use the skill and the high-level workflow.

## 1. Translate the search target

Use English queries by default. External Claude/agent/skill sources are usually English.

| User wording | Search target | Example query terms |
|---|---|---|
| skill 觸發機制 / description 怎麼寫 | Skill trigger and metadata description | `Claude Skill description trigger best practices` |
| 整體 skill 骨架 / 該長怎樣 | Whole skill structure | `Claude Skill structure SKILL.md examples` |
| Gotchas 怎麼寫 | Failure modes / gotchas | `agent skill gotchas failure modes examples` |
| eval / benchmark | Evaluation design | `Claude Skill eval benchmark test cases` |
| 多 skill 衝突 | Skill routing and conflict resolution | `agent skills routing conflict disambiguation` |
| 漸進式揭露 | Progressive disclosure | `agent skills progressive disclosure documentation` |
| handoff 給其他 skill | Handoff contract | `agent workflow handoff contract skill` |

## 2. Authority tiers

### L1 — Anthropic official

Use first.

```text
<topic> site:docs.claude.com
<topic> site:platform.claude.com/docs
<topic> site:anthropic.com/engineering
<topic> site:anthropic.com/news
<topic> site:anthropic.com/research
```

Good L1 results are usually High or Medium.

### L2 — Anthropic GitHub examples

Use second.

```text
<topic> site:github.com/anthropics/skills
<topic> site:github.com/anthropics
anthropics skills <topic>
```

Good L2 results are useful when the user wants concrete `SKILL.md` structure or section patterns.

### L3 — Reputable community sources

Use only after L1/L2.

```text
<topic> Simon Willison
<topic> Claude skills blog
<topic> AI engineering agents blog
<topic> Latent Space AI agents
```

L3 should add perspective, not replace official sources.

### L4 — General web

Use only when L1–L3 produce too few candidates.

```text
<topic> best practices examples
<topic> agent workflow examples
<topic> skill design pattern
```

Cap L4 at two retained results.

## 3. Stop rules

Stop searching when any condition is met. Early-stop means returning fewer but stronger URLs, not padding the list with weak sources:

- L1 + L2 contain at least 3 High results, in which case 3–5 retained URLs are acceptable.
- The retained list has 5–10 useful URLs.
- Additional tiers only produce weak or duplicate results.

Do not fill the list with low-quality sources just to reach 10 URLs.

## 4. Filtering rules

Exclude these by default:

| Source type | Reason |
|---|---|
| Twitter/X threads | Too short and unstable for downstream extraction. |
| Reddit threads | Useful for sentiment, weak for structured extraction unless explicitly requested. |
| Thin Medium/SEO pages | Often generic or AI-generated; low signal. |
| Unrelated keyword matches | False positives. |
| Old content that conflicts with current docs | Staleness risk. |

When excluding a source that was meaningfully considered, record it in the bundle.

## 5. Recommendation rubric

| Level | Use when |
|---|---|
| High | The result directly answers the target and comes from L1/L2, or is an exceptionally strong L3 source. |
| Medium | The result partially answers the target or provides useful context. |
| Low | The result is adjacent and may be useful only as background. |

## 6. Light verification

Lightly open or inspect a result only to verify:

- The page exists and is not a redirect trap.
- The title and source match the search result.
- The page is current enough for the user's need.
- The page directly supports the intended section or design question.

Do not extract frameworks, quote passages, or write detailed lessons. That belongs to `knowledge-extractor`.

## 7. Source notes

For each retained result, capture only:

- Title
- URL
- Tier
- Recommendation level
- One-line reason
- Which part of the user's target it supports


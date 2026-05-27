# Dim 8 — Context Efficiency

Every installed skill has a token cost on every session, even sessions unrelated to that skill. This dimension evaluates whether the skill's token burden is proportionate to its value.

---

## Existence Flag (not scored)

Before scoring, ask: **could Claude handle 70%+ of this skill's tasks without it?**

If yes, add this flag to the review output:

> ⚠️ **存在合理性偏低**：這個 skill 處理的任務，Claude 在無 skill 的情況下也能完成大部分。安裝它會對每個 session 增加常駐負擔，建議評估是否真的需要。

This is a flag, not a score. It does not affect Overall.

---

## Scoring (1–5)

Evaluate across three cost layers:

### Layer 1 — Description 常駐成本
Loaded on every session for every user who has this skill installed.

- **Recommended range: 40–80 words**
- Below 40: likely missing trigger phrases (see Dim 1)
- Above 80: likely contains content that doesn't help triggering — move to SKILL.md body

### Layer 2 — SKILL.md 觸發成本
Loaded every time this skill triggers. Assess: is everything in SKILL.md actually needed on every invocation?

- Content that's needed every time: instructions, output format, gotchas → keep in SKILL.md
- Content needed only sometimes: detailed API refs, examples, templates → should be in `references/`
- Content never needed at runtime: background context, rationale → remove entirely

### Layer 3 — References 按需載入
References should only be loaded when explicitly needed. Assess: does SKILL.md have clear conditions for when each reference file should be read, or does it instruct Claude to read everything up front?

---

## Score Rubric

**Score 5 — Excellent**
- Description is 40–80 words with no redundant content
- SKILL.md body contains only always-needed content; heavy reference material is extracted
- References have explicit load conditions ("read this file only when X")
- Triggered token load (SKILL.md + immediately loaded refs) is under 200 lines

**Score 4 — Good**
- Description is within range but has minor redundancy
- SKILL.md is lean; one or two sections could be extracted but aren't blocking
- References have partial load conditions

**Score 3 — Acceptable**
- Description is slightly over range (80–120 words) or slightly padded
- SKILL.md has some bulky sections that could move to references
- References loaded broadly without clear conditions

**Score 2 — Weak**
- Description is clearly over range (120+ words) with obvious filler
- SKILL.md mixes always-needed and rarely-needed content without separation
- No load conditions on references — Claude reads everything on every trigger

**Score 1 — Poor**
- Description is 200+ words, far beyond what aids triggering
- SKILL.md is 500+ lines with no progressive disclosure at all
- Entire reference library loaded unconditionally on every trigger

**N/A:** Runbook, Infrastructure Ops, or other skill types where high token load is expected due to the nature of the task (multi-service investigation guides, large reference corpora). Note the category and explain why the load is justified.

---

## Key Questions

- [ ] Is the description 40–80 words?
- [ ] Does SKILL.md contain only content needed on every invocation?
- [ ] Do references have explicit conditions for when to load them?
- [ ] Could Claude do 70%+ of this skill's tasks without it? (existence flag)
- [ ] If N/A: is the high token load genuinely justified by the skill type?

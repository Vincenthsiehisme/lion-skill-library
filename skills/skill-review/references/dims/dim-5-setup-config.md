# Dim 5 — Setup & Config

Skills that need user context should handle first-run gracefully.

**Score 5 — Excellent**
- Uses `config.json` pattern: reads config, asks if missing
- Uses `${CLAUDE_SKILL_DIR}/config.json` reference
- Setup is automatic — Claude asks what it needs, stores it, never asks again
- Can use `AskUserQuestion` tool for structured multi-choice setup

**Score 4 — Good**
- Has config pattern but missing the "ask once, store, never ask again" behavior
- Setup works but requires a bit of manual guidance

**Score 3 — Acceptable**
- Has some setup handling, but manual or fragile
- Doesn't explicitly tell Claude where to store config

**Score 2 — Weak**
- Mentions configuration but provides no mechanism for storing or reading it

**Score 1 — Poor**
- Requires user context but has no setup mechanism
- Would ask for the same info every run

**N/A:** Skill doesn't need user-specific config — exclude from Overall score.

**Key questions:**
- [ ] Does the skill need user-specific config?
- [ ] If yes, does it use the `config.json` pattern?
- [ ] Will Claude ask once and remember, or ask every time?

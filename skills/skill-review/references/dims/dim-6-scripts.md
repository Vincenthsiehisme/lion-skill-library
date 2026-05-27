# Dim 6 — Scripts & Code

Giving Claude code to compose from is more powerful than instructing it to write boilerplate.

**Score 5 — Excellent**
- Has a `scripts/` or `lib/` directory with reusable helper functions
- SKILL.md tells Claude when and how to use the scripts
- Scripts handle deterministic/repetitive work; Claude handles composition

**Score 4 — Good**
- Has scripts but SKILL.md doesn't clearly tell Claude when to use them
- Scripts exist but aren't quite composable — some reconstruction still needed

**Score 3 — Acceptable**
- Has some code snippets inline, but not reusable scripts
- Claude would need to reconstruct similar logic each time

**Score 2 — Weak**
- Has one script but it's narrowly scoped; most tasks still require Claude to write from scratch

**Score 1 — Poor**
- No scripts at all, even though the skill involves repetitive programmatic tasks

**N/A:** Skill is purely instructional with no programmatic component — exclude from Overall score.

**Key questions:**
- [ ] Are there reusable scripts Claude can compose from?
- [ ] Would the skill benefit from having a `lib/` or `scripts/` folder?
- [ ] Are scripts documented with docstrings/comments?

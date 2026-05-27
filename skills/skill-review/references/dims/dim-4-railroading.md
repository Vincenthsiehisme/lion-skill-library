# Dim 4 — Railroading

Skills should give Claude intent + flexibility, not step-by-step instructions.

**Score 5 — Excellent**
- Instructions describe outcomes and constraints, not enumerated steps
- Claude has room to adapt to edge cases
- Example: "Cherry-pick onto a clean branch. Resolve conflicts preserving intent."

**Score 4 — Good**
- Mostly intent-based, with a few specific steps where truly necessary
- Edge cases would likely still be handled correctly

**Score 3 — Acceptable**
- Mix of prescriptive steps and intent-based guidance
- Some flexibility but over-specified in places

**Score 2 — Weak**
- Mostly step-by-step with occasional intent statements
- Would struggle on any variation not explicitly anticipated

**Score 1 — Poor**
- Step 1, Step 2, Step 3... with very specific commands
- No room for Claude to reason about edge cases
- Would break on any variation not anticipated by the author

**Key questions:**
- [ ] Are instructions outcome-based rather than step-enumerated?
- [ ] Does Claude have flexibility to adapt to variations?
- [ ] Would this skill still work on edge cases the author didn't anticipate?

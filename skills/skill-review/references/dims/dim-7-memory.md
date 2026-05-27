# Dim 7 — Memory / State

Stateful skills must use stable storage to survive upgrades.

**Score 5 — Excellent**
- Uses `${CLAUDE_PLUGIN_DATA}` for any persistent state
- Has a clear `## Memory` section explaining what gets stored and why
- Each run reads previous state to maintain continuity

**Score 4 — Good**
- Uses `${CLAUDE_PLUGIN_DATA}` but the Memory section is missing or unclear

**Score 3 — Acceptable**
- Has some state management but stores in skill directory (will be lost on upgrade)

**Score 2 — Weak**
- Mentions needing memory but provides no storage mechanism

**Score 1 — Poor**
- Clearly stateful skill (standup, recap, etc.) with no memory mechanism at all

**N/A:** Skill is stateless by nature — exclude from Overall score.

**Key questions:**
- [ ] Does the skill need to remember anything between runs?
- [ ] If yes, does it use `${CLAUDE_PLUGIN_DATA}`?
- [ ] Does SKILL.md describe the memory structure?

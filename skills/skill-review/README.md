# skill-reviewer

A Claude Code skill for auditing and improving other skills, based on Anthropic's documented best practices from [@trq212's thread](https://x.com/trq212/status/2033949937936085378).

## What It Does

Install this skill and ask Claude to review any SKILL.md. It will:

- Diagnose why a skill isn't triggering, producing unstable output, or wasting tokens
- Score the skill across 8 dimensions with a 1–5 rubric
- Flag existence-level concerns (skills that shouldn't exist)
- Produce a structured report with prioritised, actionable recommendations

## Installation

```bash
# Copy to your project's skills directory
cp -r skill-reviewer .claude/skills/

# Or install globally
cp -r skill-reviewer ~/.claude/skills/
```

Then restart Claude Code.

## Usage

```
review my skill
```
```
why isn't my skill triggering?
```
```
audit this skill and tell me what to fix
```

Claude will ask for your diagnostic direction first, then load only the relevant rubric files — keeping token usage proportionate to the task.

## Review Dimensions

| # | Dimension | What It Catches |
|---|-----------|-----------------|
| 1 | Description / Trigger | Under-triggering, human-readable descriptions |
| 2 | Gotchas | Missing failure capture, hypothetical warnings |
| 3 | Progressive Disclosure | Monolithic SKILL.md, missing folder structure |
| 4 | Railroading | Over-specified steps that break on edge cases |
| 5 | Setup & Config | Missing first-run config pattern |
| 6 | Scripts & Code | Boilerplate reconstruction instead of composition |
| 7 | Memory / State | State lost on upgrade, missing `${CLAUDE_PLUGIN_DATA}` |
| 8 | Context Efficiency | Bloated descriptions, unconditional reference loading, existence flag |

## File Structure

```
skill-reviewer/
├── SKILL.md                          # Main entry point
├── README.md                         # This file
├── assets/
│   └── review-template.md            # Blank review output template
└── references/
    ├── categories.md                 # 9 skill type patterns & anti-patterns
    └── dims/
        ├── dim-1-description.md
        ├── dim-2-gotchas.md
        ├── dim-3-progressive-disclosure.md
        ├── dim-4-railroading.md
        ├── dim-5-setup-config.md
        ├── dim-6-scripts.md
        ├── dim-7-memory.md
        └── dim-8-context-efficiency.md
```

Each dimension rubric is a separate file loaded on demand — so a targeted "why isn't this triggering?" review only loads `dim-1-description.md`, not the entire checklist.

## Design Notes

- **Lazy loading**: dimension files are loaded conditionally based on the diagnostic direction, reducing token cost for targeted reviews
- **Existence flag**: Dim 8 includes a non-scored flag for skills whose tasks Claude could handle 70%+ of without any skill installed
- **N/A scoring**: Dimensions 5, 6, 7, and 8 support N/A for skills where they don't apply — N/A dimensions are excluded from the Overall score denominator

## Contributing

Gotchas should come from real failures. If you find a pattern this skill misses or gets wrong, open a PR adding it to the relevant `## Gotchas` section.

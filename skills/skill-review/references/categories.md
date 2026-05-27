# Skill Categories

Based on Anthropic's internal taxonomy. Durable skills fit cleanly into one category.
Skills that straddle multiple categories are often confusing and should be split.

---

## 1. Library & API Reference

**Purpose:** Explain how to correctly use a library, CLI, or SDK.

**Should include:**
- Edge cases and footguns specific to this library
- A `references/` folder with code snippets for common patterns
- A strong Gotchas section (the core value of this skill type)
- Common error messages and how to handle them

**Should NOT include:**
- General coding advice Claude already knows
- Official documentation reproduced verbatim (link to it instead)

**Examples:** `billing-lib`, `internal-platform-cli`, `frontend-design`

---

## 2. Product Verification

**Purpose:** Describe how to test or verify that code is working.

**Should include:**
- A `scripts/` folder with verification scripts (Playwright, tmux drivers, etc.)
- Instructions for asserting state at each step
- Hooks for recording output (e.g., video capture)
- Clear pass/fail criteria

**Should NOT include:**
- General "write tests" advice — this is about driving a running product

**Examples:** `signup-flow-driver`, `checkout-verifier`, `tmux-cli-driver`

---

## 3. Data Fetching & Analysis

**Purpose:** Connect Claude to data and monitoring stacks.

**Should include:**
- A `lib/` folder with data-fetching helper functions
- Canonical table/field names and join patterns
- Dashboard IDs, cluster names, credential patterns
- Common analysis workflows as code

**Should NOT include:**
- Generic data science advice
- SQL tutorials

**Examples:** `funnel-query`, `cohort-compare`, `grafana`

---

## 4. Business Process & Team Automation

**Purpose:** Automate repetitive multi-tool workflows into one command.

**Should include:**
- Log file pattern using `${CLAUDE_PLUGIN_DATA}` for reflecting on previous runs
- Dependencies on other skills or MCPs (document them)
- Setup config for user-specific context (Slack channel, ticket project, etc.)
- Clear output format

**Should NOT include:**
- Instructions that over-specify every sub-step (leave room to adapt)

**Examples:** `standup-post`, `create-ticket`, `weekly-recap`

---

## 5. Code Scaffolding & Templates

**Purpose:** Generate framework-correct boilerplate for a specific function.

**Should include:**
- Template files in `assets/` to copy and customize
- Natural language constraints that can't be captured in code alone
- Common gotchas when setting up this scaffold
- Scripts to wire up auth, logging, deploy config

**Should NOT include:**
- Generic "how to write good code" advice

**Examples:** `new-workflow`, `new-migration`, `create-app`

---

## 6. Code Quality & Review

**Purpose:** Enforce code quality and help review code.

**Should include:**
- Deterministic lint/style scripts in `scripts/`
- Instructions for spawning a fresh-eyes sub-agent (adversarial review pattern)
- Org-specific style rules that Claude doesn't know by default
- Testing philosophy and patterns

**Should NOT include:**
- General "write clean code" platitudes

**Examples:** `adversarial-review`, `code-style`, `testing-practices`

---

## 7. CI/CD & Deployment

**Purpose:** Help fetch, push, and deploy code safely.

**Should include:**
- References to data-fetching skills for pre-deploy checks
- Rollback procedures and error-rate thresholds
- On-demand hooks for safety guardrails (use `/careful` hook pattern)
- PR template and merge prerequisites

**Should NOT include:**
- Generic git tutorials

**Examples:** `babysit-pr`, `deploy-service`, `cherry-pick-prod`

---

## 8. Runbooks

**Purpose:** Take a symptom → investigate → produce structured report.

**Should include:**
- Symptom-to-tool mapping table
- A `references/` folder with per-service debugging guides
- Standard output format for findings
- Hub-and-spoke structure: SKILL.md dispatches to per-symptom files

**Should NOT include:**
- Instructions to fix problems (runbooks investigate and report, not remediate)

**Examples:** `service-debugging`, `oncall-runner`, `log-correlator`

---

## 9. Infrastructure Operations

**Purpose:** Routine maintenance with guardrails for destructive actions.

**Should include:**
- On-demand hooks that block destructive commands (rm -rf, DROP TABLE, etc.)
- Soak periods and confirmation gates before irreversible actions
- Notification steps (post to Slack before acting)
- Dependency approval workflows

**Should NOT include:**
- Unguarded destructive operations

**Examples:** `resource-orphans`, `dependency-management`, `cost-investigation`

---

## Multi-Category Warning Signs

A skill that combines two or more categories often has these symptoms:
- SKILL.md is very long (>500 lines) trying to cover multiple concerns
- The trigger description is vague or covers too many scenarios
- It works for some use cases but fails on others
- Hard to name clearly ("deployment-and-testing-helper")

**Recommendation:** Split into focused skills and have one compose the other.

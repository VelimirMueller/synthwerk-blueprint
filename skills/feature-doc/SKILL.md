---
name: feature-doc
description: Write or update docs/features/<slug>.md for every feature a change touches, in ASD-STE100 bullets, then run the feature-doc check. Required in every synthwerk-* repo. Use before a PR, before /ship, when the user says "feature doc", "document this feature", or when CI fails with "no feature doc covers this path" or "not updated, but … changed".
---

# /feature-doc — keep feature docs true

Every `synthwerk-*` repo documents each feature in `docs/features/<slug>.md` (decision D-16).
This skill writes and updates these files. CI fails a PR that changes feature source without
its doc, so run this skill before every PR.

## When it must run

| Trigger | Run? |
|---|---|
| The change touches a path that a feature doc covers (`paths:` globs) | yes |
| The change adds an API operation, event type, MCP tool or domain package | yes (new doc) |
| The change touches only tests, CI, dependencies, formatting or docs | no (the check skips) |
| Before `/ship` | yes |

## Steps

1. Get the changed files: `git diff --name-only origin/main...HEAD` (plus uncommitted files from
   `git status --porcelain`).
2. Read every `docs/features/*.md` (skip files that start with `_`). Match each changed path
   against the `paths:` globs in the frontmatter.
3. For each matched doc: read the diff of the matched paths. Update the doc (see "Update rules").
4. For a changed source path that no doc covers:
   - Path belongs to an existing feature → add a glob to that doc's `paths:`.
   - New feature (new route, event, MCP tool, or `internal/<domain>/`) → create a new doc from
     `docs/features/_template.md`. Slug = kebab-case feature name = file name.
5. Rewrite all prose you touched to ASD-STE100 (see "Writing rules").
6. Run the check and show the result to the user:

   ```sh
   node <blueprint>/actions/feature-doc/check.mjs --base origin/main
   ```

   `<blueprint>` is a local clone of `synthwerk-blueprint`. Exit 0 = pass, 1 = fail, 2 = git
   error (fetch `origin/main` first).
7. Fix every error. Fix warnings when the fix is easy.

## File format

Path: `docs/features/<slug>.md`. Template: `templates/_common/docs/features/_template.md`.

```markdown
---
title: Widget session token
slug: widget-session-token          # = file name without .md
status: stable                      # planned | beta | stable | deprecated
epic: E2
owner: identity
paths: ["internal/widgettoken/**"]  # globs; ** = any depth, * = one segment
api: ["identity.createWidgetToken"] # operationIds
events: ["dev.synthwerk.identity.app.changed.v1"]
mcp: []                             # MCP tool names
updated: 2026-10-09                 # YYYY-MM-DD, date of this change
---
```

Sections, in this order. Keep a section with "None." when it is empty.

1. `# <title>` and `> **In 30 seconds**` with 2–4 bullets.
2. `## What it does` — bullets.
3. `## How to use` — numbered steps.
4. `## Rules and limits` — table `| Rule | Value |`.
5. `## Events` — table `| Type | When |`.
6. `## Errors` — table `| Status | Problem type | Cause |`.
7. `## Tests` — bullets: `` `tests/<level>/<file>` — `<method - condition - outcome>` ``.
8. `## Changes` — table `| Date | Change |`, newest row first.

## Update rules (existing doc)

- Change only what the diff changes. Keep correct text as it is.
- Remove statements that the code no longer makes true.
- Set `updated:` to today. Add one row to `## Changes` (newest first).
- Add new operationIds, event types and MCP tools to the frontmatter lists and to the sections.
- Keep `slug` and the file name. A renamed feature keeps its slug.
- A removed feature: set `status: deprecated` and say what replaces it. Do not delete the file in
  the same PR.

## Writing rules (ASD-STE100)

- Use bullets. One fact per bullet.
- Max 20 words per sentence. The check warns above 20.
- Use the active voice and the present tense: "The service signs the token."
- Use the imperative for steps: "Send the token in the header."
- Use one word for one thing. Do not use synonyms for a term.
- Give numbers and units: "The token expires after 15 minutes."
- Do not use marketing words ("seamless", "powerful", "blazing").
- Do not use "should", "may" or "might" for rules. Use "must" or "can".

## How CI checks it

The reusable workflow `feature-doc.yml` runs `actions/feature-doc/check.mjs` on each PR:

| Situation | Result |
|---|---|
| Source path (`src/**`, `internal/**`, `api/**`, `app/**`) changed, covering doc not changed | error |
| Source path changed, no doc covers it | error |
| Frontmatter invalid (title, slug, status, updated, paths) | error |
| Changed doc has a sentence above 20 words | warning |
| Only tests, CI, dependencies or docs changed | pass |

Opt-out for a change with no feature effect: add the label `no-feature-doc` **and** a line
`no-feature-doc: <reason>` in the PR body. A label without a reason still fails.

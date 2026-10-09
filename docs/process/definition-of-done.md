# Definition of Done

- Source: `08-roadmap-and-epics.md` §8 (ecosystem plan, 2026-10-09). Change it there first.
- A story is done only when every item is true.

| # | Item | How to check |
|---|---|---|
| D1 | All acceptance criteria pass. | Test names map to ACs |
| D2 | Tests exist at the right level in `tests/` (D-15). Names follow `method - condition - outcome`. | CI |
| D3 | Lint, format, type check pass: Biome + vue-tsc / gofmt + golangci-lint / ruff + mypy strict (D-06). | CI |
| D4 | Coverage does not drop below the repo gate. | CI |
| D5 | **`dual-review` is a fresh PASS** (DeepSeek + GLM). BLOCKED or a missing key means not done. | `dual-review --status` |
| D6 | **`docs/features/<feature>.md` is updated by `/feature-doc`.** README is current. | PR diff |
| D7 | **An ADR exists** for each new decision. `01-decisions.md` is updated first if a D-xx changes. | PR diff |
| D8 | **Logs** are JSON with `trace_id` and `request_id`. No secrets, no personal data, no prompt text. | Log-shape test |
| D9 | OTel spans and RED metrics exist for new endpoints. | Trace in SigNoz |
| D10 | Contracts are updated. Generated clients compile. | Contract CI |
| D11 | No new critical vulnerability. No secret in the diff. | CI scans |
| D12 | i18n keys exist in de and en. a11y check passes for UI changes. | CI |
| D13 | The PR has the build note and the review verdict. | PR template |
| D14 | Merged to `main`. Deployed to dev. Post-deploy smoke is green. | Pipeline |

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/banner-dark.svg">
  <img alt="synthwerk-blueprint — shared CI, configs and templates" src="docs/assets/banner-light.svg" width="100%">
</picture>

[![selftest](https://github.com/VelimirMueller/synthwerk-blueprint/actions/workflows/selftest.yml/badge.svg?branch=main)](https://github.com/VelimirMueller/synthwerk-blueprint/actions/workflows/selftest.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## In 30 seconds

- One repo makes all `synthwerk-*` repos build, lint and document the same way.
- It gives reusable GitHub workflows, lint configs, templates and the `/feature-doc` skill.
- A repo adopts it in 5 steps. Updates arrive as normal PRs.

## What is inside

| Path | Content |
|---|---|
| `.github/workflows/ts-ci.yml` | TypeScript / Vue: pnpm, `biome ci`, `vue-tsc` or `tsc`, Vitest, build, `v-html` ban |
| `.github/workflows/go-ci.yml` | Go: gofmt, golangci-lint v2, `go test`, `go build` |
| `.github/workflows/py-ci.yml` | Python: uv, ruff check + format, mypy strict, pytest |
| `.github/workflows/image.yml` | Image: build, SBOM (syft), Trivy (fails on critical), push to GHCR and cosign sign on `main` / `v*` only |
| `.github/workflows/feature-doc.yml` | Fails a PR that changes feature source without its feature doc |
| `examples/workflows/` | Thin caller workflows to copy into a repo |
| `packages/biome-config/` | npm package `@synthwerk/biome-config` (Biome 2.5, formatter ON) |
| `configs/go/`, `configs/python/` | `.golangci.yml`, `ruff.toml`, mypy strict snippet |
| `templates/_common/` | README skeleton, PR and issue templates, CODEOWNERS, ADR and feature-doc templates, `renovate.json` |
| `renovate/default.json` | Renovate preset |
| `skills/feature-doc/` | Claude skill `/feature-doc` (plugin `synthwerk`) |
| `actions/feature-doc/` | The feature-doc checker (Node, no dependencies) |
| `docs/process/` | Definition of Ready and Definition of Done |

## Adopt the blueprint

1. **Workflows.** Copy `examples/workflows/ci-<ts|go|py>.yml` to `.github/workflows/ci.yml`.
   Copy `feature-doc.yml`. Copy `deliver.yml` when the repo has a `Dockerfile`.
2. **Lint config.**
   - TS / Vue: `pnpm add -D -E @biomejs/biome@2.5.15 @synthwerk/biome-config`, then
     `biome.json` = `{ "extends": ["@synthwerk/biome-config"] }`.
   - Go: copy `configs/go/.golangci.yml` to the repo root.
   - Python: copy `configs/python/ruff.toml` to the repo root. Paste `configs/python/mypy.toml`
     into `pyproject.toml`.
3. **Templates.** Copy `templates/_common/` into the repo root. Replace every `<placeholder>`.
4. **Claude skill.** Add to `.claude/settings.json` in the repo:

   ```json
   {
     "extraKnownMarketplaces": {
       "synthwerk": { "source": { "source": "github", "repo": "VelimirMueller/synthwerk-blueprint" } }
     },
     "enabledPlugins": { "synthwerk@synthwerk": true }
   }
   ```

   Or install it once: `/plugin install synthwerk --marketplace VelimirMueller/synthwerk-blueprint`.
   Add to the repo `CLAUDE.md`: "Run `/feature-doc` before a PR."
5. **Required checks.** Set `ci / required` and `feature-doc / check` as required checks on
   `main` (ruleset in `synthwerk-infra`).

## Rules for the workflows

- Callers use `@v1`. The `v1` tag moves on minor and patch releases. A breaking input change
  makes `v2`.
- Third-party actions are pinned by full commit SHA with a version comment. Renovate
  (`helpers:pinGitHubActionDigests`) keeps the pins current.
- Each job gets `contents: read` only. `image.yml` also needs `packages: write` and
  `id-token: write`. The caller must grant them, also for pull requests.
- Every `run` step uses `bash -euo pipefail`.

## Rules for dependency updates (Renovate)

- Renovate opens an update PR only when the release is **7 days** old (`minimumReleaseAge`,
  `internalChecksFilter: strict`). This blocks a hijacked release that is pulled within days.
- Only patch updates of dev dependencies merge automatically, after the 7 days and green CI.
- Security fixes (`vulnerabilityAlerts`) do not wait. They get the label `security`.
- Majors, base images, Biome and `@synthwerk/*` packages never merge automatically.

## Development

```sh
just lint   # actionlint, zizmor, Biome
just test   # node --test: Biome, golangci-lint, ruff, mypy configs and the feature-doc checker
```

- Tools: Node 24 + pnpm, Go 1.27, golangci-lint v2.14, uv (runs ruff 0.16.10, mypy 2.4.0,
  zizmor 1.30.1), actionlint 1.7.12, just.
- Tests live in `tests/`. Fixtures live in `tests/fixtures/`.

## License

- [MIT](LICENSE)

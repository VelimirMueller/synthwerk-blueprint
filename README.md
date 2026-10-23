<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/banner/hero-v2-light.svg">
  <img alt="SYNTHWERK-BLUEPRINT. Shared CI, configs and templates. The arguments already happened. Stable, v1.0.1." src="assets/banner/hero-v2-dark.svg" width="100%">
</picture>
</p>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/lead-v2-light.svg">
  <img alt="synthwerk-blueprint makes every synthwerk-* repo build, lint and document the same way. A repo adopts it in five steps. Updates arrive as normal PRs. Nothing applies itself." src="assets/readme/lead-v2-dark.svg" width="100%">
</picture>
</p>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/stats-v2-light.svg">
  <img alt="5 REUSABLE WORKFLOWS. 3 LANGUAGES, ONE LINT. 1.0.1 CURRENT RELEASE. 0 DEPS IN THE CHECKER" src="assets/readme/stats-v2-dark.svg" width="100%">
</picture>
</p>

<br>

<p>
<img alt="01 WHAT IT DOES. FIVE STEPS. SAME CI EVERYWHERE." src="assets/readme/divider-what-v2.svg" width="100%">
</p>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/features-v2-light.svg">
  <img alt="WORKFLOWS: Reusable CI for TypeScript, Go and Python. Image build with SBOM, Trivy scan and cosign signing. Callers pin @v1. CONFIGS: @synthwerk/biome-config, .golangci.yml, ruff.toml and a mypy strict snippet. Copy the file. Done. TEMPLATES: README skeleton, PR and issue templates, CODEOWNERS, ADR and feature-doc templates, Renovate preset. Plus the /feature-doc skill" src="assets/readme/features-v2-dark.svg" width="100%">
</picture>
</p>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/what-v2-light.svg">
  <img alt="One repo for the family: It holds the CI, the lint configs and the templates for the whole synthwerk family. Thin callers: The caller workflow stays at about 10 lines. The job matrix lives here. Docs or no merge: A PR that changes feature source without its feature doc fails the check. The checker has zero dependencies. Strict by default: Every run step runs bash -euo pipefail. Every job gets contents: read only" src="assets/readme/what-v2-dark.svg" width="100%">
</picture>
</p>

<br>

<p>
<img alt="02 QUICK START. COPY. PASTE. GREEN." src="assets/readme/divider-start-v2.svg" width="100%">
</p>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/start-v2-light.svg">
  <img alt="Terminal: $ gh repo clone VelimirMueller/synthwerk-blueprint | $ cp examples/workflows/ci-ts.yml .github/workflows/ci.yml | $ pnpm add -D -E @biomejs/biome@2.5.15 @synthwerk/biome-config | # two files. the same ci as every synthwerk repo." src="assets/readme/start-v2-dark.svg" width="100%">
</picture>
</p>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/adopt12-v2-light.svg">
  <img alt="Terminal: # 1) workflows (pick ci-ts.yml, ci-go.yml or ci-py.yml) | $ cp examples/workflows/ci-ts.yml .github/workflows/ci.yml | $ cp examples/workflows/feature-doc.yml .github/workflows/ | $ cp examples/workflows/deliver.yml .github/workflows/   # only with a Dockerfile | # 2) lint config (TS / Vue) | $ pnpm add -D -E @biomejs/biome@2.5.15 @synthwerk/biome-config | # biome.json in the repo root: | { &quot;extends&quot;: [&quot;@synthwerk/biome-config&quot;] } | # steps 3 to 5 (templates, Claude skill, required checks): see 04 USAGE" src="assets/readme/adopt12-v2-dark.svg" width="100%">
</picture>
</p>

<details>
<summary><picture><source media="(prefers-color-scheme: light)" srcset="assets/readme/links-7-v2-light.svg"><img alt="Plain text" src="assets/readme/links-7-v2-dark.svg" width="32%"></picture></summary>

```bash
# 1) workflows (pick ci-ts.yml, ci-go.yml or ci-py.yml)
cp examples/workflows/ci-ts.yml .github/workflows/ci.yml
cp examples/workflows/feature-doc.yml .github/workflows/
cp examples/workflows/deliver.yml .github/workflows/   # only with a Dockerfile

# 2) lint config (TS / Vue)
pnpm add -D -E @biomejs/biome@2.5.15 @synthwerk/biome-config
```

```json
{ "extends": ["@synthwerk/biome-config"] }
```

</details>

<br>

<p>
<img alt="03 HOW IT WORKS. THIN CALLERS, FAT WORKFLOWS." src="assets/readme/divider-how-v2.svg" width="100%">
</p>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/flow-v2-light.svg">
  <img alt="CALLER REPO -&gt; @V1 TAG -&gt; BLUEPRINT -&gt; RENOVATE. The heavy workflows live here. Your repo stays thin." src="assets/readme/flow-v2-dark.svg" width="100%">
</picture>
</p>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/gate-v2-light.svg">
  <img alt="CI.YML -&gt; @V1 -&gt; REQUIRED ON MAIN -&gt; MERGE. Renovate re-pins the SHAs, 7 days late." src="assets/readme/gate-v2-dark.svg" width="100%">
</picture>
</p>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/how-v2-light.svg">
  <img alt="Reusable workflows: Callers use @v1. The v1 tag moves on minor and patch releases. A breaking input change makes v2. Pinned supply chain: Third-party actions are pinned by full commit SHA with a version comment. Renovate (helpers:pinGitHubActionDigests) keeps the pins current. Least privilege: Each job gets contents: read only. image.yml also needs packages: write and id-token: write. The caller must grant them, also for pull requests. Renovate waits: An update PR opens only when the release is 7 days old. Settings: minimumReleaseAge and internalChecksFilter: strict. A hijacked release has to stay quiet for a week" src="assets/readme/how-v2-dark.svg" width="100%">
</picture>
</p>

<br>

<p>
<img alt="04 USAGE. EVERY PATH, CONDENSED." src="assets/readme/divider-usage-v2.svg" width="100%">
</p>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/inside-v2-light.svg">
  <img alt=".github/workflows/ts-ci.yml: TypeScript / Vue: pnpm, biome ci, vue-tsc or tsc, Vitest, build, v-html ban. .github/workflows/go-ci.yml: Go: gofmt, golangci-lint v2, go test, go build. .github/workflows/py-ci.yml: Python: uv, ruff check + format, mypy strict, pytest. .github/workflows/image.yml: Image: build, SBOM (syft), Trivy (fails on critical), push to GHCR and cosign sign on main / v* only. .github/workflows/feature-doc.yml: Fails a PR that changes feature source without its feature doc. examples/workflows/: Thin caller workflows to copy into a repo. packages/biome-config/: npm package @synthwerk/biome-config (Biome 2.5, formatter ON). configs/go/, configs/python/: .golangci.yml, ruff.toml, mypy strict snippet. templates/_common/: README skeleton, PR and issue templates, CODEOWNERS, ADR and feature-doc templates, renovate.json. renovate/default.json: Renovate preset. skills/feature-doc/: Claude skill /feature-doc (plugin synthwerk). actions/feature-doc/: The feature-doc checker (Node, no dependencies). docs/process/: Definition of Ready (docs/process/definition-of-ready.md) and Definition of Done (docs/process/definition-of-done.md)" src="assets/readme/inside-v2-dark.svg" width="100%">
</picture>
</p>

<p align="center">
<a href="docs/process/definition-of-ready.md"><picture><source media="(prefers-color-scheme: light)" srcset="assets/readme/links-1-v2-light.svg"><img alt="Definition of Ready (docs/process/definition-of-ready.md)" src="assets/readme/links-1-v2-dark.svg" width="32%"></picture></a>
<a href="docs/process/definition-of-done.md"><picture><source media="(prefers-color-scheme: light)" srcset="assets/readme/links-2-v2-light.svg"><img alt="Definition of Done (docs/process/definition-of-done.md)" src="assets/readme/links-2-v2-dark.svg" width="32%"></picture></a>
<a href="examples/workflows/"><picture><source media="(prefers-color-scheme: light)" srcset="assets/readme/links-3-v2-light.svg"><img alt="Caller workflows (examples/workflows/)" src="assets/readme/links-3-v2-dark.svg" width="32%"></picture></a>
</p>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/adopt-v2-light.svg">
  <img alt="Workflows: Copy examples/workflows/ci-&lt;ts|go|py&gt;.yml to .github/workflows/ci.yml. Copy feature-doc.yml. Copy deliver.yml when the repo has a Dockerfile. Lint config: TS / Vue: pnpm add -D -E @biomejs/biome@2.5.15 @synthwerk/biome-config, then biome.json = { &quot;extends&quot;: [&quot;@synthwerk/biome-config&quot;] }. Go: copy configs/go/.golangci.yml to the repo root. Python: copy configs/python/ruff.toml to the repo root. Paste configs/python/mypy.toml into pyproject.toml. Templates: Copy templates/_common/ into the repo root. Replace every &lt;placeholder&gt;. Claude skill: Add the marketplace to .claude/settings.json in the repo (JSON below). Or install it once: /plugin install synthwerk --marketplace VelimirMueller/synthwerk-blueprint. Add to the repo CLAUDE.md: &quot;Run /feature-doc before a PR.&quot;. Required checks: Set ci / required and feature-doc / check as required checks on main (ruleset in synthwerk-infra)" src="assets/readme/adopt-v2-dark.svg" width="100%">
</picture>
</p>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/skill-v2-light.svg">
  <img alt="Terminal: { |   &quot;extraKnownMarketplaces&quot;: { |     &quot;synthwerk&quot;: { &quot;source&quot;: { &quot;source&quot;: &quot;github&quot;, &quot;repo&quot;: &quot;VelimirMueller/synthwerk-blueprint&quot; } } |   }, |   &quot;enabledPlugins&quot;: { &quot;synthwerk@synthwerk&quot;: true } | }" src="assets/readme/skill-v2-dark.svg" width="100%">
</picture>
</p>

<details>
<summary><picture><source media="(prefers-color-scheme: light)" srcset="assets/readme/links-7-v2-light.svg"><img alt="Plain text" src="assets/readme/links-7-v2-dark.svg" width="32%"></picture></summary>

```json
{
  "extraKnownMarketplaces": {
    "synthwerk": { "source": { "source": "github", "repo": "VelimirMueller/synthwerk-blueprint" } }
  },
  "enabledPlugins": { "synthwerk@synthwerk": true }
}
```

```text
/plugin install synthwerk --marketplace VelimirMueller/synthwerk-blueprint
```

```sh
just lint   # actionlint, zizmor, Biome
just test   # node --test: Biome, golangci-lint, ruff, mypy configs and the feature-doc checker
```

</details>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/renovate-v2-light.svg">
  <img alt="7 days old: Renovate opens an update PR only when the release is 7 days old. This blocks a hijacked release that is pulled within days. Auto-merge: dev patches only: Only patch updates of dev dependencies merge automatically, after the 7 days and green CI. Security fixes do not wait: Security fixes (vulnerabilityAlerts) do not wait. They get the label security. Never automatic: Majors, base images, Biome and @synthwerk/* packages never merge automatically" src="assets/readme/renovate-v2-dark.svg" width="100%">
</picture>
</p>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/dev-v2-light.svg">
  <img alt="just lint: actionlint, zizmor, Biome. just test: node --test: Biome, golangci-lint, ruff, mypy configs and the feature-doc checker. tools: Node 24 + pnpm, Go 1.27, golangci-lint v2.14, uv (runs ruff 0.16.10, mypy 2.4.0, zizmor 1.30.1), actionlint 1.7.12, just. tests/: Tests live here. Fixtures live in tests/fixtures/" src="assets/readme/dev-v2-dark.svg" width="100%">
</picture>
</p>

<br>

<p>
<img alt="05 STATUS. TESTED. NOT BY VIBES." src="assets/readme/divider-status-v2.svg" width="100%">
</p>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/status-v2-light.svg">
  <img alt="CI workflows (ts, go, py, image): released, selftest green. feature-doc check: v1.0.1, zero deps. templates and process docs: in use. @synthwerk/biome-config: local package, not on npm. adoption by synthwerk repos: M0, in progress" src="assets/readme/status-v2-dark.svg" width="100%">
</picture>
</p>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/now-v2-light.svg">
  <img alt="Status: v1.0.1, released 2026-10-09. Works: ts, go, py, image, feature-doc. Next: npm publish, synthwerk adoption" src="assets/readme/now-v2-dark.svg" width="100%">
</picture>
</p>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/selftest-v2-light.svg">
  <img alt="Selftest: The lint and test suites run in CI (selftest.yml) and locally: just lint and just test. Releases: Releases and the moving v1 tag are documented in CHANGELOG.md" src="assets/readme/selftest-v2-dark.svg" width="100%">
</picture>
</p>

<p align="center">
<a href="https://github.com/VelimirMueller/synthwerk-blueprint/actions/workflows/ci.yml"><picture><source media="(prefers-color-scheme: light)" srcset="assets/readme/links-4-v2-light.svg"><img alt="Selftest (https://github.com/VelimirMueller/synthwerk-blueprint/actions/workflows/selftest.yml)" src="assets/readme/links-4-v2-dark.svg" width="32%"></picture></a>
<a href="CHANGELOG.md"><picture><source media="(prefers-color-scheme: light)" srcset="assets/readme/links-5-v2-light.svg"><img alt="Changelog (CHANGELOG.md)" src="assets/readme/links-5-v2-dark.svg" width="32%"></picture></a>
<a href="LICENSE"><picture><source media="(prefers-color-scheme: light)" srcset="assets/readme/links-6-v2-light.svg"><img alt="License (LICENSE)" src="assets/readme/links-6-v2-dark.svg" width="32%"></picture></a>
</p>

<p>
<picture>
  <source media="(prefers-color-scheme: light)" srcset="assets/readme/footer-v2-light.svg">
  <img alt="VM. studio / flagship · open source · look per vm-brand playbook · MIT (c) 2026 Velimir Mueller · -- EOF -- five files. one standard. --" src="assets/readme/footer-v2-dark.svg" width="100%">
</picture>
</p>

# Changelog

All notable changes to this project are documented here. Releases are tagged
`v<version>`; the moving `v1` tag follows minor and patch releases.

## Unreleased

### Changed

- The repo's own CI moves from `selftest.yml` to `ci.yml` on the fleet standard
  (fleet-workflows `v0.0.2`, fleet-standard#10). It runs on pull requests and by
  hand only, no longer on push to `main`. Required check context: `conclusion`.
  The reusable workflows and their inputs do not change.
- `fleet.yml` declares the workflow publisher role (fleet-standard WF-PUB-01/02): the
  reusable workflows keep their names and job ids for the `@v1` callers, and the
  `deploy-selftest` and `provenance` jobs count as selftests, not deploy jobs.
- The reusable workflows get step names and the fleet key order. Inputs, outputs, job
  ids and behaviour do not change; step names show in the callers' run logs.

## 1.1.0 - 2026-10-21

### Changed (callers must act)

- `image.yml` callers must grant `attestations: write` (next to `contents: read`,
  `packages: write`, `id-token: write`). Without it GitHub refuses to start the
  workflow. Update the caller in the same step as the `v1` move.

### Added

- `.github/workflows/deploy.yml`: reusable deploy of one image by digest to one
  GitHub environment. It reaches a Docker host over SSH, pins
  `<image>@<digest>` in `compose.digest.yaml`, runs `docker compose up --wait` and
  fails unless the running container has that digest. Without the `DEPLOY_*`
  secrets it skips with a notice (synthwerk#27).
- `actions/deploy`: the deploy and verify step, also usable on its own.
- `image.yml`: every pushed digest gets a build provenance attestation
  (`actions/attest-build-provenance`). The digest output comes from the push
  itself, not from a later read of the tag.
- `actions/verify-provenance`: `gh attestation verify` with signer workflow
  (blueprint `image.yml`), repo, source ref and commit. `deploy.yml` and the tag
  promote fail when it fails.
- `image.yml`: input `build-args` (one `KEY=value` per line). `COMMIT=<github.sha>`
  is now always passed, so `/readyz` reports the real commit.
- `image.yml`: input `promote-on-tag`. A `v*` tag then does not build; it adds the
  version tag to the digest that `main` built for the same commit. New outputs
  `image` and `commit`.
- `examples/workflows/deliver.yml`: main deploys to dev, a `v*` tag promotes to stg
  and prd. `examples/workflows/redeploy.yml`: manual deploy of an old digest
  (rollback).
- `docs/conventions/deploy.md`: flow, host contract, environment secrets, rollback.
- `selftest.yml`, job `deploy`: runs `actions/deploy` against a throwaway SSH +
  Docker target on the runner. A wrong or missing digest must fail.
- `.github/actionlint.yaml`: ignore the self-repository syntax (`uses: $/…`), which
  actionlint 1.7.12 does not know yet.
- `docs/conventions/python-service.md`: conventions for Python services:
  `/healthz` and `/readyz`, OpenTelemetry setup, JSON logs, env names, and why
  Python services skip the outbox for now. Includes a checklist for a new
  service (synthwerk#71).

## 1.0.1 - 2026-10-09

### Fixed

- `actions/feature-doc`: deleted files (`D`) and pure renames (`R100`) no longer
  count as source changes. A rename with a content change (`R<100`) counts under
  its new path. A pure-rename or deletion-only PR now passes the check.

## 1.0.0 - 2026-10-09

Initial release: reusable CI workflows (TS/Go/Python/image/feature-doc), lint
configs, `@synthwerk/biome-config`, templates, the `/feature-doc` skill and
checker.

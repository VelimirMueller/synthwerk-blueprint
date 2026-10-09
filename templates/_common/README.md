<!-- Synthwerk README skeleton (D-16). Replace every <placeholder>. Keep the section order. -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/assets/banner-dark.svg">
  <img alt="synthwerk-<role> — <tagline>" src="docs/assets/banner-light.svg" width="100%">
</picture>

[![ci](https://github.com/VelimirMueller/synthwerk-<role>/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/VelimirMueller/synthwerk-<role>/actions/workflows/ci.yml)
[![release](https://img.shields.io/github/v/release/VelimirMueller/synthwerk-<role>?sort=semver)](https://github.com/VelimirMueller/synthwerk-<role>/releases)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![contracts](https://img.shields.io/badge/contracts-<version>-informational)](https://github.com/VelimirMueller/synthwerk-contracts)

## In 30 seconds

- <What the service does, in one sentence.>
- <Who calls it, or what it calls.>
- <One number: latency, limit or size.>

## Where it fits

```mermaid
flowchart LR
  caller[<caller>] --> svc[synthwerk-<role>]
  svc --> dep[<dependency>]
```

- Ecosystem map: [synthwerk](https://github.com/VelimirMueller/synthwerk).

## Quick start

```sh
just dev    # start the service and its dependencies
just test   # run unit, integration, contract and component tests
```

## API and events

- API spec: [synthwerk-contracts/<path>](https://github.com/VelimirMueller/synthwerk-contracts).
- Events: <link to the event catalog entries>.

| Endpoint | Use | Code |
|---|---|---|
| `GET /healthz` | Liveness. No dependency checks. | 200 / 503 |
| `GET /readyz` | Readiness. Checks the required dependencies. | 200 / 503 |
| `GET /v1/status` | Build info and every dependency check. Needs a service or admin token. | 200 |

## Configuration

| Variable | Required | Use |
|---|---|---|
| `SYNTHWERK_<NAME>` | yes | <use> |

- Names only. Values live in the environment, never in the repo.

## Development

```text
<layout tree: cmd/, internal/ or src/, tests/>
```

| Level | Folder | Command |
|---|---|---|
| unit | `tests/unit/` | `just test-unit` |
| integration | `tests/integration/` | `just test-integration` |
| contract | `tests/contract/` | `just test-contract` |
| component | `tests/component/` | `just test-component` |

## Deploy

- Merge to `main` deploys to **dev**. A `vX.Y.Z` tag deploys to **stg**.
- **prd** gets the same image digest after a manual approval.
- Infrastructure: [synthwerk-infra](https://github.com/VelimirMueller/synthwerk-infra).

## Features

<!-- One row per docs/features/*.md. /feature-doc keeps this table current. -->

| Feature | Status |
|---|---|
| [<title>](docs/features/<slug>.md) | <status> |

## Security

- Report a vulnerability as described in [SECURITY.md](SECURITY.md).

## License

- [MIT](LICENSE)

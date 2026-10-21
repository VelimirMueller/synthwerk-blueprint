# Deploy by digest

- Scope: every Synthwerk service with a Dockerfile. First caller: `synthwerk-vision`.
- Goal: build an image once, then promote the same digest: dev, stg, prd. A rollback deploys an older digest. Nothing rebuilds.
- Ticket: [synthwerk#27](https://github.com/VelimirMueller/synthwerk/issues/27). Host choice: [synthwerk#7](https://github.com/VelimirMueller/synthwerk/issues/7), [synthwerk#8](https://github.com/VelimirMueller/synthwerk/issues/8).

## 1. Flow

| Trigger | Image | Deploy |
|---|---|---|
| Pull request | `image.yml` builds, writes the SBOM, scans. No push. | None. |
| Push to `main` | `image.yml` builds, pushes `sha-<commit>`, signs. Output: `digest`. | `dev`, with that digest. |
| Push of tag `vX.Y.Z` | `image.yml` with `promote-on-tag: true` does not build. It finds `sha-<commit>` from the main build and adds the version tag to the same digest. | `stg`, then `prd` (after `stg` passed and a reviewer approved). |
| Manual (`redeploy.yml`) | None. | Any environment, any existing digest. This is the rollback. |

- `examples/workflows/deliver.yml` and `examples/workflows/redeploy.yml` show the callers.
- The tag job waits up to 25 minutes for the main build of the same commit. A tag on a commit that was never built on `main` fails.

## 2. What a deploy does

`.github/workflows/deploy.yml` runs one job in the GitHub environment named by `environment`. The job uses `actions/deploy`:

1. Check the input shapes (`digest` must be `sha256:<64 hex>`).
2. SSH to the host with the key and the `known_hosts` lines. Host key checking stays on.
3. On the host, in `compose-dir`: `docker pull <image>@<digest>`. A digest that does not exist fails here and changes nothing.
4. Write `compose.digest.yaml` (`services.<service>.image: <image>@<digest>`). Keep the old one as `compose.digest.prev.yaml`.
5. `docker compose -f <compose-file> -f compose.digest.yaml up --detach --no-deps --wait <service>`.
6. Append a line to `deploy.log`.
7. Verify: every running container of the service has `<image>@<digest>` in the `RepoDigests` of its image. Else the job fails.

- The selftest (`selftest.yml`, job `deploy`) runs this against a throwaway target on the runner: a local registry, an sshd and a compose project. It deploys A, checks that a wrong digest and a missing digest fail, promotes to B and rolls back to A.

## 3. Host contract

- Docker Engine with the compose plugin (`docker compose up --wait`).
- A user that can run `docker` and log in with an SSH key.
- `compose-dir` with `compose-file` (default `compose.yaml`) that defines the service: ports, env, volumes, healthcheck. It has no `image:`; the deploy adds it.
- Pull access to the image: a public GHCR package, or `docker login ghcr.io` once with a read-only token.
- Convention for the path: `/opt/synthwerk/<service>`.

## 4. Repo setup per environment

Create the environments `dev`, `stg` and `prd` (Settings → Environments). Set these secrets on each one:

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | Host name or IP |
| `DEPLOY_USER` | SSH user |
| `DEPLOY_SSH_KEY` | Private key (ed25519), only for deploys |
| `DEPLOY_KNOWN_HOSTS` | Output of `ssh-keyscan -t ed25519 <host>`, checked by hand |

- `prd`: add a required reviewer (protection rule). That is the manual approval. GitHub does not take it from the workflow.
- `prd` and `stg`: limit deployment branches and tags to `v*`. `dev`: limit to `main`.
- When one secret is missing, the deploy job deploys nothing, writes a notice `deploy skipped` and the summary says `skipped`. It does not fail.

## 5. Rollback

- Find the previous digest: `compose.digest.prev.yaml` or `deploy.log` on the host, or the summary of an earlier `deliver` run.
- Run `redeploy` with that environment and digest. The same verify step proves the old digest runs.

## 6. Known gaps

- No dev host yet. Until synthwerk#7 and synthwerk#8 decide it, every deploy job skips.
- One host per environment. A multi-host rollout needs a new input.

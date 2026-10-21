#!/usr/bin/env bash
# Independent check for the deploy selftest: exactly one running "app" container,
# and its image was pulled as $1 (<image>@<digest>).
set -euo pipefail
want=$1
ids=$(docker ps --quiet --filter label=com.docker.compose.service=app)
[[ $(wc -w <<< "$ids") -eq 1 ]] || { echo "::error::expected one app container, got: $ids"; exit 1; }
image_id=$(docker inspect --format '{{.Image}}' "$ids")
digests=$(docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' "$image_id")
echo "$digests"
grep -Fxq -- "$want" <<< "$digests" || { echo "::error::app does not run $want"; exit 1; }
echo "ok: app runs $want"

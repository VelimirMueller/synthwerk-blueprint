#!/usr/bin/env bash
# Runs on the deploy host, fed to `ssh … bash -s --` by actions/deploy/action.yml.
#
# Usage: remote.sh <deploy|verify> <image> <digest> <service> <compose-dir> <compose-file> <wait-timeout>
#
# deploy  Pull <image>@<digest>, pin it in <compose-dir>/compose.digest.yaml, start the
#         service with `docker compose up --wait`, then verify.
# verify  Fail unless every running container of the service runs <image>@<digest>.
#
# The host owns <compose-dir>/<compose-file> (ports, env, volumes). This script only
# owns compose.digest.yaml (the pinned image), compose.digest.prev.yaml (the digest
# before the last deploy) and deploy.log (one line per deploy).
set -euo pipefail

mode=$1 image=$2 digest=$3 service=$4 dir=$5 file=$6 timeout=$7
ref="$image@$digest"

# shellcheck disable=SC2088 # match a literal "~/", then expand it by hand
case "$dir" in "~/"*) dir="$HOME/${dir#\~/}" ;; esac
cd -- "$dir"
[[ -f "$file" ]] || { echo "::error::$dir/$file does not exist on the host"; exit 1; }

compose=(docker compose -f "$file" -f compose.digest.yaml)

verify() {
  local ids id running image_id
  ids=$("${compose[@]}" ps -q "$service")
  [[ -n "$ids" ]] || { echo "::error::no running container for service $service"; return 1; }
  while IFS= read -r id; do
    running=$(docker inspect --format '{{.State.Running}}' "$id")
    image_id=$(docker inspect --format '{{.Image}}' "$id")
    # RepoDigests holds the registry digest of every reference the image was pulled by.
    if [[ "$running" != "true" ]] ||
      ! docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' "$image_id" | grep -Fxq -- "$ref"; then
      echo "::error::container ${id:0:12} of $service does not run $ref (running=$running)"
      docker image inspect --format '{{range .RepoDigests}}{{println .}}{{end}}' "$image_id" | sed 's/^/  has: /'
      return 1
    fi
    echo "ok: container ${id:0:12} of $service runs $ref"
  done <<< "$ids"
}

case "$mode" in
  deploy)
    # Pull first: a digest that does not exist fails here and changes nothing.
    docker pull --quiet "$ref"
    [[ -f compose.digest.yaml ]] && cp compose.digest.yaml compose.digest.prev.yaml
    printf 'services:\n  %s:\n    image: %s\n' "$service" "$ref" > compose.digest.yaml.tmp
    mv compose.digest.yaml.tmp compose.digest.yaml
    if ! "${compose[@]}" up --detach --no-deps --no-build --pull never --wait --wait-timeout "$timeout" "$service" ||
      ! verify; then
      # Keep the pin on the last good digest, so a manual `up` does not start the bad one.
      [[ -f compose.digest.prev.yaml ]] && cp compose.digest.prev.yaml compose.digest.yaml
      echo "::error::deploy of $ref failed; compose.digest.yaml points to the previous digest again"
      exit 1
    fi
    printf '%s %s\n' "$(date -u +%FT%TZ)" "$ref" >> deploy.log
    ;;
  verify)
    [[ -f compose.digest.yaml ]] || { echo "::error::no compose.digest.yaml in $dir: nothing was deployed"; exit 1; }
    verify
    ;;
  *)
    echo "::error::unknown mode: $mode"
    exit 1
    ;;
esac

#!/usr/bin/env bash
# Throwaway deploy target for the actions/deploy selftest (CI only, needs sudo + Docker).
#
# - a local registry on 127.0.0.1:5000 with two images (A and B, different digests)
# - an sshd on 127.0.0.1:2222 that lets the runner user in with a fresh key
# - a compose project in $RUNNER_TEMP/deploy-target with service "app"
#
# Writes SELFTEST_* values to $GITHUB_ENV for the workflow steps.
set -euo pipefail

work="$RUNNER_TEMP/deploy-selftest"
target="$RUNNER_TEMP/deploy-target"
mkdir -p "$work" "$target"

# Registry and two images. The base image is pinned by digest.
registry_image="registry:3@sha256:ddf754342cfc8acc51a56d5d0ab6af06826461864460636d8bd5c546dab2a7b8"
busybox_image="busybox:1.37@sha256:bdf57e528e45e4433820e045b29b4597825a1c9e38353532d90a01445013f82e"
docker run -d --name selftest-registry -p 127.0.0.1:5000:5000 "$registry_image" >/dev/null
for _ in $(seq 1 30); do curl -sf http://127.0.0.1:5000/v2/ >/dev/null && break; sleep 1; done
curl -sf http://127.0.0.1:5000/v2/ >/dev/null || { echo "::error::registry did not start"; exit 1; }

image=127.0.0.1:5000/selftest/app
# The registry answers with the digest it stores (Docker-Content-Digest).
digest_of() {
  curl -sfI \
    -H 'Accept: application/vnd.oci.image.index.v1+json' \
    -H 'Accept: application/vnd.oci.image.manifest.v1+json' \
    -H 'Accept: application/vnd.docker.distribution.manifest.list.v2+json' \
    -H 'Accept: application/vnd.docker.distribution.manifest.v2+json' \
    "http://127.0.0.1:5000/v2/selftest/app/manifests/$1" |
    tr -d '\r' | awk 'tolower($1) == "docker-content-digest:" { print $2 }'
}
for variant in a b; do
  printf 'FROM %s\nLABEL selftest.variant=%s\nCMD ["sleep", "3600"]\n' "$busybox_image" "$variant" |
    docker build --quiet --tag "$image:$variant" - >/dev/null
  docker push --quiet "$image:$variant" >/dev/null
done
digest_a=$(digest_of a)
digest_b=$(digest_of b)
[[ "$digest_a" =~ ^sha256: && "$digest_a" != "$digest_b" ]] || { echo "::error::images A and B need two different digests"; exit 1; }
# Drop the local tags, so the deploy must pull by digest.
docker image rm "$image:a" "$image:b" >/dev/null

# Compose project on the "host". The deploy adds compose.digest.yaml with the image.
cat > "$target/compose.yaml" <<'EOF'
services:
  app:
    stop_grace_period: 1s
    healthcheck:
      test: ["CMD", "true"]
      interval: 1s
      retries: 5
EOF

# sshd for the runner user, key auth only.
command -v sshd >/dev/null || sudo apt-get install -y --no-install-recommends openssh-server >/dev/null
ssh-keygen -q -t ed25519 -N "" -f "$work/host_key"
ssh-keygen -q -t ed25519 -N "" -f "$work/client_key"
cp "$work/client_key.pub" "$work/authorized_keys"
chmod 600 "$work/authorized_keys"
cat > "$work/sshd_config" <<EOF
Port 2222
ListenAddress 127.0.0.1
HostKey $work/host_key
AuthorizedKeysFile $work/authorized_keys
AllowUsers $(id -un)
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
StrictModes no
UsePAM no
PidFile $work/sshd.pid
EOF
sudo mkdir -p /run/sshd
sudo "$(command -v sshd)" -f "$work/sshd_config"
for _ in $(seq 1 20); do ssh-keyscan -p 2222 127.0.0.1 >/dev/null 2>&1 && break; sleep 0.5; done
ssh-keyscan -p 2222 127.0.0.1 >/dev/null 2>&1 || { echo "::error::sshd did not start"; exit 1; }

{
  echo "SELFTEST_IMAGE=$image"
  echo "SELFTEST_DIGEST_A=$digest_a"
  echo "SELFTEST_DIGEST_B=$digest_b"
  echo "SELFTEST_MISSING=sha256:$(printf 'missing' | sha256sum | cut -d' ' -f1)"
  echo "SELFTEST_DIR=$target"
  echo "SELFTEST_USER=$(id -un)"
  echo "SELFTEST_KNOWN_HOSTS=[127.0.0.1]:2222 $(cut -d' ' -f1,2 "$work/host_key.pub")"
  echo "SELFTEST_KEY<<KEY_EOF"
  cat "$work/client_key"
  echo "KEY_EOF"
} >> "$GITHUB_ENV"
echo "A=$digest_a"
echo "B=$digest_b"

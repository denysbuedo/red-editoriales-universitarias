#!/usr/bin/env bash
set -euo pipefail

UPDATES_DIR="${PNPU_UPDATES_DIR:-/home/ituser/updates}"
BASE_DIR="${PNPU_PORTAL_BASE_DIR:-/opt/pnpu/portal}"
SERVICE_NAME="${PNPU_PORTAL_SERVICE_NAME:-pnpu-portal}"
SERVICE_USER="${PNPU_PORTAL_SERVICE_USER:-pnpu}"
SERVICE_GROUP="${PNPU_PORTAL_SERVICE_GROUP:-pnpu}"
NODE_NPM="${PNPU_NPM_BIN:-/usr/local/bin/npm}"
HEALTH_BASE_URL="${PNPU_HEALTH_BASE_URL:-http://127.0.0.1:3000}"
ALLOW_EXISTING_RELEASE="${PNPU_ALLOW_EXISTING_RELEASE:-false}"

fail() {
  printf 'ERROR: %s\n' "$1" >&2
  exit 1
}

info() {
  printf '\n==> %s\n' "$1"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Required command not found: $1"
}

select_single_file() {
  local pattern="$1"
  local files=()

  shopt -s nullglob
  files=("${UPDATES_DIR}"/${pattern})
  shopt -u nullglob

  if [ "${#files[@]}" -eq 0 ]; then
    fail "No file matching ${UPDATES_DIR}/${pattern}"
  fi

  if [ "${#files[@]}" -gt 1 ]; then
    printf 'Multiple files found:\n' >&2
    printf ' - %s\n' "${files[@]}" >&2
    fail "Leave only one matching artifact in ${UPDATES_DIR} or set PNPU_UPDATES_DIR."
  fi

  printf '%s' "${files[0]}"
}

extract_version() {
  local artifact_name="$1"

  artifact_name="${artifact_name#pnpu-portal-}"
  artifact_name="${artifact_name%.tar.gz}"

  if [ -z "$artifact_name" ]; then
    fail "Could not infer release version from artifact name."
  fi

  printf '%s' "$artifact_name"
}

require_command sudo
require_command tar
require_command sha256sum
require_command curl

if [ ! -x "$NODE_NPM" ]; then
  if command -v npm >/dev/null 2>&1; then
    NODE_NPM="$(command -v npm)"
  else
    fail "npm not found. Set PNPU_NPM_BIN or install Node.js/npm."
  fi
fi

ARTIFACT_PATH="$(select_single_file 'pnpu-portal-*.tar.gz')"
CHECKSUM_PATH="${ARTIFACT_PATH}.sha256"

if [ ! -f "$CHECKSUM_PATH" ]; then
  CHECKSUM_PATH="$(select_single_file 'pnpu-portal-*.tar.gz.sha256')"
fi

ARTIFACT_NAME="$(basename "$ARTIFACT_PATH")"
RELEASE_VERSION="$(extract_version "$ARTIFACT_NAME")"
ARTIFACT_DIR="${BASE_DIR}/shared/artifacts"
RELEASE_PATH="${BASE_DIR}/releases/${RELEASE_VERSION}"

info "Deploying ${ARTIFACT_NAME} as release ${RELEASE_VERSION}"

if [ -e "$RELEASE_PATH" ] && [ "$ALLOW_EXISTING_RELEASE" != "true" ]; then
  fail "Release path already exists: ${RELEASE_PATH}. Use a new version or set PNPU_ALLOW_EXISTING_RELEASE=true."
fi

info "Preparing directories"
sudo groupadd --system "$SERVICE_GROUP" >/dev/null 2>&1 || true
sudo useradd --system --gid "$SERVICE_GROUP" --home-dir /opt/pnpu --shell /usr/sbin/nologin "$SERVICE_USER" >/dev/null 2>&1 || true
sudo mkdir -p "$ARTIFACT_DIR" "${BASE_DIR}/shared/.pnpu" "${BASE_DIR}/shared/deployments" "${BASE_DIR}/releases"
sudo chown -R "${SERVICE_USER}:${SERVICE_GROUP}" "$BASE_DIR"

info "Copying artifact and checksum"
sudo cp "$ARTIFACT_PATH" "${ARTIFACT_DIR}/${ARTIFACT_NAME}"
sudo cp "$CHECKSUM_PATH" "${ARTIFACT_DIR}/${ARTIFACT_NAME}.sha256"
sudo chown "${SERVICE_USER}:${SERVICE_GROUP}" "${ARTIFACT_DIR}/${ARTIFACT_NAME}" "${ARTIFACT_DIR}/${ARTIFACT_NAME}.sha256"

info "Verifying checksum"
(
  cd "$ARTIFACT_DIR"
  sudo -u "$SERVICE_USER" sha256sum -c "${ARTIFACT_NAME}.sha256"
)

info "Extracting release"
if [ -e "$RELEASE_PATH" ] && [ "$ALLOW_EXISTING_RELEASE" = "true" ]; then
  sudo rm -rf "$RELEASE_PATH"
fi
sudo mkdir -p "$RELEASE_PATH"
sudo tar -xzf "${ARTIFACT_DIR}/${ARTIFACT_NAME}" -C "$RELEASE_PATH" --strip-components=1
sudo chown -R "${SERVICE_USER}:${SERVICE_GROUP}" "$RELEASE_PATH"

info "Linking writable runtime data"
sudo rm -rf "${RELEASE_PATH}/.pnpu"
sudo ln -s "${BASE_DIR}/shared/.pnpu" "${RELEASE_PATH}/.pnpu"
sudo chown -h "${SERVICE_USER}:${SERVICE_GROUP}" "${RELEASE_PATH}/.pnpu"

info "Installing production dependencies"
(
  cd "$RELEASE_PATH"
  sudo -u "$SERVICE_USER" "$NODE_NPM" ci --omit=dev
)

info "Activating release"
sudo ln -sfn "$RELEASE_PATH" "${BASE_DIR}/current"
sudo chown -h "${SERVICE_USER}:${SERVICE_GROUP}" "${BASE_DIR}/current"

info "Restarting ${SERVICE_NAME}"
sudo systemctl daemon-reload
sudo systemctl restart "$SERVICE_NAME"

info "Checking service and health endpoints"
sudo systemctl status "$SERVICE_NAME" --no-pager
curl --fail --silent --show-error "${HEALTH_BASE_URL}/health/live"
printf '\n'
curl --fail --silent --show-error "${HEALTH_BASE_URL}/health/ready"
printf '\n'
curl --fail --silent --show-error "${HEALTH_BASE_URL}/health/catalog" || true
printf '\n'

info "Manual follow-up"
cat <<EOF
If this was the first deployment, verify manually:
  1. /etc/pnpu/portal.env exists and contains real tokens/secrets.
  2. HAProxy routes editorial.reduniv.edu.cu to this server on port 3000.
  3. Browse https://editorial.reduniv.edu.cu/

For Omeka profile/data changes, run deploy-omeka-tools.sh separately.
EOF

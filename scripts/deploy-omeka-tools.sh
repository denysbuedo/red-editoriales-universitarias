#!/usr/bin/env bash
set -euo pipefail

UPDATES_DIR="${PNPU_UPDATES_DIR:-/home/ituser/updates}"
TOOLS_BASE_DIR="${PNPU_OMEKA_TOOLS_BASE_DIR:-/opt/pnpu/tools}"
TOOLS_CURRENT_DIR="${TOOLS_BASE_DIR}/omeka"
OMEKA_BASE_URL="${PNPU_OMEKA_BASE_URL:-http://127.0.0.1}"
OMEKA_TIMEOUT_MS="${PNPU_OMEKA_TIMEOUT_MS:-10000}"
PORTAL_BASE_URL="${PNPU_PORTAL_BASE_URL:-http://127.0.0.1:3000}"
RUN_SEED_SAMPLE="${PNPU_OMEKA_RUN_SEED_SAMPLE:-true}"

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
    fail "Leave only one matching tools artifact in ${UPDATES_DIR} or set PNPU_UPDATES_DIR."
  fi

  printf '%s' "${files[0]}"
}

extract_version() {
  local artifact_name="$1"

  artifact_name="${artifact_name#pnpu-omeka-tools-}"
  artifact_name="${artifact_name%.tar.gz}"

  if [ -z "$artifact_name" ]; then
    fail "Could not infer Omeka tools version from artifact name."
  fi

  printf '%s' "$artifact_name"
}

require_command curl
require_command node
require_command npm
require_command sha256sum
require_command sudo
require_command tar

if [ -z "${PNPU_OMEKA_KEY_IDENTITY:-}" ]; then
  fail "PNPU_OMEKA_KEY_IDENTITY must be exported in the current shell."
fi

if [ -z "${PNPU_OMEKA_KEY_CREDENTIAL:-}" ]; then
  fail "PNPU_OMEKA_KEY_CREDENTIAL must be exported in the current shell."
fi

ARTIFACT_PATH="$(select_single_file 'pnpu-omeka-tools-*.tar.gz')"
CHECKSUM_PATH="${ARTIFACT_PATH}.sha256"

if [ ! -f "$CHECKSUM_PATH" ]; then
  CHECKSUM_PATH="$(select_single_file 'pnpu-omeka-tools-*.tar.gz.sha256')"
fi

ARTIFACT_NAME="$(basename "$ARTIFACT_PATH")"
TOOLS_VERSION="$(extract_version "$ARTIFACT_NAME")"
TOOLS_RELEASE_DIR="${TOOLS_BASE_DIR}/omeka-${TOOLS_VERSION}"

info "Installing ${ARTIFACT_NAME} as Omeka tools ${TOOLS_VERSION}"
sudo mkdir -p "$TOOLS_BASE_DIR"
sudo chown -R "$(id -u):$(id -g)" "$TOOLS_BASE_DIR"

info "Verifying checksum"
cp "$ARTIFACT_PATH" "${TOOLS_BASE_DIR}/${ARTIFACT_NAME}"
cp "$CHECKSUM_PATH" "${TOOLS_BASE_DIR}/${ARTIFACT_NAME}.sha256"
(
  cd "$TOOLS_BASE_DIR"
  sha256sum -c "${ARTIFACT_NAME}.sha256"
)

info "Extracting tools"
rm -rf "$TOOLS_RELEASE_DIR"
mkdir -p "$TOOLS_RELEASE_DIR"
tar -xzf "${TOOLS_BASE_DIR}/${ARTIFACT_NAME}" -C "$TOOLS_RELEASE_DIR" --strip-components=1
ln -sfn "$TOOLS_RELEASE_DIR" "$TOOLS_CURRENT_DIR"

info "Checking Omeka local API"
curl --fail --silent --show-error --max-time 10 "${OMEKA_BASE_URL}/api/items" >/dev/null

export PNPU_OMEKA_BASE_URL="$OMEKA_BASE_URL"
export PNPU_OMEKA_TIMEOUT_MS="$OMEKA_TIMEOUT_MS"

info "Running Omeka diagnostics before installation"
(
  cd "$TOOLS_CURRENT_DIR"
  npm run omeka:check || true
)

info "Installing PNPU profile in Omeka"
(
  cd "$TOOLS_CURRENT_DIR"
  npm run omeka:install-profile
)

info "Running Omeka diagnostics after profile installation"
(
  cd "$TOOLS_CURRENT_DIR"
  npm run omeka:check
)

if [ "$RUN_SEED_SAMPLE" = "true" ]; then
  info "Loading PNPU sample seed"
  (
    cd "$TOOLS_CURRENT_DIR"
    npm run omeka:seed-sample
  )
else
  info "Skipping sample seed because PNPU_OMEKA_RUN_SEED_SAMPLE=${RUN_SEED_SAMPLE}"
fi

info "Running Omeka mapping diagnostic"
(
  cd "$TOOLS_CURRENT_DIR"
  npm run omeka:map
)

if [ -n "${PNPU_CATALOG_REFRESH_TOKEN:-}" ]; then
  info "Refreshing PNPU portal catalog snapshot"
  curl --fail --silent --show-error -X POST "${PORTAL_BASE_URL}/health/catalog/refresh" \
    -H "X-PNPU-Refresh-Token: ${PNPU_CATALOG_REFRESH_TOKEN}"
  printf '\n'
else
  info "Catalog refresh token not exported"
fi

info "Checking portal catalog health"
curl --fail --silent --show-error "${PORTAL_BASE_URL}/health/catalog" || true
printf '\n'

info "Manual follow-up"
cat <<EOF
Verify manually in the browser:
  1. Omeka admin: https://catalogo.reduniv.edu.cu/admin
  2. Portal catalog: https://editorial.reduniv.edu.cu/publicaciones

If PNPU_CATALOG_REFRESH_TOKEN was not exported, run manually:
  curl -X POST ${PORTAL_BASE_URL}/health/catalog/refresh \\
    -H "X-PNPU-Refresh-Token: TU_TOKEN_REFRESH"

If this is production data, set PNPU_OMEKA_RUN_SEED_SAMPLE=false before running this script.
EOF

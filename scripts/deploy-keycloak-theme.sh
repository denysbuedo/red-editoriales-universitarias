#!/usr/bin/env bash
set -euo pipefail

THEME_NAME="${KEYCLOAK_THEME_NAME:-reduniv}"
THEME_VERSION="${KEYCLOAK_THEME_VERSION:-0.1.0}"
ARCHIVE="${KEYCLOAK_THEME_ARCHIVE:-${THEME_NAME}-keycloak-theme-${THEME_VERSION}.tar.gz}"
CHECKSUM="${ARCHIVE}.sha256"
KEYCLOAK_HOME="${KEYCLOAK_HOME:-/opt/keycloak}"
THEMES_DIR="${KEYCLOAK_THEMES_DIR:-${KEYCLOAK_HOME}/themes}"
SERVICE_NAME="${KEYCLOAK_SERVICE_NAME:-keycloak}"

if [[ ! -f "${ARCHIVE}" ]]; then
  echo "ERROR: Missing archive ${ARCHIVE} in $(pwd)." >&2
  exit 1
fi

if [[ ! -f "${CHECKSUM}" ]]; then
  echo "ERROR: Missing checksum ${CHECKSUM} in $(pwd)." >&2
  exit 1
fi

echo "==> Verifying checksum"
sha256sum -c "${CHECKSUM}"

echo "==> Installing Keycloak theme ${THEME_NAME}"
sudo mkdir -p "${THEMES_DIR}"
sudo rm -rf "${THEMES_DIR:?}/${THEME_NAME}"
sudo tar -xzf "${ARCHIVE}" -C "${THEMES_DIR}"
sudo chown -R keycloak:keycloak "${THEMES_DIR}/${THEME_NAME}"

echo "==> Restarting ${SERVICE_NAME}"
sudo systemctl restart "${SERVICE_NAME}"
sudo systemctl status "${SERVICE_NAME}" --no-pager

cat <<EOF

==> Manual follow-up in Keycloak admin
1. Open: https://identidad.reduniv.edu.cu/admin
2. Select realm: reduniv
3. Go to: Realm settings -> Themes
4. Set Login theme: ${THEME_NAME}
5. Save
6. Test login from: https://editorial.reduniv.edu.cu/admin
EOF

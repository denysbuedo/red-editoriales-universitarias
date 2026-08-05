#!/usr/bin/env bash
set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/home/ituser/backups}"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_ROOT}/pnpu-operational-${TIMESTAMP}"
MANIFEST="${BACKUP_DIR}/manifest.txt"

mkdir -p "${BACKUP_DIR}"
touch "${MANIFEST}"
chmod 700 "${BACKUP_DIR}"

log() {
  echo "==> $*"
}

record() {
  echo "$*" >> "${MANIFEST}"
}

archive_path() {
  local source_path="$1"
  local archive_name="$2"

  if [[ -e "${source_path}" ]]; then
    log "Archiving ${source_path}"
    tar -czf "${BACKUP_DIR}/${archive_name}" -C "$(dirname "${source_path}")" "$(basename "${source_path}")"
    record "${archive_name}: ${source_path}"
  else
    record "missing: ${source_path}"
  fi
}

read_ini_value() {
  local key="$1"
  local file="$2"

  awk -F= -v key="${key}" '
    $1 ~ "^[[:space:]]*" key "[[:space:]]*$" {
      value=$2
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", value)
      gsub(/^"|"$/, "", value)
      print value
      exit
    }
  ' "${file}"
}

dump_omeka_database() {
  local database_ini="/var/www/omeka-s/config/database.ini"
  local db_name="${OMEKA_DB_NAME:-}"
  local db_user="${OMEKA_DB_USER:-}"
  local db_password="${OMEKA_DB_PASSWORD:-}"

  if ! command -v mysqldump >/dev/null 2>&1; then
    record "skipped omeka-db.sql.gz: mysqldump not found"
    return
  fi

  if [[ -f "${database_ini}" ]]; then
    db_name="${db_name:-$(read_ini_value database "${database_ini}")}"
    db_user="${db_user:-$(read_ini_value username "${database_ini}")}"
    db_password="${db_password:-$(read_ini_value password "${database_ini}")}"
  fi

  if [[ -z "${db_name}" || -z "${db_user}" ]]; then
    record "skipped omeka-db.sql.gz: missing database name or user"
    return
  fi

  log "Dumping Omeka database ${db_name}"
  MYSQL_PWD="${db_password}" mysqldump \
    --single-transaction \
    --routines \
    --triggers \
    --user="${db_user}" \
    "${db_name}" | gzip > "${BACKUP_DIR}/omeka-db.sql.gz"
  chmod 600 "${BACKUP_DIR}/omeka-db.sql.gz"
  record "omeka-db.sql.gz: MySQL database ${db_name}"
}

dump_keycloak_database() {
  local db_name="${KEYCLOAK_DB_NAME:-keycloak}"
  local db_user="${KEYCLOAK_DB_USER:-keycloak}"
  local db_password="${KEYCLOAK_DB_PASSWORD:-}"

  if ! command -v pg_dump >/dev/null 2>&1; then
    record "skipped keycloak-db.dump: pg_dump not found"
    return
  fi

  log "Dumping Keycloak database ${db_name}"
  PGPASSWORD="${db_password}" pg_dump \
    --format=custom \
    --no-owner \
    --username="${db_user}" \
    "${db_name}" > "${BACKUP_DIR}/keycloak-db.dump"
  chmod 600 "${BACKUP_DIR}/keycloak-db.dump"
  record "keycloak-db.dump: PostgreSQL database ${db_name}"
}

export_keycloak_realm() {
  local realm="${KEYCLOAK_REALM:-reduniv}"

  if [[ ! -x /opt/keycloak/bin/kc.sh ]]; then
    record "skipped keycloak-realm-${realm}.json: kc.sh not found"
    return
  fi

  log "Exporting Keycloak realm ${realm}"
  if sudo -u keycloak /opt/keycloak/bin/kc.sh export \
    --dir "${BACKUP_DIR}/keycloak-realm-export" \
    --realm "${realm}" \
    --users realm_file >/dev/null 2>&1; then
    tar -czf "${BACKUP_DIR}/keycloak-realm-${realm}.tar.gz" -C "${BACKUP_DIR}" keycloak-realm-export
    rm -rf "${BACKUP_DIR}/keycloak-realm-export"
    record "keycloak-realm-${realm}.tar.gz: Keycloak realm export"
  else
    record "skipped keycloak-realm-${realm}.tar.gz: export failed"
  fi
}

record "created_at_utc: $(date -u --iso-8601=seconds)"
record "host: $(hostname)"

archive_path "/etc/pnpu/portal.env" "portal-env.tar.gz"
archive_path "/opt/pnpu/portal" "portal-runtime.tar.gz"
archive_path "/home/ituser/updates" "updates.tar.gz"
archive_path "/var/www/omeka-s/config" "omeka-config.tar.gz"
archive_path "/etc/keycloak/keycloak.env" "keycloak-env.tar.gz"
archive_path "/opt/keycloak/themes" "keycloak-themes.tar.gz"

dump_omeka_database
dump_keycloak_database
export_keycloak_realm

log "Backup written to ${BACKUP_DIR}"
log "Manifest:"
cat "${MANIFEST}"

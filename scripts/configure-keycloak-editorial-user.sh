#!/usr/bin/env bash
set -euo pipefail

KEYCLOAK_HOME="${KEYCLOAK_HOME:-/opt/keycloak}"
KCADM="${KEYCLOAK_HOME}/bin/kcadm.sh"

log() {
  echo "==> $*"
}

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    fail "Required command not found: $1"
  fi
}

prompt_default() {
  local variable_name="$1"
  local label="$2"
  local default_value="$3"
  local value

  read -r -p "${label} [${default_value}]: " value
  printf -v "${variable_name}" "%s" "${value:-${default_value}}"
}

prompt_required() {
  local variable_name="$1"
  local label="$2"
  local value

  while true; do
    read -r -p "${label}: " value

    if [[ -n "${value// }" ]]; then
      printf -v "${variable_name}" "%s" "${value}"
      return
    fi
  done
}

prompt_secret() {
  local variable_name="$1"
  local label="$2"
  local value

  while true; do
    read -r -s -p "${label}: " value
    echo

    if [[ -n "${value}" ]]; then
      printf -v "${variable_name}" "%s" "${value}"
      return
    fi
  done
}

prompt_yes_no() {
  local variable_name="$1"
  local label="$2"
  local default_value="$3"
  local value

  read -r -p "${label} [${default_value}]: " value
  value="${value:-${default_value}}"

  case "${value,,}" in
    y | yes | s | si | sí)
      printf -v "${variable_name}" "%s" "yes"
      ;;
    n | no)
      printf -v "${variable_name}" "%s" "no"
      ;;
    *)
      fail "Invalid yes/no value: ${value}"
      ;;
  esac
}

run_kcadm() {
  sudo "${KCADM}" "$@"
}

json_first_id() {
  python3 -c 'import json,sys; data=json.load(sys.stdin); print(data[0]["id"] if data else "")'
}

json_has_role() {
  local role_name="$1"

  python3 -c 'import json,sys; role=sys.argv[1]; data=json.load(sys.stdin); print("yes" if any(item.get("name") == role for item in data) else "no")' "${role_name}"
}

json_mapper_id() {
  local mapper_name="$1"
  local claim_name="$2"

  python3 -c '
import json,sys
mapper_name=sys.argv[1]
claim_name=sys.argv[2]
for item in json.load(sys.stdin):
    config=item.get("config") or {}
    if item.get("name") == mapper_name or config.get("claim.name") == claim_name:
        print(item.get("id", ""))
        break
' "${mapper_name}" "${claim_name}"
}

normalize_editorial_ids() {
  local raw_value="$1"

  python3 -c '
import re,sys
raw=sys.argv[1]
values=[]
for item in raw.split(","):
    value=item.strip().lower()
    if not value:
        continue
    if not re.match(r"^[a-z0-9][a-z0-9._-]{1,79}$", value):
        raise SystemExit(f"Invalid editorial id: {value}")
    if value not in values:
        values.append(value)
if not values:
    raise SystemExit("At least one editorial id is required.")
print(",".join(values))
' "${raw_value}"
}

update_user_attributes_file() {
  local user_file="$1"
  local claim_name="$2"
  local editorial_ids_csv="$3"

  python3 - "${user_file}" "${claim_name}" "${editorial_ids_csv}" <<'PY'
import json
import sys

path = sys.argv[1]
claim_name = sys.argv[2]
editorial_ids = [value for value in sys.argv[3].split(",") if value]

with open(path, "r", encoding="utf-8") as handle:
    user = json.load(handle)

attributes = user.get("attributes")
if not isinstance(attributes, dict):
    attributes = {}

attributes[claim_name] = editorial_ids
user["attributes"] = attributes

with open(path, "w", encoding="utf-8") as handle:
    json.dump(user, handle, ensure_ascii=False, indent=2)
    handle.write("\n")
PY
}

write_mapper_file() {
  local mapper_file="$1"
  local mapper_name="$2"
  local claim_name="$3"

  python3 - "${mapper_file}" "${mapper_name}" "${claim_name}" <<'PY'
import json
import sys

path = sys.argv[1]
mapper_name = sys.argv[2]
claim_name = sys.argv[3]

mapper = {
    "name": mapper_name,
    "protocol": "openid-connect",
    "protocolMapper": "oidc-usermodel-attribute-mapper",
    "consentRequired": False,
    "config": {
        "user.attribute": claim_name,
        "claim.name": claim_name,
        "jsonType.label": "String",
        "id.token.claim": "true",
        "access.token.claim": "true",
        "userinfo.token.claim": "true",
        "multivalued": "true",
        "aggregate.attrs": "false",
    },
}

with open(path, "w", encoding="utf-8") as handle:
    json.dump(mapper, handle, ensure_ascii=False, indent=2)
    handle.write("\n")
PY
}

require_command python3
[[ -x "${KCADM}" ]] || fail "kcadm.sh not found or not executable at ${KCADM}"

cat <<'EOF'
PNPU - Configuracion de usuario editorial en Keycloak

Este script:
  1. autentica kcadm contra Keycloak local;
  2. crea o localiza el usuario editorial;
  3. asigna un rol de importacion;
  4. guarda el atributo pnpu_editorial_ids;
  5. crea o actualiza el mapper OIDC del cliente pnpu-portal.

EOF

prompt_default SERVER_URL "Keycloak local URL" "http://127.0.0.1:8080"
prompt_default ADMIN_REALM "Realm administrativo" "master"
prompt_default ADMIN_USER "Usuario administrador Keycloak" "admin"
prompt_secret ADMIN_PASSWORD "Password administrador Keycloak"
prompt_default REALM "Realm institucional" "reduniv"
prompt_default CLIENT_ID "Client ID de la plataforma" "pnpu-portal"
prompt_default CLAIM_NAME "Claim de editoriales" "pnpu_editorial_ids"
prompt_default ROLE_NAME "Rol a asignar al usuario editorial" "pnpu-import-reader"
prompt_required USERNAME "Username del responsable editorial"
prompt_required EDITORIAL_IDS_RAW "Editorial id(s), separados por coma si hay mas de uno"
EDITORIAL_IDS="$(normalize_editorial_ids "${EDITORIAL_IDS_RAW}")"

prompt_yes_no SHOULD_ASSIGN_ROLE "Asignar/verificar rol ${ROLE_NAME}" "yes"
prompt_yes_no SHOULD_CONFIGURE_MAPPER "Crear/actualizar mapper OIDC ${CLAIM_NAME}" "yes"
prompt_yes_no SHOULD_CREATE_ROLE "Crear el rol si no existe" "no"
prompt_yes_no SHOULD_CREATE_USER "Crear el usuario si no existe" "yes"

log "Autenticando kcadm"
run_kcadm config credentials \
  --server "${SERVER_URL}" \
  --realm "${ADMIN_REALM}" \
  --user "${ADMIN_USER}" \
  --password "${ADMIN_PASSWORD}" >/dev/null

log "Verificando realm ${REALM}"
run_kcadm get "realms/${REALM}" >/dev/null

USER_ID="$(run_kcadm get users -r "${REALM}" -q "username=${USERNAME}" --fields id,username | json_first_id)"

if [[ -z "${USER_ID}" ]]; then
  if [[ "${SHOULD_CREATE_USER}" != "yes" ]]; then
    fail "User ${USERNAME} does not exist in realm ${REALM}"
  fi

  prompt_default USER_EMAIL "Email del usuario nuevo" "${USERNAME}@reduniv.edu.cu"
  prompt_yes_no EMAIL_VERIFIED "Marcar email como verificado" "yes"
  prompt_secret INITIAL_PASSWORD "Password temporal del usuario nuevo"

  log "Creando usuario ${USERNAME}"
  run_kcadm create users \
    -r "${REALM}" \
    -s "username=${USERNAME}" \
    -s "email=${USER_EMAIL}" \
    -s enabled=true \
    -s "emailVerified=$([[ "${EMAIL_VERIFIED}" == "yes" ]] && echo true || echo false)" >/dev/null

  USER_ID="$(run_kcadm get users -r "${REALM}" -q "username=${USERNAME}" --fields id,username | json_first_id)"
  [[ -n "${USER_ID}" ]] || fail "Could not resolve created user id"

  log "Asignando password temporal"
  run_kcadm set-password \
    -r "${REALM}" \
    --userid "${USER_ID}" \
    --new-password "${INITIAL_PASSWORD}" \
    --temporary >/dev/null
else
  log "Usuario encontrado: ${USERNAME} (${USER_ID})"
fi

if [[ "${SHOULD_ASSIGN_ROLE}" == "yes" ]]; then
  if ! run_kcadm get "roles/${ROLE_NAME}" -r "${REALM}" >/dev/null 2>&1; then
    if [[ "${SHOULD_CREATE_ROLE}" != "yes" ]]; then
      fail "Role ${ROLE_NAME} does not exist in realm ${REALM}"
    fi

    log "Creando rol ${ROLE_NAME}"
    run_kcadm create roles -r "${REALM}" -s "name=${ROLE_NAME}" >/dev/null
  fi

  HAS_ROLE="$(run_kcadm get "users/${USER_ID}/role-mappings/realm" -r "${REALM}" --fields name | json_has_role "${ROLE_NAME}")"

  if [[ "${HAS_ROLE}" == "yes" ]]; then
    log "El usuario ya tiene el rol ${ROLE_NAME}"
  else
    log "Asignando rol ${ROLE_NAME}"
    run_kcadm add-roles -r "${REALM}" --uid "${USER_ID}" --rolename "${ROLE_NAME}" >/dev/null
  fi
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

USER_FILE="${TMP_DIR}/user.json"
log "Actualizando atributo ${CLAIM_NAME}=${EDITORIAL_IDS}"
run_kcadm get "users/${USER_ID}" -r "${REALM}" > "${USER_FILE}"
update_user_attributes_file "${USER_FILE}" "${CLAIM_NAME}" "${EDITORIAL_IDS}"
run_kcadm update "users/${USER_ID}" -r "${REALM}" -f "${USER_FILE}" >/dev/null

if [[ "${SHOULD_CONFIGURE_MAPPER}" == "yes" ]]; then
  CLIENT_UUID="$(run_kcadm get clients -r "${REALM}" -q "clientId=${CLIENT_ID}" --fields id,clientId | json_first_id)"
  [[ -n "${CLIENT_UUID}" ]] || fail "Client ${CLIENT_ID} does not exist in realm ${REALM}"

  MAPPER_FILE="${TMP_DIR}/mapper.json"
  MAPPER_NAME="${CLAIM_NAME}"
  write_mapper_file "${MAPPER_FILE}" "${MAPPER_NAME}" "${CLAIM_NAME}"

  MAPPER_ID="$(run_kcadm get "clients/${CLIENT_UUID}/protocol-mappers/models" -r "${REALM}" | json_mapper_id "${MAPPER_NAME}" "${CLAIM_NAME}")"

  if [[ -n "${MAPPER_ID}" ]]; then
    log "Actualizando mapper ${MAPPER_NAME}"
    run_kcadm update "clients/${CLIENT_UUID}/protocol-mappers/models/${MAPPER_ID}" -r "${REALM}" -f "${MAPPER_FILE}" >/dev/null
  else
    log "Creando mapper ${MAPPER_NAME}"
    run_kcadm create "clients/${CLIENT_UUID}/protocol-mappers/models" -r "${REALM}" -f "${MAPPER_FILE}" >/dev/null
  fi
fi

cat <<EOF

==> Configuracion completada

Realm: ${REALM}
Client: ${CLIENT_ID}
Usuario: ${USERNAME}
Rol: ${ROLE_NAME}
Claim: ${CLAIM_NAME}
Editorial(es): ${EDITORIAL_IDS}

Verificacion rapida:

sudo ${KCADM} get "users/${USER_ID}" -r "${REALM}" --fields username,attributes

Prueba esperada en PNPU:
  1. Cerrar sesion en https://editorial.reduniv.edu.cu/api/admin/auth/logout
  2. Entrar con ${USERNAME}
  3. En Editorial piloto usar uno de estos valores: ${EDITORIAL_IDS}
  4. Subir XLSX: debe permitirlo
  5. Probar otra editorial: debe responder 403
EOF

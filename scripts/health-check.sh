#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3000}"
TIMEOUT_SECONDS="${2:-5}"

check_endpoint() {
  local path="$1"
  local expected_status="$2"
  local response

  response="$(curl --fail --silent --show-error --max-time "${TIMEOUT_SECONDS}" "${BASE_URL}${path}")"

  if ! printf '%s' "${response}" | grep -q "\"status\":\"${expected_status}\""; then
    printf 'Unexpected response from %s: %s\n' "${path}" "${response}" >&2
    return 1
  fi
}

check_endpoint "/health/live" "ok"
check_endpoint "/health/ready" "ready"

printf 'PNPU portal health checks passed for %s\n' "${BASE_URL}"

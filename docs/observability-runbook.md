# Runbook de observabilidad del Portal PNPU

## Objetivo

Verificar la disponibilidad técnica del Portal PNPU mediante health checks, métricas Prometheus
y trazabilidad por `X-Correlation-Id`.

## Endpoints

| Endpoint | Uso |
|---|---|
| `/health/live` | Proceso activo |
| `/health/ready` | Listo para recibir tráfico |
| `/metrics` | Métricas Prometheus |
| `/version` | Metadata de versión |

## Métricas iniciales

- `pnpu_portal_build_info`
- `pnpu_portal_process_uptime_seconds`

## Logs estructurados

El Portal emite logs JSON de request cuando `PNPU_ENABLE_REQUEST_LOGS` no es `false`.

Campos mínimos:

- `timestamp`
- `level`
- `service`
- `event`
- `correlationId`
- `method`
- `path`

No se registran headers, tokens, payloads ni query strings completas.

Variables:

- `PNPU_LOG_LEVEL`
- `PNPU_ENABLE_REQUEST_LOGS`

## Alertas iniciales

- `PNPUPortalBuildInfoMissing`
- `PNPUPortalReadyEndpointDown`
- `PNPUPortalProcessRestarted`

## Verificación manual

```bash
curl -H "X-Correlation-Id: manual-check" http://127.0.0.1:3000/health/ready
curl http://127.0.0.1:3000/metrics
```

## Criterio de éxito

- `/health/ready` devuelve `status=ready`.
- `/metrics` expone `pnpu_portal_build_info`.
- Las respuestas HTTP incluyen `X-Correlation-Id`.
- Los logs de request incluyen `correlationId`.
- Prometheus puede evaluar `infrastructure/monitoring/alert-rules.yml`.

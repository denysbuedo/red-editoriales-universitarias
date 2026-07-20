# Release 0.1 - Reporte de aceptacion

## Resumen

La version inicial operativa de PNPU queda empaquetada y validada como artefacto de release local.

| Campo | Valor |
|---|---|
| Paquete | `pnpu-portal-0.1.0.tar.gz` |
| Version | `0.1.0` |
| Commit incluido | `5bcee8e059c5903fba60654393029791350a7a27` |
| Archivos en manifest | `846` |
| SHA-256 | `68a797d262a98c07d6fa577a185128d5e9e922da98f3cb00268859a7e69ff7d0` |

## Verificacion ejecutada

```bash
npm run quality
npm run build
PNPU_ACCEPTANCE_BASE_URL=http://127.0.0.1:4310 PNPU_ACCEPTANCE_REQUIRE_OMEKA=true npm run acceptance:v0.1
npm run package:release
npm run package:validate
```

## Resultado de aceptacion local

```text
PNPU v0.1 acceptance report for http://127.0.0.1:4310

[OK] health/live - Portal process is alive.
[OK] health/ready - Portal is ready.
[OK] version - Version metadata is exposed.
[OK] metrics - Prometheus metrics are exposed.
[OK] openapi - OpenAPI contract is served.
[OK] public catalog pages - 6 public pages responded.
[OK] public catalog API - 5 catalog endpoints responded.
[OK] catalog diagnostics - Catalog repository: omeka.
[OK] catalog refresh protection - Refresh endpoint rejects unauthenticated requests.
[OK] admin page protection - Admin import page requires authentication.
[OK] admin OIDC login route - OIDC login route exists but is not configured in this environment.
[OK] admin logout route - Logout clears local admin session.

12 OK, 0 FAIL.
```

## Observaciones

- El artefacto queda en `artifacts/`, directorio no versionado.
- La ruta OIDC existe y responde, pero en el entorno local actual no esta configurada contra un
  Keycloak real.
- La aceptacion local se ejecuto con Omeka como repositorio activo.
- `Readme/` permanece fuera del control de versiones.

## Decision

La version `0.1.0` queda lista como candidata inicial siempre que el despliegue objetivo configure
las variables requeridas en `docs/release-0.1-readiness.md`.

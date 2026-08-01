# Release 0.1 - Reporte de aceptacion

## Resumen

La version inicial operativa de PNPU queda desplegada y validada en el servidor de servicios con
Omeka S como repositorio de catalogo activo.

| Campo | Valor |
|---|---|
| Version | `0.1.0` |
| Portal publico | `https://editorial.reduniv.edu.cu` |
| Catalogo tecnico Omeka S | `https://catalogo.reduniv.edu.cu` |
| Servicio systemd | `pnpu-portal` |
| Paquete portal | `pnpu-portal-0.1.0.tar.gz` |
| SHA-256 portal | `ff4bd53ffca088a9f789c6ccc119016cc5cb8f99f5c5e753e7d6e497883f69fb` |
| Paquete herramientas Omeka | `pnpu-omeka-tools-0.1.0.tar.gz` |
| SHA-256 herramientas Omeka | `58f7cedf243839d35d045b07c5e99d4b99e0e9501faafa095fc270f014c895a1` |
| Commit incluido en runtime desplegado | `195ef70` |
| Commit de automatizacion posterior | `85ed680` |

## Verificacion ejecutada

```powershell
$env:PNPU_ACCEPTANCE_BASE_URL="https://editorial.reduniv.edu.cu"
$env:PNPU_ACCEPTANCE_REQUIRE_OMEKA="true"
npm run acceptance:v0.1
```

Tambien se verificaron los endpoints publicos:

```text
https://editorial.reduniv.edu.cu/version
https://editorial.reduniv.edu.cu/health/catalog
https://catalogo.reduniv.edu.cu/api/items
```

## Resultado de aceptacion publica

```text
PNPU v0.1 acceptance report for https://editorial.reduniv.edu.cu

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

## Estado del catalogo

`/health/catalog` reporto:

```text
status: ready
catalogRepository: omeka
omeka.baseUrl: http://127.0.0.1
items: 18
itemSets: 3
media: 3
resources: 24
publication: 3
publisher: 3
contributor: 4
university: 3
collection: 3
subject: 5
digitalResource: 3
missingPnpuTemplates: 0
quality.warnings: 0
quality.rejected: 0
readyForPnpuMapping: true
```

`https://catalogo.reduniv.edu.cu/api/items` respondio `200`.

## Observaciones

- El portal publico queda publicado por HAProxy en `https://editorial.reduniv.edu.cu`.
- Omeka S queda publicado por HAProxy en `https://catalogo.reduniv.edu.cu`.
- La integracion interna del portal hacia Omeka usa `http://127.0.0.1`.
- El perfil PNPU de Omeka fue instalado correctamente.
- El seed de prueba quedo cargado para validacion inicial.
- El endpoint de refresco de catalogo funciona con `X-PNPU-Refresh-Token`.
- La autenticacion administrativa OIDC existe en codigo, pero este entorno permanece en modo token
  hasta configurar Keycloak.
- `Readme/` permanece fuera del control de versiones.

## Decision

La version `0.1.0` queda aceptada como despliegue inicial publico. El siguiente bloque aprobado debe
ser la configuracion real de Keycloak/OIDC y roles administrativos/editoriales.

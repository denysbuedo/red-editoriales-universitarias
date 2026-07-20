# Release 0.1 - Readiness operativo

## Objetivo

Definir el alcance minimo verificable para publicar una version inicial operativa de PNPU sin
redisenar la arquitectura aprobada.

La version 0.1 no pretende cerrar todos los flujos editoriales futuros. Debe dejar funcionando el
portal publico, la integracion Omeka S, la observabilidad basica, el acceso administrativo y el
camino controlado para importar publicaciones.

## Alcance incluido

| Area | Estado v0.1 | Evidencia |
|---|---|---|
| Portal publico | Incluido | Home, publicaciones, editoriales, autores, materias y colecciones |
| API publica | Incluido | OpenAPI 3.1 y endpoints `/v1/*` |
| Catalogo Omeka S | Incluido | Repositorio `omeka`, snapshot cacheado y diagnostico `/health/catalog` |
| Importacion controlada | Incluido | Diagnostico, preview, dry-run, plan, commit, auditoria y rollback |
| Identidad administrativa | Incluido | OIDC/Keycloak, PKCE, cookie HTTP-only y roles granulares |
| Alcance editorial | Base incluida | Roles editoriales y claims `pnpu_editorial_ids` |
| Observabilidad | Incluido | `/health/live`, `/health/ready`, `/metrics`, logs y correlacion |
| Infraestructura | Incluido | GitHub Actions, Ansible, systemd, release artifact y rollback |
| Manuales operativos | Incluido | Manual admin y manual responsables editoriales en MD y HTML |

## Fuera de alcance v0.1

- Edicion directa de metadatos dentro de PNPU.
- Workflow completo de libros en proceso de edicion.
- API oficial del Sistema de Gestion de Editoriales.
- Persistencia PostgreSQL de flujos administrativos.
- Cache distribuida Redis/Valkey en produccion.
- Alta disponibilidad con HAProxy remoto configurada desde este repositorio.
- Sites Omeka S por editorial como canal publico principal.
- Kafka o mensajeria asincrona.

## Variables requeridas

### Portal

| Variable | Requerida | Uso |
|---|---:|---|
| `NODE_ENV` | Si | Entorno de ejecucion |
| `PORT` | Si | Puerto local del proceso Next.js |
| `PNPU_PUBLIC_BASE_URL` | Si | URL publica canonica |
| `PNPU_COMMIT_SHA` | Recomendado | Trazabilidad de despliegue |
| `PNPU_LOG_LEVEL` | Recomendado | Nivel de logs |
| `PNPU_ENABLE_REQUEST_LOGS` | Recomendado | Activacion de logs HTTP |

### Catalogo Omeka S

| Variable | Requerida | Uso |
|---|---:|---|
| `PNPU_CATALOG_REPOSITORY` | Si | Debe ser `omeka` para v0.1 operativa con catalogo real |
| `PNPU_OMEKA_BASE_URL` | Si | URL base de Omeka S |
| `PNPU_OMEKA_TIMEOUT_MS` | Recomendado | Timeout de API Omeka |
| `PNPU_OMEKA_PAGE_SIZE` | Recomendado | Tamano de pagina Omeka |
| `PNPU_OMEKA_MAX_PAGES` | Recomendado | Limite de paginacion defensivo |
| `PNPU_OMEKA_CACHE_TTL_SECONDS` | Recomendado | TTL del snapshot en memoria |
| `PNPU_OMEKA_REQUIRE_APPROVED_MAPPING` | Si | Exige perfil PNPU aprobado |
| `PNPU_CATALOG_REFRESH_TOKEN` | Si | Refresco controlado de snapshot |

### Escritura Omeka S

| Variable | Requerida | Uso |
|---|---:|---|
| `PNPU_OMEKA_KEY_IDENTITY` | Si para escritura | Clave API Omeka S |
| `PNPU_OMEKA_KEY_CREDENTIAL` | Si para escritura | Credencial API Omeka S |
| `PNPU_OMEKA_IMPORT_ENABLED` | Si para commit | Habilita escritura controlada |
| `PNPU_OMEKA_ROLLBACK_ENABLED` | Si para rollback | Habilita rollback controlado |

### Identidad

| Variable | Requerida | Uso |
|---|---:|---|
| `PNPU_ADMIN_AUTH_MODE` | Si | `oidc` en produccion, `hybrid` en transicion |
| `PNPU_ADMIN_REQUIRED_ROLE` | Si | Administrador nacional |
| `PNPU_ADMIN_IMPORT_READ_ROLE` | Si | Lectura/importacion no destructiva |
| `PNPU_ADMIN_IMPORT_WRITE_ROLE` | Si | Commit hacia Omeka |
| `PNPU_ADMIN_IMPORT_ROLLBACK_ROLE` | Si | Rollback controlado |
| `PNPU_EDITORIAL_COORDINATOR_ROLE` | Si | Responsable principal editorial |
| `PNPU_EDITORIAL_METADATA_EDITOR_ROLE` | Si | Editor de metadatos editorial |
| `PNPU_EDITORIAL_REVIEWER_ROLE` | Si | Revisor editorial |
| `PNPU_EDITORIAL_VIEWER_ROLE` | Si | Consulta editorial |
| `PNPU_OIDC_ISSUER` | Si | Realm/proveedor OIDC |
| `PNPU_OIDC_AUDIENCE` | Si | Audiencia esperada del JWT |
| `PNPU_OIDC_CLIENT_ID` | Si | Cliente OIDC |
| `PNPU_OIDC_CLIENT_SECRET` | Segun cliente | Secreto si el cliente lo requiere |
| `PNPU_OIDC_SCOPES` | Recomendado | `openid profile email` |
| `PNPU_PUBLICATION_IMPORT_TOKEN` | Solo local/transicion | Token temporal de desarrollo |

## Criterios de aceptacion

### Calidad

- `npm run quality` termina correctamente.
- `npm run build` termina correctamente.
- `npm audit --audit-level=moderate` no reporta vulnerabilidades bloqueantes.
- No quedan secretos en archivos versionados.
- `Readme/` u otros documentos externos no se incorporan accidentalmente.

### Contratos y documentacion

- `python scripts/validate-openapi.py` valida OpenAPI.
- `npm run docs:manuals:check` confirma manuales HTML sincronizados.
- `npm run docs:release:check` confirma que este readiness contiene secciones criticas.
- OpenAPI expone rutas publicas, operativas y roles administrativos.
- Manuales describen roles nacionales y roles editoriales.

### Omeka S

- `npm run omeka:check` reporta perfil PNPU listo.
- `npm run omeka:map` reconoce publicaciones, editoriales, autores, materias y colecciones.
- `/health/catalog` devuelve estado operativo y calidad del snapshot.
- `/health/catalog/refresh` exige `X-PNPU-Refresh-Token`.
- La navegacion publica consume datos desde Omeka cuando `PNPU_CATALOG_REPOSITORY=omeka`.

### Seguridad

- En produccion `PNPU_ADMIN_AUTH_MODE=oidc`.
- El login administrativo usa `/api/admin/auth/login` con PKCE.
- El callback OIDC valida firma RS256, issuer, audience, expiracion, nonce y roles.
- Las cookies administrativas son HTTP-only.
- Los endpoints de importacion validan roles granulares.
- Los responsables editoriales requieren rol y claim de editorial asignada.

### Operacion

- `/health/live` responde `ok`.
- `/health/ready` responde `ready`.
- `/metrics` expone metricas Prometheus.
- `/version` expone version `0.1.0`.
- `npm run smoke` pasa contra servidor productivo local.
- El artefacto se genera con `npm run package:release`.
- El artefacto se valida con `npm run package:validate`.
- Ansible puede ejecutar syntax-check de provision, deploy, verify y rollback.

## Pruebas de aceptacion manual

1. Abrir `/` y verificar estadisticas coherentes con Omeka.
2. Abrir `/publicaciones` y filtrar por editorial y materia.
3. Abrir una ficha de publicacion y verificar ISBN/DOI, licencia, recursos y contribuyentes.
4. Abrir `/editoriales`, `/autores`, `/materias` y `/colecciones`.
5. Abrir `/estado` y verificar fecha de snapshot.
6. Ejecutar refresh con token valido y confirmar snapshot actualizado.
7. Entrar a `/admin/importaciones/publicaciones` con token local solo en desarrollo.
8. Probar login OIDC en entorno con Keycloak configurado.
9. Ejecutar diagnostico de planilla sin escritura.
10. Ejecutar preview, dry-run y plan de commit antes de cualquier escritura.

## Decision de salida

La v0.1 puede publicarse cuando todos los criterios automaticos y manuales aplicables esten en
estado `OK` o tengan una excepcion documentada por el responsable del proyecto.

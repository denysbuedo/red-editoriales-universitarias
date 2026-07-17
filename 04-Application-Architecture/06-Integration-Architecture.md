
# Integration Architecture

## Objetivo
Definir la estrategia de integración entre la PNPU y los sistemas internos y externos.

## Principios
- API First
- Arquitectura federada
- Sin acceso directo a BD externas
- Integraciones idempotentes
- Versionado de APIs

## Sistemas Integrados
| Sistema | Rol | Dirección |
|---|---|---|
| Sistema Gestión Editoriales | Fuente maestra institucional | PNPU consume |
| Omeka S | Fuente maestra bibliográfica | PNPU consume |
| CMS | Contenido institucional | PNPU consume |
| Observatorio | Indicadores | PNPU consume |
| API Pública | Exposición | PNPU publica |

## Patrones
- REST síncrono
- Sincronización programada
- Webhooks (futuro)
- Eventos (R4)

## Adaptadores
- EditorialRegistryAdapter
- OmekaAdapter
- CMSAdapter
- AnalyticsAdapter

## Sincronización
1. Detectar cambios
2. Validar
3. Normalizar
4. Deduplicar
5. Indexar
6. Registrar auditoría

## Gestión de errores
- Timeout
- Retry exponencial
- Circuit Breaker
- Dead Letter (futuro)

## Seguridad
- HTTPS
- OAuth2/API Keys
- Secret Manager
- Auditoría

## Observabilidad
- Logs estructurados
- Métricas por integración
- Health checks
- Dashboard de integraciones

## ADR
- Integraciones exclusivamente mediante APIs.
- Ningún sistema externo conocerá el modelo interno PNPU.

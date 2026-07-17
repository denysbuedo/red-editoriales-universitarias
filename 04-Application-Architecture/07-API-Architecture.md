
# API Architecture

## Objetivo
Definir el estándar para todas las APIs de la PNPU.

## Estilo
- REST
- JSON
- OpenAPI 3.1
- Versionado /v1

## Recursos
- /publications
- /contributors
- /publishers
- /collections
- /subjects
- /search

## Convenciones
GET /publications
GET /publications/{id}
GET /publishers
GET /search?q=

## Respuesta

{
  "data": [],
  "pagination": {},
  "links": {},
  "meta": {}
}

## Errores

{
  "code":"PNPU-404",
  "message":"Publication not found",
  "correlationId":"..."
}

## Versionado
- Cambios incompatibles => nueva versión mayor.
- Deprecación mínima: 12 meses.

## Seguridad
- HTTPS obligatorio
- OAuth2 para APIs protegidas
- API Keys para terceros
- Rate limiting

## Paginación
page
pageSize
total
totalPages

## Filtros
publisher
subject
year
language
collection
author

## Ordenamiento
sort=title,-date

## Documentación
OpenAPI + Swagger UI + ejemplos.

## Criterios
- Idempotencia en GET.
- Contratos tipados.
- Sin lógica de negocio en controladores.

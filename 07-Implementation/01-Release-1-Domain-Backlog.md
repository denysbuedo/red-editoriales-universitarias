---
title: Release 1 - Domain Backlog
version: 1.0
status: Draft
owner: Ministerio de Educación Superior
project: Plataforma Nacional de Publicaciones Universitarias (PNPU)
last_update: 2026-07-15
related_documents:
  - ../03-Information-Architecture/01-Domain-Model.md
  - ../03-Information-Architecture/02-Metadata-Model.md
  - ../03-Information-Architecture/05-Identifier-Strategy.md
  - ../04-Application-Architecture/05-Application-Services.md
  - ../04-Application-Architecture/07-API-Architecture.md
---

# 1. Objetivo

Implementar el núcleo del dominio editorial de la PNPU respetando la arquitectura aprobada.

Release 1 introduce código de dominio, contratos de aplicación y APIs de lectura iniciales. No
incorpora integración real con Omeka S ni PostgreSQL hasta que existan adaptadores y migraciones
aprobadas dentro de esta misma release.

# 2. Alcance

Incluye:

- modelo de dominio editorial;
- value objects;
- reglas de dominio documentadas;
- repositorios como puertos;
- servicios de aplicación de lectura;
- APIs REST versionadas `/v1`;
- OpenAPI de dominio;
- pruebas unitarias e integración iniciales;
- documentación técnica de componentes.

No incluye:

- administración editorial;
- autenticación Keycloak;
- escritura desde UI;
- integración productiva con Omeka S;
- búsqueda avanzada;
- OpenSearch;
- analítica de negocio.

# 3. Referencias arquitectónicas

- `Publication` es el aggregate root principal.
- `Publisher`, `University`, `Contributor`, `Collection`, `Subject`, `Identifier` y `Resource`
  son conceptos del dominio.
- Los identificadores corporativos usan UUID.
- ISBN, DOI y ORCID deben normalizarse y validarse como Value Objects.
- Las APIs son REST, JSON, OpenAPI 3.1 y versionadas bajo `/v1`.
- Los controladores no contienen lógica de negocio.

# 4. Secuencia de implementación

## R1-DOM-001 - Estructura Clean/Hexagonal del dominio

Crear estructura inicial bajo `src/modules/catalog`.

Entregables:

- `domain`;
- `application`;
- `infrastructure`;
- `interfaces/http`;
- barrel exports internos cuando aporten claridad.

Criterios de aceptación:

- no se reorganiza la estructura existente;
- no se introduce persistencia;
- compila en modo estricto;
- incluye documentación técnica breve.

## R1-DOM-002 - Value Objects de identificadores

Implementar:

- `PnpuUuid`;
- `Isbn`;
- `Doi`;
- `Orcid`;
- `LanguageCode`.

Criterios de aceptación:

- normalización documentada;
- validación de ISBN por dígito de control;
- validación de ORCID por algoritmo oficial;
- DOI normalizado sin resolver red externa;
- pruebas unitarias para valores válidos e inválidos.

## R1-DOM-003 - Entidades base

Implementar entidades puras de dominio:

- `University`;
- `Publisher`;
- `Contributor`;
- `Collection`;
- `Subject`;
- `Identifier`;
- `Resource`.

Criterios de aceptación:

- sin dependencias de Next.js;
- sin dependencias de base de datos;
- invariantes mínimas en constructores/fábricas;
- tests unitarios.

## R1-DOM-004 - Aggregate Root Publication

Implementar `Publication`.

Reglas obligatorias:

- DR-001: toda publicación pertenece a un Publisher;
- DR-003: toda publicación posee al menos un Contributor;
- DR-004: toda publicación posee al menos un Identifier;
- DR-005: toda publicación posee al menos un Resource;
- idioma obligatorio;
- fecha de publicación obligatoria;
- subject obligatorio.

Criterios de aceptación:

- creación válida;
- rechazo de estados inválidos;
- métodos de consulta sin mutación accidental;
- tests unitarios por regla.

## R1-DOM-005 - Puertos de repositorio

Definir interfaces:

- `PublicationRepository`;
- `PublisherRepository`.

Criterios de aceptación:

- interfaces viven en capa de aplicación o dominio según dependencia final;
- no contienen detalles SQL, Omeka ni HTTP;
- soportan consulta por UUID y listado paginado;
- tests con doubles en servicios de aplicación.

## R1-DOM-006 - Servicios de aplicación R1

Implementar:

- `PublicationService`;
- `PublisherService`;
- `SitemapService` inicial.

Casos de uso:

- obtener ficha pública;
- listar publicaciones;
- publicaciones recientes;
- listar editoriales;
- consultar ficha editorial.

Criterios de aceptación:

- servicios no conocen UI;
- errores normalizados;
- entradas tipadas;
- pruebas unitarias con repositorios en memoria.

## R1-DOM-007 - DTOs y mappers

Crear DTOs:

- `PublicationSummary`;
- `PublicationDetail`;
- `PublisherSummary`;
- `PublisherDetail`.

Criterios de aceptación:

- DTOs son contratos de salida;
- mappers separados del dominio;
- no exponen identificadores técnicos internos.

## R1-DOM-008 - Adaptador in-memory de lectura

Crear adaptadores in-memory para desarrollo y pruebas.

Criterios de aceptación:

- datos sintéticos;
- sin datos reales;
- útil para integración API inicial;
- reemplazable por Omeka/PostgreSQL sin cambiar servicios.

## R1-API-001 - API `GET /v1/publications`

Implementar listado paginado.

Criterios de aceptación:

- respuesta con `data`, `pagination`, `links`, `meta`;
- soporta `page` y `pageSize`;
- sin lógica de negocio en route handler;
- OpenAPI actualizado;
- tests de integración.

## R1-API-002 - API `GET /v1/publications/{id}`

Implementar ficha pública por UUID PNPU.

Criterios de aceptación:

- respuesta `PublicationDetail`;
- error `PNPU-404` con `correlationId`;
- OpenAPI actualizado;
- tests de integración.

## R1-API-003 - API `GET /v1/publishers`

Implementar listado de editoriales.

Criterios de aceptación:

- respuesta paginada;
- OpenAPI actualizado;
- tests de integración.

## R1-API-004 - API `GET /v1/publishers/{id}`

Implementar ficha editorial.

Criterios de aceptación:

- no permite modificar datos institucionales;
- error `PNPU-404` normalizado;
- OpenAPI actualizado;
- tests de integración.

## R1-API-005 - OpenAPI de dominio

Extender `openapi/pnpu-portal.openapi.yml`.

Criterios de aceptación:

- OpenAPI 3.1 válido;
- esquemas reutilizables;
- ejemplos mínimos;
- `scripts/validate-openapi.py` pasa.

## R1-TEST-001 - Pruebas de integración API

Agregar pruebas de route handlers.

Criterios de aceptación:

- cubren éxito y errores;
- no requieren red externa;
- no requieren base de datos real;
- se ejecutan con `npm test`.

# 5. Definition of Done de Release 1

Release 1 se considera terminada cuando:

- el dominio compila en TypeScript estricto;
- las reglas DR-001 a DR-005 tienen pruebas;
- las APIs `/v1/publications` y `/v1/publishers` funcionan con adaptador in-memory;
- OpenAPI documenta todas las rutas implementadas;
- los errores siguen el formato normalizado;
- no existen `any` innecesarios;
- `npm run quality`, `npm run build`, `npm run smoke`, validadores y empaquetado pasan;
- la documentación técnica está actualizada.

# 6. Riesgos y controles

| Riesgo | Control |
|---|---|
| Convertir PNPU en CMS | Mantener dominio de publicaciones separado de contenidos |
| Acoplar dominio a Omeka S | Usar puertos/adaptadores |
| Exponer identificadores técnicos | Revisar DTOs y mappers |
| Saltar reglas de metadatos | Tests de invariantes |
| Hacer APIs sin contrato | OpenAPI obligatorio por tarea |

# 7. Primera tarea recomendada

Iniciar por `R1-DOM-002 - Value Objects de identificadores`.

Justificación:

- reduce riesgo temprano;
- no requiere base de datos;
- valida reglas críticas de interoperabilidad;
- prepara `Publication` y APIs sin dependencia externa.

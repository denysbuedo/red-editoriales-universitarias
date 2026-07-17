# Dominio de catalogo

## Value Objects de identificadores

El primer incremento de Release 1 implementa Value Objects puros bajo
`src/modules/catalog/domain/value-objects`.

Normalizacion aplicada:

- `PnpuUuid`: elimina espacios, convierte a minusculas y exige UUID v7.
- `Isbn`: elimina espacios y guiones, convierte `x` a `X` y valida checksum ISBN-10 o ISBN-13.
- `Doi`: acepta DOI crudo, `doi:`, `https://doi.org/` o `http://dx.doi.org/` y normaliza a
  `https://doi.org/{doi}` sin resolver red externa.
- `Orcid`: acepta forma compacta, con guiones o URI y normaliza a
  `https://orcid.org/0000-0000-0000-0000`, validando ISO 7064 Mod 11-2.
- `LanguageCode`: elimina espacios, convierte a minusculas y exige ISO 639-1 alfa-2.

Los errores de validacion usan `DomainValidationError`. La traduccion a errores HTTP pertenece a la
capa `interfaces/http`, no al dominio.

## Entidades base

`R1-DOM-003` introduce entidades puras para `University`, `Publisher`, `Contributor`, `Collection`,
`Subject`, `Identifier` y `Resource`.

Invariantes aplicadas:

- `University` exige identificador PNPU, nombre oficial y pais ISO 3166-1 alfa-2.
- `Publisher` exige identificador PNPU, nombre oficial, pais y relacion con `University`.
- `Contributor` exige identificador PNPU, nombre y al menos un rol controlado.
- `Collection` exige identificador PNPU, titulo y relacion con `Publisher`.
- `Subject` exige identificador y etiqueta preferida.
- `Identifier` normaliza segun tipo: ISBN, eISBN, DOI, URI, Handle o UUID PNPU.
- `Resource` exige URL, formato y tipo de recurso; el tamano, cuando exista, debe ser entero no
  negativo.

## Aggregate root Publication

`Publication` es el aggregate root principal del catalogo.

Reglas aplicadas:

- DR-001: toda publicacion pertenece a un `Publisher`.
- DR-003: toda publicacion posee al menos un `Contributor`.
- DR-004: toda publicacion posee al menos un `Identifier`.
- DR-005: toda publicacion posee al menos un `Resource`.
- El idioma, la fecha de publicacion, el tipo documental, el formato y al menos un `Subject` son
  obligatorios.

Los metodos de consulta devuelven copias de arreglos para evitar mutacion accidental del estado del
aggregate.

## Puertos y servicios de aplicacion

`R1-DOM-005` define los puertos `PublicationRepository` y `PublisherRepository` en la capa de
aplicacion. Estos puertos no contienen detalles SQL, Omeka S, Redis ni HTTP.

`R1-DOM-006` introduce:

- `PublicationService`: obtiene ficha publica, lista publicaciones y publicaciones recientes.
- `PublisherService`: lista editoriales y consulta ficha editorial.
- `SitemapService`: genera entradas iniciales para publicaciones y editoriales.

Los servicios usan `ApplicationError` con codigos normalizados `PNPU-*`. La capa HTTP sera
responsable de serializar esos errores con `correlationId`.

## Adaptadores in-memory

`R1-DOM-008` agrega adaptadores in-memory para lectura inicial:

- `InMemoryPublicationRepository`
- `InMemoryPublisherRepository`

Estos adaptadores usan datos sinteticos creados por `createSampleCatalogData`. Su objetivo es
habilitar pruebas, desarrollo local y las primeras APIs `/v1` sin acoplar los servicios a Omeka S o
PostgreSQL.

La composicion de repositorios se centraliza en `createCatalogRepositories` para el modo sincronico
`in-memory` y en `createCatalogRepositoriesAsync` para fuentes externas. El modo se controla con
`PNPU_CATALOG_REPOSITORY`.

`PNPU_CATALOG_REPOSITORY=omeka` esta cableado solo en la composicion asincrona usada por las paginas
y rutas HTTP. Requiere `PNPU_OMEKA_REQUIRE_APPROVED_MAPPING=true`, `PNPU_OMEKA_BASE_URL` configurado
y un catalogo Omeka sin rechazos de calidad en el mapeo. Sin esas condiciones, la aplicacion falla
de forma explicita y conserva el modo `in-memory` como valor por defecto.

## Adaptador Omeka S

Se agrega una base tecnica para `OmekaAdapter` en `src/modules/catalog/infrastructure/omeka`.

Incluye:

- `readOmekaConfig`: lee `PNPU_OMEKA_BASE_URL` y `PNPU_OMEKA_TIMEOUT_MS`.
- `HttpOmekaApiClient`: consume `/api/items`, `/api/item_sets` y `/api/media`.
- `checkOmekaHealth`: verifica disponibilidad básica de Omeka mediante API.
- `OmekaCatalogSnapshotLoader`: carga snapshots paginados de Items, Item Sets y Media.
- `mapOmekaSnapshotToPnpuCatalog`: convierte snapshots Omeka en entidades de dominio PNPU cuando
  las plantillas PNPU estan presentes.
- Mappers de referencia y publicacion: convierten `PNPU Subject`, `Contributor`, `University`,
  `Publisher`, `Collection`, `Publication` y `Digital Resource`, registrando rechazos de calidad
  cuando faltan campos obligatorios o referencias.
- `createOmekaCatalogRepositories`: expone el catalogo Omeka mapeado mediante los puertos de
  aplicacion `PublicationRepository`, `PublisherRepository`, `ContributorRepository`,
  `CollectionRepository` y `SubjectRepository`.
- `createCatalogRepositoriesAsync`: compone el cliente HTTP de Omeka, el snapshot loader, los
  mappers y los repositorios de aplicacion cuando `PNPU_CATALOG_REPOSITORY=omeka` esta habilitado.
- timeouts por solicitud;
- validacion minima de JSON externo;
- traduccion de errores externos a `PNPU-503`.

El adaptador esta cableado como fuente activa opcional, pero permanece protegido por
`PNPU_OMEKA_REQUIRE_APPROVED_MAPPING=true`. Hasta que el perfil PNPU este instalado y los datos
cumplan el mapeo, las APIs publicas deben seguir usando el adaptador in-memory.

La propuesta tecnica inicial de mapeo esta documentada en
`docs/omeka-pnpu-mapping-proposal.md`. Esa propuesta no activa el modo Omeka; sirve como base para
aprobacion o para una ADR posterior.

`npm run omeka:check` ejecuta un diagnostico operativo contra `PNPU_OMEKA_BASE_URL` y reporta
conteos de Items, Item Sets, Media, Resource Templates PNPU faltantes y plantillas desconocidas. El
procedimiento local esta documentado en `docs/omeka-local-runbook.md`.

`/health/ready` reporta `dependencies.omeka` solo cuando `PNPU_OMEKA_BASE_URL` esta configurado. Los
valores posibles son `available`, `unavailable` y `misconfigured`. La respuesta general permanece
`ready` porque el portal actual opera en modo degradado sin depender productivamente de Omeka.

## DTOs, mappers y API de publicaciones

`R1-DOM-007` agrega DTOs de salida y mappers separados del dominio:

- `PublicationSummary`
- `PublicationDetail`
- `PublisherSummary`
- `PublisherDetail`

Los DTOs solo exponen identificadores publicos PNPU y metadatos bibliograficos necesarios para la API
publica.

`PublicationSummary` esta pensado para listados y busqueda inicial. Incluye titulo, subtitulo,
fecha, idioma, tipo documental, licencia, identificador principal, materias, palabras clave y
editorial. No reemplaza la ficha completa.

`PublicationDetail` extiende ese resumen con resumen descriptivo, formato, contribuyentes,
identificadores completos y recursos digitales. Los recursos exponen URL, formato, tipo, idioma,
tamano, checksum y licencia cuando existen en el modelo canonico.

`R1-API-001` y `R1-API-002` agregan:

- `GET /v1/publications`
- `GET /v1/publications/{id}`

`GET /v1/publications` acepta filtros de lectura sobre el catalogo publico:

- `q`: busqueda textual en titulo, subtitulo, resumen, editorial, identificadores, materias y
  palabras clave.
- `publisherId`: UUID PNPU de la editorial.
- `contributorId`: UUID PNPU del autor o contribuyente.
- `collectionId`: UUID PNPU de la coleccion editorial.
- `language`: codigo ISO 639-1.
- `subject`: texto o identificador de materia.
- `sort`: criterio de ordenamiento cerrado. Valores soportados:
  `publicationDateDesc`, `publicationDateAsc`, `titleAsc`, `titleDesc`, `publisherAsc`.

Los filtros se normalizan en la capa de aplicacion y se trasladan al puerto
`PublicationRepository` mediante `PublicationListQuery`. La implementacion in-memory filtra y ordena
antes de paginar.

`R1-API-003` y `R1-API-004` agregan:

- `GET /v1/publishers`
- `GET /v1/publishers/{id}`

`R1-API-005` y `R1-API-006` agregan autoridades de autores y contribuyentes:

- `GET /v1/contributors`
- `GET /v1/contributors/{id}`

La ficha de contribuyente se construye desde `ContributorRepository` y la relacion inversa con
publicaciones se resuelve mediante `PublicationRepository` filtrando por `contributorId`. Esta
relacion no duplica el modelo canonico de publicaciones.

`R1-API-007` y `R1-API-008` agregan taxonomia publica de materias:

- `GET /v1/subjects`
- `GET /v1/subjects/{identifier}`

La ficha de materia se construye desde `SubjectRepository` y la relacion inversa con publicaciones
se resuelve mediante `PublicationRepository` filtrando por `subject`. Los identificadores de materia
se usan como clave publica y deben ir codificados en URL cuando contienen caracteres reservados.

`R1-API-009` y `R1-API-010` agregan colecciones editoriales:

- `GET /v1/collections`
- `GET /v1/collections/{id}`

La ficha de colección se construye desde `CollectionRepository` y la relacion inversa con
publicaciones se resuelve mediante `PublicationRepository` filtrando por `collectionId`.

Las rutas invocan servicios de aplicacion, devuelven `data`, `pagination`, `links` y `meta` cuando
aplica, y traducen `ApplicationError` a respuestas `PNPU-*` con `correlationId`.

El sitemap tecnico de Next.js consume `SitemapService` para incluir URLs públicas de publicaciones y
editoriales y autores desde los mismos puertos de lectura usados por la API.

## Páginas públicas iniciales

La primera experiencia pública server-rendered expone:

- `/publicaciones`
- `/publicaciones/{uuid}`
- `/editoriales`
- `/editoriales/{uuid}`
- `/autores`
- `/autores/{uuid}`
- `/materias`
- `/materias/{identifier}`
- `/colecciones`
- `/colecciones/{uuid}`

Estas páginas reutilizan los servicios de aplicación y mappers del catálogo. No consultan Omeka S,
PostgreSQL ni APIs externas directamente.

Las fichas públicas generan metadatos SEO server-side:

- canonical URL y Open Graph desde `PNPU_PUBLIC_BASE_URL`;
- JSON-LD `Book` para publicaciones, con identificadores, autores, editorial, materias, palabras
  clave y recursos digitales;
- JSON-LD `Organization` para editoriales, con universidad matriz, dirección territorial y punto de
  contacto institucional.
- JSON-LD `Person` para autores y contribuyentes personales, con ORCID y publicaciones asociadas.
- JSON-LD `DefinedTerm` para materias, con codigo de termino y publicaciones clasificadas.
- JSON-LD `CollectionPage` para colecciones editoriales, con editorial, materias y publicaciones
  incluidas.

La serialización JSON-LD se centraliza en `src/shared/seo/json-ld.tsx` para evitar duplicación y
escapar caracteres peligrosos antes de insertar el bloque `application/ld+json`.

# Propuesta de mapeo Omeka S -> PNPU

Estado: Propuesta pendiente de aprobacion  
Fecha: 2026-07-16  
Alcance: Catalogo bibliografico PNPU  
Decision requerida: aprobar Resource Templates y propiedades antes de activar
`PNPU_CATALOG_REPOSITORY=omeka`

## 1. Objetivo

Definir el mapeo tecnico entre Omeka S y el modelo canonico PNPU para implementar el adaptador
`OmekaAdapter` sin cambiar la arquitectura existente.

Este documento no reemplaza ADRs ni modifica el modelo de informacion. Es una propuesta operativa
para aprobacion por arquitectura/gobierno de datos.

## 2. Principios

- Omeka S es la fuente maestra bibliografica.
- PNPU consume Omeka S mediante API REST; no accede a la base de datos de Omeka.
- El dominio PNPU no importa tipos ni estructuras de Omeka.
- El adaptador Omeka debe implementar los puertos de aplicacion existentes.
- Los datos externos se validan antes de crear entidades de dominio PNPU.
- Registros incompletos no deben corromper el catalogo publico.

## 3. Resource Templates propuestos

| Template Omeka S        | Tipo Omeka | Entidad PNPU  |
| ----------------------- | ---------- | ------------- |
| `PNPU Publication`      | Item       | `Publication` |
| `PNPU Contributor`      | Item       | `Contributor` |
| `PNPU Publisher`        | Item       | `Publisher`   |
| `PNPU University`       | Item       | `University`  |
| `PNPU Collection`       | Item Set   | `Collection`  |
| `PNPU Subject`          | Item       | `Subject`     |
| `PNPU Digital Resource` | Media      | `Resource`    |

La propuesta usa Item Sets para colecciones editoriales porque Omeka S ya los modela como conjuntos
de Items. Si se decide representar colecciones tambien como Items, debe aprobarse explicitamente una
variante de este mapeo.

## 4. Namespaces y vocabularios

| Prefijo   | Namespace                              | Uso                            |
| --------- | -------------------------------------- | ------------------------------ |
| `dcterms` | `http://purl.org/dc/terms/`            | metadatos descriptivos         |
| `schema`  | `https://schema.org/`                  | SEO y entidades web            |
| `foaf`    | `http://xmlns.com/foaf/0.1/`           | personas                       |
| `bibo`    | `http://purl.org/ontology/bibo/`       | identificadores bibliograficos |
| `skos`    | `http://www.w3.org/2004/02/skos/core#` | materias                       |
| `pnpu`    | `https://pnpu.mes.gob.cu/ns#`          | extensiones PNPU               |

## 5. Mapeo de Publication

Template: `PNPU Publication`  
Omeka: Item  
PNPU: `Publication`

| PNPU              | Omeka S                                       | Obligatorio | Validacion                             |
| ----------------- | --------------------------------------------- | ----------- | -------------------------------------- |
| `id`              | `pnpu:uuid`                                   | Si          | UUID v7                                |
| `title`           | `dcterms:title`                               | Si          | texto no vacio                         |
| `subtitle`        | `dcterms:alternative`                         | No          | texto                                  |
| `abstract`        | `dcterms:abstract`                            | Recomendado | texto                                  |
| `publicationDate` | `dcterms:issued`                              | Si          | fecha ISO `YYYY-MM-DD`                 |
| `language`        | `dcterms:language`                            | Si          | ISO 639-1                              |
| `type`            | `dcterms:type`                                | Si          | vocabulario controlado PNPU            |
| `format`          | `dcterms:format`                              | Si          | MIME o formato normalizado             |
| `license`         | `dcterms:license`                             | Recomendado | texto/URI de licencia                  |
| `publisher`       | `dcterms:publisher`                           | Si          | enlace a `PNPU Publisher`              |
| `contributors`    | `dcterms:creator` / `dcterms:contributor`     | Si          | 1..n enlaces a Contributor             |
| `identifiers`     | `dcterms:identifier`, `bibo:isbn`, `bibo:doi` | Si          | al menos ISBN/DOI/URI/UUID             |
| `subjects`        | `dcterms:subject`                             | Si          | 1..n enlaces a Subject o terminos SKOS |
| `collection`      | `dcterms:isPartOf`                            | No          | enlace a Item Set/Collection           |
| `keywords`        | `schema:keywords`                             | No          | maximo 10 terminos                     |
| `resources`       | Media del Item                                | Si          | al menos un recurso digital            |

Regla propuesta: una publicacion sin `pnpu:uuid` no entra al catalogo publico. El adaptador puede
registrarla como error de calidad para correccion en Omeka.

## 6. Mapeo de Contributor

Template: `PNPU Contributor`  
Omeka: Item  
PNPU: `Contributor`

| PNPU          | Omeka S                                    | Obligatorio | Validacion        |
| ------------- | ------------------------------------------ | ----------- | ----------------- |
| `id`          | `pnpu:uuid`                                | Si          | UUID v7           |
| `name`        | `foaf:name` o `schema:name`                | Si          | texto no vacio    |
| `givenName`   | `foaf:givenName`                           | No          | texto             |
| `familyName`  | `foaf:familyName`                          | No          | texto             |
| `roles`       | `schema:roleName` o `pnpu:contributorRole` | Si          | vocabulario PNPU  |
| `orcid`       | `schema:sameAs`                            | Recomendado | ORCID normalizado |
| `affiliation` | `schema:affiliation`                       | Recomendado | texto o enlace    |
| `biography`   | `schema:description`                       | No          | texto             |
| `country`     | `schema:nationality`                       | No          | ISO 3166-1 alfa-2 |

Roles admitidos por el dominio actual: `author`, `editor`, `scientificEditor`, `compiler`,
`translator`, `illustrator`, `reviewer`, `contributor`, `organization`.

## 7. Mapeo de Publisher y University

Templates: `PNPU Publisher`, `PNPU University`  
Omeka: Item  
PNPU: `Publisher`, `University`

### Publisher

| PNPU                     | Omeka S                         | Obligatorio |
| ------------------------ | ------------------------------- | ----------- |
| `id`                     | `pnpu:uuid`                     | Si          |
| `officialName`           | `schema:name` / `dcterms:title` | Si          |
| `acronym`                | `schema:alternateName`          | No          |
| `publisherCode`          | `pnpu:publisherCode`            | No          |
| `description`            | `dcterms:description`           | No          |
| `university`             | `schema:parentOrganization`     | Si          |
| `province`               | `schema:addressLocality`        | No          |
| `country`                | `schema:addressCountry`         | Si          |
| `website`                | `schema:url`                    | No          |
| `logo`                   | `schema:logo`                   | No          |
| `contactPoint.email`     | `schema:email`                  | No          |
| `contactPoint.telephone` | `schema:telephone`              | No          |
| `contactPoint.url`       | `schema:contactPoint`           | No          |

### University

| PNPU             | Omeka S                  | Obligatorio |
| ---------------- | ------------------------ | ----------- |
| `id`             | `pnpu:uuid`              | Si          |
| `officialName`   | `schema:name`            | Si          |
| `acronym`        | `schema:alternateName`   | No          |
| `universityCode` | `pnpu:universityCode`    | No          |
| `province`       | `schema:addressLocality` | No          |
| `country`        | `schema:addressCountry`  | Si          |
| `website`        | `schema:url`             | No          |

## 8. Mapeo de Collection

Template: `PNPU Collection`  
Omeka: Item Set  
PNPU: `Collection`

| PNPU              | Omeka S                                | Obligatorio |
| ----------------- | -------------------------------------- | ----------- |
| `id`              | `pnpu:uuid`                            | Si          |
| `title`           | `dcterms:title`                        | Si          |
| `publisher`       | `dcterms:publisher`                    | Si          |
| `description`     | `dcterms:description`                  | No          |
| `collectionCode`  | `pnpu:collectionCode`                  | No          |
| `editorialSeries` | `bibo:Series` o `pnpu:editorialSeries` | No          |
| `subjects`        | `dcterms:subject`                      | No          |

La relacion publicacion -> coleccion se resuelve desde `dcterms:isPartOf` o por pertenencia del Item
a Item Set, segun se apruebe en la decision final.

## 9. Mapeo de Subject

Template: `PNPU Subject`  
Omeka: Item o valor controlado SKOS  
PNPU: `Subject`

| PNPU             | Omeka S                                | Obligatorio |
| ---------------- | -------------------------------------- | ----------- |
| `identifier`     | `skos:notation` / `dcterms:identifier` | Si          |
| `preferredLabel` | `skos:prefLabel`                       | Si          |
| `uri`            | `@id` / `schema:url`                   | No          |
| `broader`        | `skos:broader`                         | No          |
| `related`        | `skos:related`                         | No          |

Regla propuesta: si Omeka usa valores literales en `dcterms:subject`, el adaptador solo debe aceptar
materias que puedan normalizarse contra la taxonomia PNPU aprobada.

## 10. Mapeo de Resource

Omeka: Media asociado a Item `PNPU Publication`  
PNPU: `Resource`

| PNPU       | Omeka S Media                               | Obligatorio |
| ---------- | ------------------------------------------- | ----------- |
| `type`     | `o:media_type` o `pnpu:resourceType`        | Si          |
| `url`      | `o:original_url` / `o:source`               | Si          |
| `format`   | `dcterms:format` / MIME                     | Si          |
| `fileSize` | `pnpu:fileSize`                             | No          |
| `checksum` | `premis:hasMessageDigest` / `pnpu:checksum` | Recomendado |
| `language` | `dcterms:language`                          | No          |
| `license`  | `dcterms:license`                           | No          |

Si Omeka no expone `fileSize` o `checksum`, esos campos quedan ausentes. No deben inventarse.

## 11. Validacion y manejo de errores

| Situacion                             | Resultado propuesto                                             |
| ------------------------------------- | --------------------------------------------------------------- |
| registro sin template PNPU reconocido | ignorar y registrar advertencia                                 |
| publicacion sin UUID PNPU             | excluir de API publica                                          |
| publicacion sin titulo                | excluir de API publica                                          |
| publicacion sin contributor           | excluir de API publica                                          |
| publicacion sin publisher             | excluir de API publica                                          |
| publicacion sin subject               | excluir de API publica                                          |
| publicacion sin media/resource        | excluir de API publica                                          |
| identificador ISBN/DOI invalido       | rechazar identificador; si queda sin identificadores, excluir   |
| ORCID invalido                        | omitir ORCID y registrar advertencia                            |
| idioma invalido                       | excluir registro                                                |
| enlace a entidad no resuelta          | excluir registro dependiente o degradar si el campo es opcional |

Las exclusiones deben registrarse con codigo de calidad, id Omeka, template, campo afectado y causa.

## 12. Estrategia de adaptador

Implementacion propuesta:

1. `OmekaCatalogSnapshotLoader`: lee Items, Item Sets y Media paginados desde Omeka.
2. `OmekaResourceTemplateClassifier`: clasifica recursos por Resource Template.
3. `OmekaPnpuMapper`: convierte JSON Omeka a entidades PNPU.
4. Repositorios Omeka en memoria derivada:
   - `OmekaPublicationRepository`
   - `OmekaPublisherRepository`
   - `OmekaContributorRepository`
   - `OmekaCollectionRepository`
   - `OmekaSubjectRepository`
5. `OmekaCatalogQualityReport`: conserva rechazos y advertencias de mapeo.

Esta estrategia permite implementar los puertos actuales sin cambiar servicios ni paginas.

Estado de implementacion tecnica:

- `OmekaCatalogSnapshotLoader`: implementado con pruebas unitarias.
- `OmekaResourceTemplateClassifier`: implementado con pruebas unitarias.
- Perfil de instalacion Omeka PNPU: implementado y validado contra
  `schemas/omeka/pnpu-resource-templates.json`.
- Diagnostico `npm run omeka:check`: implementado contra API Omeka local.
- Instalador `npm run omeka:install-profile`: preparado para API autenticada de Omeka.
- Mappers Omeka -> PNPU para referencias, publicaciones y recursos digitales: implementados con
  fixtures de integracion.
- Repositorios Omeka como fuente activa: implementados mediante `createCatalogRepositoriesAsync`,
  protegidos por `PNPU_OMEKA_REQUIRE_APPROVED_MAPPING=true` y por rechazo automatico cuando el
  catalogo Omeka contiene errores de mapeo PNPU.

## 13. Variables de entorno

Ya existen:

- `PNPU_CATALOG_REPOSITORY`
- `PNPU_OMEKA_BASE_URL`
- `PNPU_OMEKA_TIMEOUT_MS`
- `PNPU_OMEKA_PAGE_SIZE`
- `PNPU_OMEKA_MAX_PAGES`
- `PNPU_OMEKA_REQUIRE_APPROVED_MAPPING`

Variables propuestas antes de activar produccion:

- `PNPU_OMEKA_CACHE_TTL_SECONDS`

No se deben almacenar API keys ni secretos en codigo.

## 14. Criterios de activacion

`PNPU_CATALOG_REPOSITORY=omeka` solo debe activarse cuando:

1. Esta propuesta sea aprobada o sustituida por ADR.
2. Omeka S tenga los Resource Templates configurados.
3. Existan datos de prueba con al menos una publicacion completa.
4. El adaptador tenga unit tests de mapeo por entidad.
5. El adaptador tenga integration tests contra fixtures Omeka JSON.
6. `npm run quality`, `npm run build`, `npm run smoke` pasen con modo Omeka en entorno controlado.
7. `/health/ready` reporte estado de Omeka y degradacion esperada.
8. Exista runbook de carga inicial y correccion de errores de calidad.

## 15. Preguntas abiertas

1. Confirmar si `PNPU Collection` sera Item Set exclusivamente o tambien Item.
2. Confirmar si editoriales/universidades viven en Omeka o en el sistema institucional de
   editoriales y se referencian desde Omeka.
3. Confirmar vocabulario final para `Publication.type`.
4. Confirmar politica de checksum: obligatorio en carga o calculado fuera de Omeka.
5. Confirmar como se representaran licencias: texto controlado, URI Creative Commons o ambos.
6. Confirmar si Omeka usara IIIF para recursos digitales.
7. Confirmar estrategia para registros con acceso restringido.

## 16. Resultado esperado tras aprobacion

La implementacion del adaptador Omeka debe poder reemplazar el catalogo `in-memory` sin cambios en:

- dominio;
- servicios de aplicacion;
- Route Handlers;
- paginas publicas;
- OpenAPI publico;
- sitemap;
- JSON-LD.

---
title: Metadata Model
version: 1.0
status: Draft
owner: Ministerio de Educación Superior
project: Plataforma Nacional de Publicaciones Universitarias de Cuba
---

# Metadata Model

## Objetivo

Definir el modelo de metadatos de la Plataforma Nacional de Publicaciones Universitarias de Cuba (PNPU).

Este documento establece:

- El perfil de metadatos oficial de la plataforma.
- Los campos obligatorios y opcionales.
- Las reglas de validación.
- Los vocabularios controlados.
- La correspondencia con estándares internacionales.
- La interoperabilidad con Omeka S y otros sistemas.

---

# Principios

El modelo de metadatos se fundamenta en:

- Dublin Core Terms
- BIBFRAME
- Schema.org
- ORCID
- ISBN
- DOI
- OAI-PMH
- OpenAIRE Guidelines

La PNPU no define un estándar propio.

Define un **Perfil de Aplicación (Application Profile)**.

---

# Arquitectura de Metadatos

```

PNPU Metadata Profile

├── Core Metadata

├── Bibliographic Metadata

├── Administrative Metadata

├── Preservation Metadata

├── Rights Metadata

└── Discovery Metadata

```

---

# 1. Core Metadata

Información mínima obligatoria.

| Campo | Obligatorio | Estándar |
|---------|-------------|-----------|
| Identifier | Sí | Dublin Core |
| Title | Sí | Dublin Core |
| Publisher | Sí | Dublin Core |
| Contributor | Sí | Dublin Core |
| Date | Sí | Dublin Core |
| Language | Sí | Dublin Core |
| Type | Sí | Dublin Core |
| Subject | Sí | Dublin Core |
| Description | Sí | Dublin Core |

---

# 2. Bibliographic Metadata

Información propia de publicaciones.

| Campo | Obligatorio |
|---------|-------------|
| ISBN | Sí |
| eISBN | No |
| DOI | No |
| Edition | No |
| Number of Pages | No |
| Collection | No |
| Series | No |
| Volume | No |
| Issue | No |
| Format | Sí |

---

# 3. Administrative Metadata

Información para administración.

| Campo |
|---------|
| Fecha creación |
| Fecha actualización |
| Responsable |
| Estado |
| Flujo editorial |
| Visibilidad |

---

# 4. Preservation Metadata

Garantiza preservación.

| Campo |
|---------|
| Checksum |
| MIME Type |
| File Size |
| Preservation URI |
| Version |
| Original Filename |

---

# 5. Rights Metadata

Información legal.

| Campo |
|---------|
| Copyright Holder |
| License |
| Access Rights |
| Embargo |
| Usage Rights |

---

# 6. Discovery Metadata

Optimización para buscadores.

| Campo |
|---------|
| Keywords |
| SEO Title |
| SEO Description |
| Canonical URL |
| OpenGraph Image |
| Structured Data |

---

# Perfil de Publicación

## Publication

### Obligatorio

- Identifier
- Title
- Publisher
- Contributors
- Language
- Publication Date
- Resource
- Subject
- Type

### Recomendado

- Abstract
- Keywords
- Cover
- License
- Collection

### Opcional

- DOI
- ORCID
- Funding
- Related Projects
- Citation

---

# Contributor

Campos

- Nombre
- Apellidos
- ORCID
- Afiliación
- Email institucional
- Biografía
- País

---

# Publisher

Campos

- Nombre
- Universidad
- Provincia
- País
- Sitio Web
- Logo
- Contacto

---

# Resource

Campos

- Tipo
- URL
- Formato
- Peso
- Checksum
- Idioma
- Licencia

---

# Identificadores

La plataforma soportará múltiples identificadores.

## Persistentes

- ISBN
- eISBN
- DOI
- URI
- Handle

## Internos

- UUID PNPU

Toda publicación tendrá un UUID interno.

---

# Idiomas

Norma

ISO 639-1

Ejemplos

es

en

fr

pt

---

# Países

ISO-3166

---

# Materias

La clasificación oficial utilizará:

Nivel 1

UNESCO Fields of Science

Nivel 2

Taxonomía RNEU

Nivel 3

Palabras clave libres

---

# Palabras clave

Máximo recomendado

10

Idioma independiente.

---

# Tipos documentales

Actualmente

- Libro
- eBook
- Manual
- Monografía
- Memorias

Futuro

- Dataset
- Video
- Podcast
- Tesis
- Recurso Educativo Abierto

---

# Licencias

Permitidas

- Copyright
- CC BY
- CC BY-SA
- CC BY-NC
- Dominio Público

---

# Validaciones

## Regla 001

Todo libro debe poseer ISBN.

---

## Regla 002

Todo Contributor debe poseer nombre.

---

## Regla 003

Toda publicación debe poseer idioma.

---

## Regla 004

Toda publicación debe pertenecer a un Publisher.

---

## Regla 005

Toda publicación debe poseer al menos un Resource.

---

# Crosswalk

## Dublin Core

| PNPU | Dublin Core |
|-------|-------------|
| title | dc:title |
| publisher | dc:publisher |
| contributor | dc:creator |
| subject | dc:subject |
| abstract | dc:description |
| language | dc:language |
| identifier | dc:identifier |
| date | dc:date |

---

## Schema.org

| PNPU | Schema.org |
|-------|------------|
| Publication | CreativeWork |
| Book | Book |
| Contributor | Person |
| Publisher | Organization |
| Collection | Collection |
| Subject | about |
| Resource | MediaObject |

---

## Omeka S

| PNPU | Omeka |
|-------|--------|
| Publication | Item |
| Resource | Media |
| Collection | Item Set |
| Vocabulary | Resource Template |

---

# SEO

Toda publicación deberá generar automáticamente:

- JSON-LD
- OpenGraph
- Dublin Core HTML Meta
- Canonical URL
- Sitemap XML

---

# OAI-PMH

Metadatos mínimos

- Dublin Core

Metadatos futuros

- MODS
- MARCXML
- DataCite

---

# Versionado

El modelo de metadatos utilizará versionado semántico.

Ejemplo

1.0

1.1

2.0

Las nuevas versiones nunca eliminarán campos obligatorios sin un proceso formal de migración.

---

# Sistemas Responsables

| Información | Sistema |
|-------------|----------|
| Editoriales | Sistema Gestión Editoriales |
| Publicaciones | Omeka S |
| Recursos | Omeka S |
| Descubrimiento | Portal PNPU |
| SEO | Portal PNPU |

---

# ADR Relacionadas

ADR-0004

La PNPU adopta un Perfil de Aplicación basado en Dublin Core Terms y Schema.org, evitando la creación de un esquema propietario.

ADR-0005

Toda publicación deberá ser interoperable mediante OAI-PMH y exponer metadatos estructurados para motores de búsqueda académicos.

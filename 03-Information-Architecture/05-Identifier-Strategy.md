---
title: Identifier Strategy
version: 1.0
status: Draft
owner: Ministerio de Educación Superior
project: Plataforma Nacional de Publicaciones Universitarias (PNPU)
authors:
  - Equipo de Arquitectura
last_update: 2026-07-14
related_documents:
  - 01-Domain-Model.md
  - 02-Metadata-Model.md
  - 03-Taxonomy.md
  - 04-Controlled-Vocabularies.md
---

# Identifier Strategy

## 1. Objetivo

Definir la estrategia oficial de identificadores persistentes de la Plataforma Nacional de Publicaciones Universitarias (PNPU).

Esta estrategia garantiza:

- unicidad;
- interoperabilidad;
- trazabilidad;
- estabilidad de URLs;
- integración con sistemas nacionales e internacionales;
- eliminación de duplicidades.

Los identificadores constituyen la base de toda la arquitectura de integración de la PNPU.

---

# 2. Principios

La estrategia de identificadores se basa en los siguientes principios:

- Todo recurso tendrá un identificador permanente.
- Un identificador nunca cambiará.
- Un identificador nunca será reutilizado.
- Todo identificador tendrá una autoridad emisora.
- Todo identificador podrá resolverse mediante API.
- Los identificadores externos tendrán prioridad sobre los internos cuando sean persistentes y reconocidos internacionalmente.

---

# 3. Clasificación

La PNPU reconoce cuatro categorías de identificadores.

```
Identificadores

│

├── Corporativos

├── Internacionales

├── Técnicos

└── Persistentes
```

---

# 4. Identificadores Corporativos

Asignados por la PNPU o por el MES.

Ejemplos

- publicationId
- publisherId
- universityId
- collectionId
- seriesId
- contributorId

Formato recomendado

UUID v7

Ejemplo

550e8400-e29b-41d4-a716-446655440000

Responsable

PNPU

---

# 5. Identificadores Internacionales

Gestionados por organismos internacionales.

## ISBN

Objeto

Libro.

Responsable

Editorial.

Obligatorio

Sí.

---

## eISBN

Objeto

Libro electrónico.

---

## DOI

Objeto

Publicaciones con DOI asignado.

Uso

Opcional.

Muy recomendado.

---

## ORCID

Objeto

Investigadores.

Uso

Recomendado.

---

## ISNI

Objeto

Autores.

Uso

Futuro.

---

## VIAF

Objeto

Autoridades bibliográficas.

Uso

Futuro.

---

# 6. Identificadores Técnicos

Utilizados internamente.

Ejemplos

- id Omeka
- id Sistema Editoriales
- id PostgreSQL
- id Redis

No se expondrán públicamente.

---

# 7. Identificadores Persistentes

Representan la identidad pública de un recurso.

Ejemplo

https://pnpu.mes.gob.cu/publicaciones/9789590000001

o

https://pnpu.mes.gob.cu/p/550e8400-e29b-41d4-a716-446655440000

Características

- Permanente.
- Nunca cambia.
- Independiente de la tecnología.

---

# 8. Identificadores por Entidad

| Entidad | Identificador principal | Alternativos |
|----------|------------------------|--------------|
| Publicación | UUID PNPU | ISBN, DOI, URI |
| Editorial | publisherId | Código institucional |
| Universidad | universityId | Código MES |
| Autor | contributorId | ORCID, ISNI |
| Colección | collectionId | Código editorial |
| Serie | seriesId | Código editorial |
| Recurso Digital | resourceId | URI |
| Materia | subjectId | Código UNESCO |

---

# 9. Estrategia de URLs

Toda entidad pública tendrá una URL permanente.

Ejemplos

/publicaciones/{slug}

/editoriales/{slug}

/universidades/{slug}

/autores/{slug}

/colecciones/{slug}

El slug es un identificador de presentación.

Nunca sustituye al identificador interno.

---

# 10. Resolución

Toda entidad deberá poder resolverse mediante API.

Ejemplos

GET /api/v1/publications/{uuid}

GET /api/v1/publications/isbn/{isbn}

GET /api/v1/contributors/orcid/{orcid}

GET /api/v1/publishers/{publisherId}

---

# 11. Reglas de Prioridad

## Publicaciones

1. ISBN
2. DOI
3. UUID PNPU

---

## Autores

1. ORCID
2. UUID PNPU

---

## Editoriales

1. publisherId
2. Código institucional

---

## Universidades

1. universityId

---

# 12. Normalización

Antes de registrar un identificador deberán eliminarse:

- espacios;
- caracteres de control;
- diferencias de mayúsculas;
- formatos alternativos.

Ejemplo

ISBN

978-959-00-0000-1

↓

9789590000001

---

# 13. Validaciones

## ID-001

Todo UUID deberá ser único.

---

## ID-002

Todo ISBN deberá validarse mediante su dígito de control.

---

## ID-003

Todo ORCID deberá validarse mediante su algoritmo oficial.

---

## ID-004

No podrán existir dos publicaciones con el mismo ISBN.

---

## ID-005

Un DOI no podrá asociarse a dos publicaciones distintas.

---

# 14. Detección de Duplicados

Durante la importación se utilizará el siguiente orden.

Publicaciones

1. ISBN
2. DOI
3. UUID origen
4. Título + Editorial + Año

Autores

1. ORCID
2. Nombre normalizado + Afiliación

Editoriales

1. publisherId
2. Código institucional

---

# 15. Mapeo con Sistemas

| Sistema | Identificador utilizado |
|----------|------------------------|
| Portal PNPU | UUID + Slug |
| Omeka S | UUID PNPU + id Omeka |
| Sistema Editoriales | publisherId |
| API Pública | UUID |
| Buscador | UUID |
| Observatorio | UUID |

---

# 16. Interoperabilidad

Los identificadores permitirán integraciones con:

- ORCID
- Crossref
- OpenAlex
- Google Scholar
- OAI-PMH
- Dublin Core
- DataCite
- BIBFRAME

---

# 17. Gobierno

Cada identificador tendrá:

- autoridad emisora;
- política de asignación;
- política de validación;
- política de persistencia.

La reutilización de identificadores está prohibida.

---

# 18. Seguridad

Los identificadores internos de bases de datos nunca serán expuestos al público.

Las APIs únicamente utilizarán identificadores públicos.

---

# 19. Migración

Cuando un sistema legado utilice identificadores propios:

- se conservarán como identificadores secundarios;
- se asignará un UUID PNPU;
- se mantendrá una tabla de equivalencias.

---

# 20. ADR Relacionadas

ADR-0004 – Perfil de Metadatos.

ADR-0006 – Arquitectura Federada.

ADR-0010 – UUID como identificador corporativo.

ADR-0016 – Separación entre identificadores internos y públicos.

---

# 21. Criterios de aceptación

La estrategia de identificadores se considerará aprobada cuando:

- todas las entidades tengan un identificador principal;
- existan reglas claras para identificadores alternativos;
- la interoperabilidad esté garantizada;
- las APIs utilicen únicamente identificadores públicos;
- los identificadores sean permanentes y no reutilizables;
- los procesos de importación puedan detectar duplicados utilizando esta estrategia.
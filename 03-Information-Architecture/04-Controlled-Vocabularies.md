---
title: Controlled Vocabularies
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
---

# Controlled Vocabularies

## 1. Objetivo

Este documento define la estrategia de vocabularios controlados utilizada por la Plataforma Nacional de Publicaciones Universitarias (PNPU).

Los vocabularios controlados garantizan que toda la información registrada en la plataforma utilice un lenguaje consistente, evitando duplicidades, ambigüedades y errores de clasificación.

Su utilización permitirá:

- mejorar la calidad del dato;
- facilitar las búsquedas;
- mejorar el SEO;
- facilitar la interoperabilidad;
- soportar análisis estadísticos;
- preparar la plataforma para búsqueda semántica e Inteligencia Artificial.

---

# 2. Principios

Los vocabularios controlados deberán cumplir los siguientes principios:

- Existirá una única fuente oficial para cada vocabulario.
- Ningún sistema podrá mantener copias independientes.
- Los vocabularios serán reutilizables por toda la plataforma.
- Los vocabularios deberán poder versionarse.
- Todo cambio requerirá un proceso formal de gobierno del dato.
- Siempre que exista un estándar internacional se utilizará dicho estándar.

---

# 3. Clasificación de Vocabularios

La PNPU utilizará cuatro tipos de vocabularios.

```
Vocabularios

│

├── Catálogos

├── Listas Controladas

├── Tesauros

└── Autoridades
```

---

# 4. Catálogos

Representan listas relativamente estables administradas oficialmente.

Ejemplos:

- Editoriales
- Universidades
- Colecciones
- Series editoriales

Características

- Identificador único.
- Nombre oficial.
- Estado.
- Fecha de creación.
- Fecha de modificación.

---

# 5. Listas Controladas

Representan listas cerradas.

Ejemplos

Idiomas

Licencias

Tipos documentales

Formatos

Estados

Acceso

No admiten escritura libre.

---

# 6. Tesauros

Representan conceptos relacionados.

Ejemplos

Arquitectura de Software

↓

Microservicios

↓

DDD

↓

Arquitectura Hexagonal

Cada término podrá tener:

- término preferido;
- términos alternativos;
- términos relacionados;
- término padre;
- término hijo;
- definición.

Se recomienda utilizar SKOS.

---

# 7. Autoridades

Representan entidades únicas.

Ejemplos

Autores

Editoriales

Universidades

Investigadores

Organizaciones

Cada autoridad posee un identificador permanente.

---

# 8. Inventario Oficial

## Editoriales

Fuente oficial

Sistema de Gestión de Editoriales.

Clave

publisherId

---

## Universidades

Fuente oficial

Sistema de Gestión de Editoriales.

Clave

universityId

---

## Países

Norma

ISO 3166-1

---

## Idiomas

Norma

ISO 639-1

---

## Licencias

Fuente

Creative Commons

Más Copyright.

---

## Formatos

Norma

IANA MIME Types.

---

## Tipos Documentales

Administrado por

PNPU.

Valores iniciales

- Libro
- eBook
- Manual
- Monografía
- Memorias
- Informe Técnico

---

## Materias

Fuente

UNESCO Fields of Science.

Complemento

Taxonomía PNPU.

---

## Colecciones

Fuente

Omeka S.

---

## Series

Fuente

Omeka S.

---

## Identificadores

Valores

ISBN

eISBN

DOI

URI

Handle

UUID PNPU

---

# 9. Reglas de Gobierno

## CV-001

Todo vocabulario tendrá un propietario.

---

## CV-002

Todo vocabulario tendrá un responsable funcional.

---

## CV-003

Todo cambio deberá registrarse.

---

## CV-004

Todo vocabulario deberá poseer versión.

---

## CV-005

No podrán existir elementos duplicados.

---

## CV-006

Todo elemento tendrá un identificador estable.

---

## CV-007

No se eliminarán registros.

Se marcarán como inactivos.

---

# 10. Modelo de un Vocabulario

```
Vocabulary

id

name

description

version

owner

status

createdAt

updatedAt

terms[]
```

---

# 11. Modelo de un Término

```
Term

id

code

preferredLabel

alternativeLabels

description

status

parent

children

relatedTerms

externalReference
```

---

# 12. Versionado

Formato

Mayor.Menor

Ejemplos

1.0

1.1

2.0

Cambios mayores

- eliminación de términos;
- reorganización jerárquica.

Cambios menores

- nuevos términos;
- correcciones;
- traducciones.

---

# 13. Estados

Todo término podrá encontrarse en uno de los siguientes estados.

- Activo
- Obsoleto
- En revisión
- Propuesto
- Eliminado (lógico)

---

# 14. Sinónimos

Cada término podrá tener múltiples sinónimos.

Ejemplo

IA

↓

Inteligencia Artificial

↓

Artificial Intelligence

↓

AI

El buscador utilizará todos los sinónimos.

---

# 15. Multilingüismo

Los vocabularios deberán permitir múltiples idiomas.

Ejemplo

```
preferredLabel

es

Ingeniería Informática

en

Computer Engineering

fr

Génie Informatique
```

---

# 16. Relación con el Buscador

Los vocabularios controlados serán utilizados para:

- autocompletado;
- expansión de consultas;
- sinónimos;
- navegación;
- facetas;
- recomendaciones.

---

# 17. Relación con Omeka S

Omeka utilizará los vocabularios mediante:

- Resource Templates.
- Value Constraints.
- Controlled Properties.
- SKOS Concept Scheme.
- Item Sets cuando corresponda.

La administración principal permanecerá fuera de Omeka cuando el vocabulario sea corporativo.

---

# 18. APIs

Los vocabularios deberán estar disponibles mediante APIs.

Ejemplos

GET /api/v1/vocabularies

GET /api/v1/vocabularies/languages

GET /api/v1/vocabularies/licenses

GET /api/v1/vocabularies/document-types

GET /api/v1/vocabularies/subjects

GET /api/v1/vocabularies/publishers

GET /api/v1/vocabularies/universities

---

# 19. Calidad

Cada vocabulario deberá cumplir:

- Sin duplicados.
- Sin términos huérfanos.
- Sin referencias rotas.
- Identificadores únicos.
- Definiciones completas.
- Relaciones válidas.

---

# 20. Comité de Gobierno del Dato

Se recomienda crear un comité responsable de:

- aprobar nuevos vocabularios;
- aprobar cambios mayores;
- validar taxonomías;
- revisar calidad;
- resolver conflictos.

Integrantes sugeridos

- MES
- RNEU
- Bibliotecólogos
- Especialistas en Metadatos
- Arquitecto de Información
- Administrador Omeka

---

# 21. Integraciones

Los vocabularios serán utilizados por:

| Sistema | Uso |
|----------|-----|
| Portal PNPU | Navegación |
| Omeka S | Catalogación |
| API Pública | Validación |
| Buscador | Facetas y sinónimos |
| Observatorio | Indicadores |
| Dashboard | Agregaciones |

---

# 22. Evolución

La estrategia de vocabularios permitirá incorporar posteriormente:

- Wikidata
- VIAF
- ORCID
- ISNI
- GeoNames
- Library of Congress Subject Headings (LCSH)
- UNESCO Thesaurus
- OpenAlex Concepts

sin modificar el modelo de dominio.

---

# 23. ADR Relacionadas

ADR-0004 – Perfil de Metadatos

ADR-0008 – Índices de Búsqueda

ADR-0012 – Omeka S como implementación del dominio Catalog

ADR-0015 – Gobierno de Vocabularios

---

# 24. Criterios de aceptación

El modelo de vocabularios controlados será considerado aprobado cuando:

- Todos los conceptos reutilizables pertenezcan a un vocabulario identificado.
- Exista un propietario para cada vocabulario.
- Todos los términos tengan identificador permanente.
- El Buscador pueda consumir sinónimos y relaciones.
- Omeka pueda utilizar los vocabularios mediante Resource Templates y SKOS.
- Las APIs puedan exponer cualquier vocabulario de forma consistente.
- Los procesos de catalogación impidan la creación de términos libres donde exista un vocabulario controlado.
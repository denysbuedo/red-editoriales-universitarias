---
title: Domain Model
version: 1.0
status: Draft
owner: Ministerio de Educación Superior
project: Plataforma Nacional de Publicaciones Universitarias de Cuba
authors:
  - Equipo de Arquitectura
last_update: 2026-07-14
---

# Domain Model

## Objetivo

Definir el modelo conceptual del dominio de la Plataforma Nacional de Publicaciones Universitarias (PNPU).

Este documento representa el lenguaje común entre:

- Negocio
- Arquitectura
- Desarrollo
- APIs
- Omeka S
- Integraciones

No describe tablas de base de datos.

No describe clases de programación.

Describe los conceptos del negocio.

---

# Principios

El modelo de dominio se basa en los siguientes principios:

- Arquitectura centrada en el conocimiento.
- Modelo federado.
- Independencia tecnológica.
- Compatibilidad con estándares bibliográficos.
- Separación entre dominio e implementación.

---

# Vista General del Dominio

```
                        Conocimiento Publicado
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
   Publicaciones            Agentes                Organizaciones
        │                        │                        │
        ├───────────────┐        │        ┌───────────────┤
        │               │        │        │               │
  Colecciones      Recursos   Identificadores      Universidades
        │               │        │        │               │
        └───────────────┴────────┴────────┴───────────────┘
                                 │
                           Descubrimiento
                                 │
                              Usuarios
```

---

# Aggregate Root

## Publication

La entidad principal del dominio.

Representa cualquier recurso intelectual publicado por una editorial universitaria.

Actualmente puede materializarse como:

- Libro
- Libro electrónico
- Manual
- Monografía
- Memorias de evento
- Informe técnico

En el futuro podrá extenderse a:

- Dataset
- Recurso Educativo Abierto
- Material multimedia
- Podcast
- Video
- Colección patrimonial

---

## Atributos

| Campo | Obligatorio |
|---------|-------------|
| id | Sí |
| title | Sí |
| subtitle | No |
| abstract | No |
| publicationDate | Sí |
| language | Sí |
| publisher | Sí |
| contributors | Sí |
| identifiers | Sí |
| subjects | Sí |
| keywords | No |
| license | No |
| resources | Sí |

---

# Entity

## Publisher

Representa la entidad responsable de publicar una obra.

Normalmente será una Editorial Universitaria.

### Relaciones

Publisher

↓

pertenece a

↓

University

---

Campos

- id
- nombre
- sigla
- descripción
- logo
- contacto
- sitioWeb

---

# Entity

## University

Representa una Institución de Educación Superior.

Campos

- id
- nombre
- sigla
- provincia
- país

---

# Entity

## Contributor

Representa cualquier persona u organización que participa en la creación intelectual.

Tipos

- Autor
- Editor científico
- Compilador
- Traductor
- Ilustrador
- Revisor

Campos

- id
- nombre
- ORCID
- afiliación
- biografía

---

# Entity

## Collection

Agrupa publicaciones relacionadas.

Ejemplos

- Ciencias Sociales

- Ingeniería

- Ciencias Médicas

- Historia

Una publicación puede pertenecer a múltiples colecciones.

---

# Entity

## Subject

Área temática.

Se recomienda utilizar vocabularios controlados.

Ejemplos

- UNESCO

- OECD Fields of Science

- Tesauros nacionales

---

# Entity

## Identifier

Representa identificadores persistentes.

Tipos

- ISBN

- eISBN

- DOI

- URI

- Handle

Una publicación puede tener múltiples identificadores.

---

# Entity

## Resource

Representa una manifestación digital.

Tipos

- PDF

- EPUB

- HTML

- MOBI

- Audio

- Video

- Enlace externo

Cada recurso posee:

- formato
- tamaño
- checksum
- URL
- licencia

---

# Entity

## Language

Idioma de publicación.

Norma

ISO-639

---

# Entity

## License

Licencia de distribución.

Ejemplos

- Copyright

- CC BY

- CC BY-SA

- CC BY-NC

---

# Relaciones principales

```
University
      │
      │ 1..N
      ▼
Publisher
      │
      │ 1..N
      ▼
Publication
      │
 ┌────┼───────────────┐
 │    │               │
 ▼    ▼               ▼
Contributor      Collection     Resource
 │                │             │
 ▼                ▼             ▼
Person         Subject      Identifier
```

---

# Bounded Contexts

## Catalog

Responsable de:

- Publicaciones
- Autores
- Editoriales
- Colecciones

Implementación actual:

Omeka S

---

## Institutional Registry

Responsable de:

- Editoriales
- Universidades
- Responsables
- Contactos

Implementación:

Sistema de Gestión de Editoriales

---

## Discovery

Responsable de:

- Buscador
- SEO
- Navegación
- Recomendaciones

Implementación:

Portal PNPU

---

## Analytics

Responsable de:

- Indicadores
- Estadísticas
- Dashboard

---

## Integration

Responsable de:

- APIs
- OAI-PMH
- IIIF
- ORCID
- Google Scholar
- Crossref

---

# Reglas del Dominio

## DR-001

Toda publicación deberá pertenecer a un Publisher.

---

## DR-002

Todo Publisher deberá pertenecer a una University.

---

## DR-003

Toda publicación deberá poseer al menos un Contributor.

---

## DR-004

Toda publicación deberá poseer al menos un Identifier.

---

## DR-005

Toda publicación deberá poseer al menos un Resource.

---

## DR-006

Los datos institucionales de Publisher no podrán modificarse desde la PNPU.

Fuente oficial:

Sistema de Gestión de Editoriales.

---

## DR-007

Los metadatos bibliográficos serán gestionados desde el dominio Catalog.

---

# Sistemas Responsables

| Dominio | Sistema Responsable |
|----------|---------------------|
| Editoriales | Sistema de Gestión de Editoriales |
| Universidades | Sistema de Gestión de Editoriales |
| Publicaciones | Omeka S |
| Contribuyentes | Omeka S |
| Colecciones | Omeka S |
| Recursos Digitales | Omeka S |
| Descubrimiento | Portal PNPU |
| Analítica | Dashboard PNPU |

---

# ADR Relacionadas

ADR-0001 Arquitectura Federada

ADR-0002 Dominio independiente de la implementación

ADR-0003 Omeka S es una implementación del dominio Catalog y no el dominio en sí

---

# Evolución prevista

El modelo permitirá incorporar sin modificaciones estructurales:

- Revistas científicas
- Recursos Educativos Abiertos
- Tesis
- Objetos multimedia
- Datasets
- Colecciones patrimoniales
- Publicaciones seriadas

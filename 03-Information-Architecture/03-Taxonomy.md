---
title: Taxonomy
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
---

# Taxonomy

## 1. Objetivo

Definir la taxonomía oficial de la Plataforma Nacional de Publicaciones Universitarias (PNPU).

La taxonomía establece la forma en que los recursos son clasificados, organizados y descubiertos por los usuarios y por los sistemas informáticos.

No define metadatos.

Define categorías y relaciones semánticas.

---

# 2. Principios

La taxonomía deberá cumplir los siguientes principios:

- Simplicidad.
- Escalabilidad.
- Internacionalización.
- Compatibilidad con estándares internacionales.
- Bajo mantenimiento.
- Reutilización.
- Independencia tecnológica.

---

# 3. Arquitectura Taxonómica

La clasificación de la PNPU se organiza en tres niveles.

```
Área del Conocimiento
        │
        ├── Disciplina
        │       │
        │       ├── Especialidad
        │       │       │
        │       │       └── Palabras clave
```

---

# 4. Dimensiones Taxonómicas

La plataforma utilizará múltiples dimensiones de clasificación.

## 4.1 Área del conocimiento

Representa la clasificación científica principal.

Norma recomendada:

UNESCO Fields of Science.

Ejemplo

- Ciencias Naturales
- Ingeniería y Tecnología
- Ciencias Médicas
- Ciencias Agrícolas
- Ciencias Sociales
- Humanidades

---

## 4.2 Disciplina

Subdivisión del área.

Ejemplo

Ingeniería

↓

Ingeniería Informática

↓

Arquitectura de Software

---

## 4.3 Especialidad

Nivel específico utilizado por las editoriales.

Ejemplo

Arquitectura de Software

↓

Microservicios

---

## 4.4 Editorial

Clasificación institucional.

Ejemplos

- Editorial UH
- Editorial CUJAE
- Editorial UCLV

---

## 4.5 Universidad

Permite navegar por institución.

Ejemplos

- Universidad de La Habana
- CUJAE
- Universidad Central "Marta Abreu" de Las Villas
- Universidad de Oriente

---

## 4.6 Colección

Agrupa publicaciones relacionadas.

Ejemplos

- Biblioteca Universitaria
- Ciencias Sociales
- Monografías
- Clásicos Universitarios

---

## 4.7 Serie Editorial

Representa una subdivisión dentro de una colección.

Ejemplo

Colección

↓

Historia

↓

Serie

↓

Historia Colonial

---

## 4.8 Tipo documental

Valores iniciales

- Libro
- Libro electrónico
- Manual
- Monografía
- Memorias de Evento
- Informe Técnico

Valores futuros

- Dataset
- Recurso Educativo Abierto
- Podcast
- Video
- Tesis
- Revista
- Capítulo de libro

---

## 4.9 Idioma

Norma

ISO 639-1

Ejemplos

- Español
- Inglés
- Francés
- Portugués

---

## 4.10 Licencia

Ejemplos

- Copyright
- CC BY
- CC BY-SA
- CC BY-NC
- Dominio Público

---

## 4.11 Formato

Ejemplos

- PDF
- EPUB
- HTML
- MOBI
- Audio
- Video

---

## 4.12 Acceso

Valores

- Acceso Abierto
- Acceso Restringido
- Solo Metadatos
- Enlace Externo

---

# 5. Navegación Principal

La navegación del Portal utilizará las siguientes taxonomías.

```
Inicio

↓

Áreas del conocimiento

↓

Editoriales

↓

Universidades

↓

Colecciones

↓

Autores

↓

Novedades

↓

Recursos

↓

Noticias
```

---

# 6. Facetas de Búsqueda

El buscador deberá permitir filtrar por:

- Área del conocimiento.
- Disciplina.
- Editorial.
- Universidad.
- Colección.
- Serie.
- Autor.
- Año.
- Idioma.
- Tipo documental.
- Licencia.
- Acceso.
- Formato.

---

# 7. Vocabularios Controlados

Las siguientes entidades utilizarán vocabularios controlados.

| Entidad | Vocabulario |
|----------|-------------|
| Área del conocimiento | UNESCO Fields of Science |
| Idioma | ISO 639-1 |
| País | ISO 3166 |
| Licencia | Creative Commons |
| Formato | IANA MIME Types |
| Tipo documental | Catálogo PNPU |
| Universidad | Registro Oficial MES |
| Editorial | Registro Oficial RNEU |

---

# 8. Palabras Clave

Las palabras clave complementan la clasificación taxonómica.

Reglas:

- Máximo 10.
- Mínimo 3 recomendadas.
- Sin duplicados.
- Preferentemente tomadas de un tesauro institucional.
- Se podrán registrar en varios idiomas.

Ejemplo

Arquitectura de Software

↓

Microservicios

↓

DDD

↓

Clean Architecture

---

# 9. Relaciones

Una publicación puede pertenecer a:

- Una editorial.
- Una universidad.
- Una colección.
- Varias áreas temáticas.
- Varias palabras clave.

Un autor puede pertenecer a:

- Varias universidades.
- Varias áreas del conocimiento.

Una colección pertenece a una editorial.

Una editorial pertenece a una universidad.

---

# 10. Reglas

## TX-001

Toda publicación debe pertenecer al menos a un área del conocimiento.

---

## TX-002

Toda publicación debe tener un tipo documental.

---

## TX-003

Toda publicación debe tener un idioma principal.

---

## TX-004

Las editoriales solo podrán seleccionarse desde el Registro Oficial de Editoriales.

---

## TX-005

Las universidades solo podrán seleccionarse desde el Registro Oficial del MES.

---

## TX-006

No podrán existir categorías duplicadas.

---

## TX-007

Los cambios en vocabularios controlados deberán ser aprobados por el Comité de Gobierno del Dato.

---

# 11. Estrategia de Evolución

La taxonomía se mantendrá estable.

Las ampliaciones se realizarán mediante:

- Nuevas especialidades.
- Nuevos tipos documentales.
- Nuevos formatos.
- Nuevas licencias.

La estructura principal no deberá modificarse salvo decisión arquitectónica formal (ADR).

---

# 12. Uso por los Sistemas

| Sistema | Uso |
|----------|-----|
| Portal PNPU | Navegación y filtros |
| Omeka S | Catalogación |
| API Pública | Filtros y consultas |
| Motor de Búsqueda | Facetas |
| Observatorio Editorial | Indicadores y agregaciones |

---

# 13. Relación con SEO

La taxonomía se utilizará para:

- Construcción de URLs.
- Breadcrumbs.
- Sitemap.
- Enlaces internos.
- Páginas temáticas.
- Datos estructurados Schema.org.

Ejemplo

/publicaciones/ingenieria/software

/editoriales/editorial-uh

/colecciones/ciencias-sociales

---

# 14. ADR Relacionadas

- ADR-0004 – Perfil de Metadatos.
- ADR-0008 – Índices de búsqueda derivados.
- ADR-0012 – Omeka S como implementación del dominio Catalog.

---

# 15. Criterios de aceptación

La taxonomía será considerada aprobada cuando:

- Todas las publicaciones puedan clasificarse sin ambigüedad.
- Las categorías sean reutilizables por todos los sistemas.
- Los vocabularios controlados estén identificados.
- La navegación del Portal pueda construirse únicamente con esta estructura.
- El Motor de Búsqueda pueda generar facetas utilizando estas dimensiones.
- Las futuras integraciones mantengan compatibilidad con este modelo.
---
title: Business Capability Model
version: 1.0
status: Draft
owner: Ministerio de Educación Superior
project: Plataforma Nacional de Publicaciones Universitarias de Cuba
---

# Business Capability Model

## Objetivo

Definir las capacidades que debe poseer la Plataforma Nacional de Publicaciones Universitarias (PNPU) para cumplir su misión.

Una capacidad representa una habilidad permanente del negocio.

No depende de una tecnología específica.

No depende de una aplicación.

No depende de una implementación.

---

# Mapa General

```
                           PNPU

          Plataforma Nacional de Publicaciones

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│           DESCUBRIMIENTO DEL CONOCIMIENTO                    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│             GESTIÓN DEL CONOCIMIENTO                         │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│             PUBLICACIÓN Y DIFUSIÓN                           │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│               INTEROPERABILIDAD                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                  ANALÍTICA                                   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                  GOBERNANZA                                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

# Capability 1

# Descubrimiento del Conocimiento

## Objetivo

Permitir localizar cualquier publicación universitaria desde un único punto de acceso.

## Capacidades

- Buscar publicaciones
- Buscar autores
- Buscar editoriales
- Buscar universidades
- Buscar colecciones
- Buscar materias
- Buscar ISBN
- Buscar DOI
- Búsqueda por texto completo
- Navegación por categorías
- Recomendaciones

## Usuarios

- Investigadores
- Profesores
- Estudiantes
- Bibliotecarios
- Ciudadanos

## Prioridad

★★★★★

---

# Capability 2

# Gestión del Conocimiento

## Objetivo

Administrar la información bibliográfica publicada por las editoriales.

## Capacidades

- Gestionar publicaciones
- Gestionar autores
- Gestionar organizaciones
- Gestionar editoriales
- Gestionar universidades
- Gestionar colecciones
- Gestionar series
- Gestionar identificadores
- Gestionar metadatos
- Gestionar palabras clave
- Gestionar materias
- Gestionar idiomas
- Gestionar licencias

## Sistema Responsable

Omeka S

---

# Capability 3

# Gestión Institucional

## Objetivo

Administrar la información oficial de la Red Nacional de Editoriales Universitarias.

## Capacidades

- Gestionar editoriales
- Gestionar universidades
- Gestionar responsables
- Gestionar contactos
- Gestionar logos
- Gestionar ubicación
- Gestionar miembros de la Red

## Sistema Responsable

Sistema de Gestión de Editoriales

---

# Capability 4

# Publicación y Difusión

## Objetivo

Difundir el conocimiento generado por las editoriales universitarias.

## Capacidades

- Publicar novedades
- Publicar noticias
- Publicar eventos
- Publicar convocatorias
- Publicar recursos
- Publicar colecciones destacadas
- Publicar recomendaciones

---

# Capability 5

# Interoperabilidad

## Objetivo

Integrar la plataforma con servicios nacionales e internacionales.

## Capacidades

- API REST
- API GraphQL (futuro)
- OAI-PMH
- IIIF
- ORCID
- Crossref
- Google Scholar
- OpenAlex
- Repositorios institucionales
- Bibliotecas

---

# Capability 6

# Analítica

## Objetivo

Proporcionar indicadores para la toma de decisiones.

## Capacidades

- Dashboard Ejecutivo
- Estadísticas
- Ranking Editorial
- Indicadores por Universidad
- Indicadores por Editorial
- Indicadores por Autor
- Indicadores por Materia
- Indicadores SEO
- Descargas
- Consultas

---

# Capability 7

# Gobierno del Dato

## Objetivo

Garantizar la calidad y consistencia de la información.

## Capacidades

- Catálogo de datos
- Diccionario de datos
- Taxonomías
- Vocabularios controlados
- Gestión de duplicados
- Validación
- Auditoría
- Versionado

---

# Capability 8

# Administración

## Objetivo

Administrar la plataforma.

## Capacidades

- Usuarios
- Roles
- Permisos
- Configuración
- Seguridad
- Auditoría
- Monitorización
- Logs

---

# Priorización

| Capacidad | Release |
|------------|---------|
| Descubrimiento | R1 |
| Gestión Institucional | R1 |
| Gestión del Conocimiento | R2 |
| Publicación | R2 |
| Analítica | R3 |
| Interoperabilidad Avanzada | R4 |
| Gobierno del Dato | R4 |

---

# Indicadores

- Tiempo medio de búsqueda
- Publicaciones indexadas
- Editoriales integradas
- Autores registrados
- Colecciones publicadas
- APIs disponibles
- Disponibilidad de la plataforma
- Calidad de metadatos
- Recursos interoperables

---

# Observaciones

Las capacidades definidas en este documento constituyen el modelo de referencia del negocio.

Las aplicaciones, APIs y componentes tecnológicos deberán implementarse para soportar estas capacidades, pero nunca condicionarlas.
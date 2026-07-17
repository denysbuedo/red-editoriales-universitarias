# Especificación Funcional y Técnica

# Portal de la Red Nacional de Editoriales Universitarias de Cuba (RNEU)

**Versión:** 1.0 (Documento inicial para el equipo de desarrollo)

------------------------------------------------------------------------

# 1. Visión

El Portal RNEU será el punto nacional de descubrimiento de la producción
editorial universitaria cubana.

No será solamente un sitio institucional, sino una plataforma que
integre:

-   Catálogo nacional de libros.
-   Directorio de editoriales.
-   Autores.
-   Colecciones.
-   Noticias.
-   Recursos para la comunidad editorial.

La Red continúa siendo el eje institucional que aporta identidad,
gobernanza y colaboración entre las editoriales.

------------------------------------------------------------------------

# 2. Principios

## Fuente única de datos

No duplicar información.

Cada dato tendrá un sistema maestro.

  Información   Sistema maestro
  ------------- ---------------------------
  Editoriales   Sistema actual de gestión
  Libros        Omeka S
  Autores       Omeka S
  Colecciones   Omeka S
  Noticias      Portal RNEU

------------------------------------------------------------------------

# 3. Arquitectura

``` text
               Sistema Gestión Editoriales
                        REST API
                           │
                           ▼
                  Portal RNEU (Frontend+BFF)
                   ▲                    ▲
                   │                    │
             API Editoriales      API Omeka S
                   │                    │
                   ▼                    ▼
        Sistema Gestión         Omeka S
                                Libros
                                Autores
                                Colecciones
```

------------------------------------------------------------------------

# 4. Stack tecnológico propuesto

## Frontend

-   Next.js 15
-   React 19
-   TypeScript
-   TailwindCSS
-   shadcn/ui
-   TanStack Query
-   Fuse.js (búsquedas locales)
-   OpenLayers o Leaflet (mapa)

## Backend

No desarrollar un backend monolítico.

Implementar un **Backend For Frontend (BFF)** en Next.js.

Responsabilidades:

-   Consumir API de Editoriales
-   Consumir API Omeka
-   Cache
-   Transformación de datos
-   SEO
-   Sitemap
-   RSS

------------------------------------------------------------------------

## CMS

Noticias:

-   Strapi o

-   Directamente desde Next + Markdown + Git

------------------------------------------------------------------------

## Gestión bibliográfica

Omeka S

Razones:

-   API REST
-   Dublin Core
-   Bibliographic Ontology
-   Multi-site
-   Relaciones
-   Metadatos

------------------------------------------------------------------------

## Base de datos

El portal prácticamente no necesita una BD propia.

Solo:

-   cache
-   configuración
-   métricas
-   índices

PostgreSQL.

------------------------------------------------------------------------

## Cache

Redis

------------------------------------------------------------------------

## Búsqueda

Fase 1

PostgreSQL Full Text Search

Fase 2

OpenSearch

------------------------------------------------------------------------

## Infraestructura

Docker

Docker Compose

Posteriormente Kubernetes si fuese necesario.

Nginx

Cloudflare (si existiera salida internacional)

------------------------------------------------------------------------

# 5. Arquitectura de módulos

-   Inicio
-   Buscador
-   Libros
-   Editoriales
-   Autores
-   Colecciones
-   Noticias
-   Recursos
-   La Red
-   Contacto

------------------------------------------------------------------------

# 6. Integraciones

## Sistema Editoriales

REST

Endpoints mínimos

GET /editoriales

GET /editoriales/{id}

GET /editoriales?provincia=

GET /editoriales?updated_after=

------------------------------------------------------------------------

## Omeka

Consumir

Items

Media

Item Sets

Resources

Search

------------------------------------------------------------------------

# 7. SEO

Obligatorio

-   SSR
-   SSG donde sea posible
-   sitemap.xml
-   robots.txt
-   JSON-LD
-   canonical
-   OpenGraph
-   Breadcrumb
-   URLs amigables

------------------------------------------------------------------------

# 8. Modelo conceptual

Libro

-   Editorial
-   Autores
-   Colección
-   Área

Editorial

-   Universidad
-   Provincia
-   Contactos
-   Catálogo

Autor

-   ORCID
-   Afiliación
-   Publicaciones

Colección

-   Editorial
-   Libros

------------------------------------------------------------------------

# 9. Roadmap

## Release 1

Portal institucional

Directorio

Editoriales desde API

Noticias

SEO

------------------------------------------------------------------------

## Release 2

Omeka

Libros

Autores

Colecciones

Buscador

------------------------------------------------------------------------

## Release 3

Integración completa

Indicadores

Estadísticas

Dashboard

OpenSearch

------------------------------------------------------------------------

## Release 4

Internacionalización

OAI-PMH

IIIF

Analytics

API pública

------------------------------------------------------------------------

# 10. Requisitos no funcionales

-   WCAG 2.2 AA
-   Responsive
-   Lighthouse \>90
-   Core Web Vitals
-   Tiempo inicial \<2 s
-   API documentadas OpenAPI
-   Docker
-   CI/CD GitHub Actions
-   Cobertura mínima pruebas 80%

------------------------------------------------------------------------

# 11. Recomendaciones

1.  Mantener el sistema actual como fuente maestra de editoriales.
2.  Utilizar Omeka S exclusivamente para el catálogo bibliográfico.
3.  Evitar duplicar datos.
4.  Diseñar el portal como experiencia pública.
5.  Pensar el proyecto como un ecosistema editorial nacional y no como
    un simple sitio web.

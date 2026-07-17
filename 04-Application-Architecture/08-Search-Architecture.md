
# Search Architecture

## Objetivo
Diseñar el buscador nacional de publicaciones.

## Evolución

R1:
- PostgreSQL Full Text Search

R3:
- OpenSearch

## Índices

- Publications
- Contributors
- Publishers
- Collections
- Subjects

## Documento indexado

- id
- title
- subtitle
- abstract
- authors
- publisher
- university
- collection
- subjects
- keywords
- isbn
- year
- language
- license
- url

## Facetas

- Editorial
- Universidad
- Año
- Materia
- Idioma
- Colección
- Tipo documental
- Acceso abierto

## Ranking

1. ISBN exacto
2. Título exacto
3. Autor
4. Palabras clave
5. Resumen
6. Popularidad
7. Actualización

## Autocompletado

- Libros
- Autores
- Editoriales
- Colecciones
- Materias

## Sincronización

Omeka/API
→ Normalizador
→ Deduplicación
→ Indexador
→ Motor de búsqueda

## SEO

- URLs canónicas
- JSON-LD
- Sitemap
- OpenGraph
- Breadcrumbs

## KPIs

- Tiempo medio de respuesta
- CTR
- Consultas sin resultados
- Búsquedas más frecuentes
- Relevancia

## Futuro

- Recomendaciones
- Búsqueda semántica
- IA generativa
- Sinónimos inteligentes

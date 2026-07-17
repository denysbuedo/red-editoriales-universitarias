---
title: PNPU Metadata Application Profile
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
  - 05-Identifier-Strategy.md
---

# PNPU Metadata Application Profile

## 1. Objetivo

Este documento define el **Perfil de Aplicación de Metadatos (Application Profile)** de la Plataforma Nacional de Publicaciones Universitarias (PNPU).

El perfil establece:

- qué estándares internacionales utiliza la plataforma;
- qué elementos son obligatorios;
- qué elementos son opcionales;
- cómo se representan los recursos;
- cómo se garantiza la interoperabilidad.

Este documento constituye el contrato semántico de toda la plataforma.

---

# 2. Alcance

El perfil será utilizado por:

- Portal PNPU
- Omeka S
- API Pública
- Motor de búsqueda
- Observatorio Editorial
- Procesos de importación
- Procesos de exportación

---

# 3. Principios

El perfil se basa en los siguientes principios.

- Reutilizar estándares internacionales.
- No reinventar esquemas existentes.
- Compatibilidad con Linked Open Data.
- Compatibilidad con JSON-LD.
- Compatibilidad con RDF.
- Compatibilidad con OAI-PMH.
- Compatibilidad con Schema.org.
- Evolución controlada.

---

# 4. Estándares adoptados

| Estándar | Uso |
|----------|-----|
| Dublin Core Terms | Metadatos básicos |
| Schema.org | SEO |
| RDF | Modelo de datos |
| JSON-LD | Serialización |
| SKOS | Taxonomías |
| FOAF | Personas |
| BIBO | Recursos bibliográficos |
| DataCite | DOI |
| OAI-PMH | Interoperabilidad |
| OpenAPI | APIs |

---

# 5. Modelo Conceptual

```
Publication

│

├── Contributor

├── Publisher

├── Collection

├── University

├── Subject

├── License

└── Digital Resource
```

---

# 6. Entidades principales

## Publication

Representa una publicación editorial.

## Contributor

Representa personas y organizaciones responsables.

## Publisher

Representa editoriales universitarias.

## Collection

Representa agrupaciones editoriales.

## University

Representa instituciones.

## Subject

Representa materias.

---

# 7. Perfil Publication

| Campo | Estándar | Obligatorio |
|---------|----------|------------|
| identifier | dcterms:identifier | Sí |
| title | dcterms:title | Sí |
| creator | dcterms:creator | Sí |
| publisher | dcterms:publisher | Sí |
| issued | dcterms:issued | Sí |
| language | dcterms:language | Sí |
| abstract | dcterms:abstract | Recomendado |
| subject | dcterms:subject | Sí |
| license | dcterms:license | Sí |
| type | dcterms:type | Sí |
| format | dcterms:format | Sí |
| rights | dcterms:rights | Recomendado |

---

# 8. Perfil Contributor

Campos mínimos

- identifier
- name
- affiliation
- ORCID
- role

---

# 9. Perfil Publisher

Campos

- identifier
- officialName
- acronym
- university
- province
- country
- website
- logo

---

# 10. Perfil Collection

Campos

- identifier
- title
- publisher
- description

---

# 11. Perfil University

Campos

- identifier
- officialName
- acronym
- province
- country

---

# 12. Perfil Subject

Campos

- identifier
- preferredLabel
- broader
- narrower
- related

Modelo

SKOS.

---

# 13. Cardinalidades

Publication

- 1..n Contributors
- 1 Publisher
- 0..1 Collection
- 1..n Subjects
- 1 License

Contributor

- 0..n Publications

Publisher

- 0..n Publications
- 0..n Collections

---

# 14. Representación JSON-LD

Ejemplo simplificado

```json
{
 "@context":"https://schema.org",
 "@type":"Book",
 "@id":"https://pnpu.mes.gob.cu/publicaciones/uuid",
 "name":"Arquitectura Empresarial",
 "author":{
   "@type":"Person",
   "name":"Juan Pérez"
 },
 "publisher":{
   "@type":"Organization",
   "name":"Editorial UH"
 }
}
```

---

# 15. Representación RDF

Toda entidad deberá poder representarse como triples RDF.

Ejemplo

Publication

↓

creator

↓

Contributor

---

# 16. Representación OAI-PMH

Formatos mínimos

- Dublin Core
- Qualified Dublin Core

Futuros

- MODS
- MARCXML

---

# 17. Schema.org

Tipos mínimos

Publication

↓

Book

Contributor

↓

Person

Publisher

↓

Organization

Collection

↓

CollectionPage

University

↓

CollegeOrUniversity

---

# 18. Validaciones

Toda publicación deberá cumplir.

- título obligatorio;
- identificador obligatorio;
- editorial obligatoria;
- idioma obligatorio;
- licencia obligatoria.

---

# 19. Versionado

Versión

1.0

Cambios incompatibles

Nueva versión mayor.

Cambios compatibles

Nueva versión menor.

---

# 20. Extensiones PNPU

La PNPU añade algunos campos propios.

Ejemplos

- universityCode
- publisherCode
- collectionCode
- editorialSeries
- accessLevel
- digitalAvailability
- qualityScore

Todos los campos propios utilizarán el namespace:

```
https://pnpu.mes.gob.cu/ns#
```

---

# 21. Namespaces

| Prefijo | Namespace |
|----------|-----------|
| dcterms | http://purl.org/dc/terms/ |
| schema | https://schema.org/ |
| foaf | http://xmlns.com/foaf/0.1/ |
| skos | http://www.w3.org/2004/02/skos/core# |
| bibo | http://purl.org/ontology/bibo/ |
| pnpu | https://pnpu.mes.gob.cu/ns# |

---

# 22. Interoperabilidad

El perfil garantiza interoperabilidad con:

- Omeka S
- DSpace
- Europeana
- OpenAlex
- Crossref
- DataCite
- Google Scholar
- Wikidata
- ORCID

---

# 23. Gobernanza

Toda modificación del perfil deberá ser aprobada por el Comité de Gobierno del Dato.

Las extensiones deberán evitar duplicar propiedades existentes en estándares internacionales.

---

# 24. ADR relacionadas

- ADR-0004 – Metadata Profile.
- ADR-0008 – Índices derivados.
- ADR-0012 – Omeka S como Catálogo Nacional.
- ADR-0017 – Uso de JSON-LD como formato principal de intercambio.

---

# 25. Criterios de aceptación

El Perfil de Aplicación será considerado aprobado cuando:

- Todas las entidades del dominio tengan un perfil definido.
- Los metadatos reutilicen estándares internacionales siempre que sea posible.
- Las extensiones PNPU estén documentadas.
- Sea posible serializar cualquier recurso en JSON-LD y RDF.
- Omeka S pueda implementar el perfil mediante Resource Templates.
- La API Pública pueda exponer el mismo modelo semántico.
- Los motores de búsqueda puedan generar datos estructurados utilizando Schema.org.
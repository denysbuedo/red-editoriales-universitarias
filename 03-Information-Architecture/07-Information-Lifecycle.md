---
title: Information Lifecycle
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
  - 06-Application-Profile.md
---

# Information Lifecycle

## 1. Objetivo

Este documento define el ciclo de vida de la información administrada por la Plataforma Nacional de Publicaciones Universitarias (PNPU).

El ciclo de vida establece:

- cómo nace la información;
- cómo se valida;
- cómo se publica;
- cómo se modifica;
- cómo se preserva;
- cómo se sincroniza entre sistemas;
- cuándo deja de estar disponible.

El objetivo es garantizar la integridad, trazabilidad y disponibilidad de la información durante toda su existencia.

---

# 2. Alcance

Aplica a:

- Publicaciones
- Editoriales
- Universidades
- Autores
- Colecciones
- Series
- Recursos digitales
- Noticias
- Indicadores
- Vocabularios controlados
- Metadatos derivados

---

# 3. Principios

- La información tendrá una única fuente maestra.
- Toda modificación será trazable.
- Ningún dato será eliminado físicamente sin autorización.
- Todo cambio deberá poder auditarse.
- Toda información pública deberá ser preservable.
- Las copias derivadas deberán poder reconstruirse.

---

# 4. Fuentes Maestras

| Información | Fuente Maestra |
|--------------|----------------|
| Editoriales | Sistema Gestión Editoriales |
| Universidades | Sistema Gestión Editoriales |
| Publicaciones | Omeka S |
| Colecciones | Omeka S |
| Series | Omeka S |
| Recursos Digitales | Omeka S |
| Noticias | CMS |
| Indicadores | Observatorio Editorial |
| Vocabularios | Vocabulary Service |

La PNPU nunca será la fuente maestra de estos datos, excepto de su propia configuración.

---

# 5. Modelo del Ciclo de Vida

```text
Creación
    │
    ▼
Validación
    │
    ▼
Enriquecimiento
    │
    ▼
Publicación
    │
    ▼
Indexación
    │
    ▼
Consumo
    │
    ▼
Actualización
    │
    ▼
Archivado
    │
    ▼
Preservación
```

---

# 6. Estados

Toda entidad deberá encontrarse en uno de los siguientes estados.

| Estado | Descripción |
|----------|-------------|
| Draft | Información en preparación |
| Validated | Validada |
| Published | Visible públicamente |
| Updated | Modificada |
| Archived | Histórica |
| Deprecated | Obsoleta |
| Deleted | Eliminación lógica |

---

# 7. Etapas

## 7.1 Creación

La información nace en la fuente maestra.

Ejemplos:

- Nueva publicación en Omeka.
- Nueva editorial.
- Nuevo autor.
- Nueva colección.

Responsable:

Sistema propietario.

---

## 7.2 Validación

Se verifican:

- metadatos;
- identificadores;
- vocabularios;
- relaciones;
- licencias;
- integridad.

Las validaciones automáticas deberán ejecutarse antes de la publicación.

---

## 7.3 Enriquecimiento

Se agregan datos derivados.

Ejemplos

- Slugs.
- Datos SEO.
- JSON-LD.
- Estadísticas.
- Calidad de metadatos.
- Relaciones.
- Sinónimos.
- Facetas.

Estos datos nunca reemplazan a la fuente maestra.

---

## 7.4 Publicación

La entidad pasa a ser visible mediante:

- Portal PNPU
- API Pública
- Sitemap
- Buscador
- JSON-LD

La publicación requiere:

- identificador válido;
- título;
- editorial;
- licencia;
- idioma.

---

## 7.5 Indexación

Después de la publicación.

Procesos

- actualización del índice;
- generación de facetas;
- actualización del sitemap;
- invalidación de caché;
- actualización del Observatorio.

---

## 7.6 Consumo

Los datos podrán ser consumidos por:

- usuarios;
- motores de búsqueda;
- APIs;
- universidades;
- bibliotecas;
- sistemas externos.

---

## 7.7 Actualización

Toda modificación deberá:

- conservar el identificador;
- actualizar la fecha de modificación;
- registrar auditoría;
- regenerar índices;
- invalidar caché.

---

## 7.8 Archivado

La información deja de estar activa.

Continúa siendo accesible para fines históricos.

No participa en búsquedas normales.

---

## 7.9 Preservación

La preservación busca garantizar la disponibilidad a largo plazo.

Se conservarán:

- PDF
- EPUB
- Imágenes
- Metadatos
- Relaciones
- Identificadores

Se recomienda utilizar formatos abiertos.

---

# 8. Eliminación

La eliminación física será excepcional.

Se utilizará eliminación lógica.

```
Deleted = true
```

La eliminación física requerirá autorización administrativa.

---

# 9. Versionado

Toda modificación generará:

- versión;
- fecha;
- usuario;
- motivo;
- sistema origen.

No se reutilizarán versiones.

---

# 10. Sincronización

La PNPU sincronizará únicamente cambios.

Proceso

```
Cambio

↓

API

↓

Normalización

↓

Validación

↓

Indexación

↓

Portal
```

La sincronización será incremental.

---

# 11. Auditoría

Toda modificación registrará:

- usuario;
- fecha;
- origen;
- acción;
- identificador;
- resultado.

La auditoría no podrá modificarse.

---

# 12. Retención

| Tipo | Retención |
|-------|-----------|
| Auditoría | Permanente |
| Metadatos | Permanente |
| Indicadores | Permanente |
| Logs técnicos | 12 meses |
| Caché | Según TTL |
| Índices | Reconstruibles |

---

# 13. Preservación Digital

Se recomienda aplicar el modelo OAIS.

Los objetos digitales deberán poder migrarse sin pérdida de metadatos.

La preservación incluirá:

- checksums;
- formatos abiertos;
- copias redundantes;
- verificación periódica de integridad.

---

# 14. Calidad

En cada transición deberán verificarse:

- completitud;
- consistencia;
- unicidad;
- vocabularios;
- identificadores;
- relaciones;
- accesibilidad.

---

# 15. Eventos

Cada transición generará eventos.

Ejemplos

PublicationCreated

PublicationUpdated

PublicationPublished

PublicationArchived

ContributorUpdated

PublisherUpdated

CollectionCreated

VocabularyUpdated

Estos eventos serán utilizados en futuras integraciones.

---

# 16. Responsabilidades

| Actor | Responsabilidad |
|---------|----------------|
| Omeka S | Publicaciones |
| Sistema Editoriales | Editoriales y universidades |
| CMS | Noticias |
| Portal | Consumo |
| API Pública | Exposición |
| Buscador | Indexación |
| Observatorio | Indicadores |
| Comité de Gobierno del Dato | Reglas |

---

# 17. Integraciones

Cada modificación podrá producir:

- reindexación;
- regeneración del sitemap;
- actualización de JSON-LD;
- invalidación de caché;
- actualización de indicadores;
- notificaciones.

---

# 18. Riesgos

| Riesgo | Mitigación |
|---------|------------|
| Duplicación | Identificadores persistentes |
| Pérdida de metadatos | Versionado |
| Eliminaciones accidentales | Eliminación lógica |
| Índices inconsistentes | Reconstrucción |
| Datos desactualizados | Sincronización incremental |

---

# 19. KPIs

- Tiempo medio de publicación.
- Tiempo de indexación.
- Tiempo de sincronización.
- Porcentaje de errores.
- Calidad media de metadatos.
- Recursos archivados.
- Recursos preservados.

---

# 20. ADR Relacionadas

ADR-0006 – Arquitectura Federada

ADR-0008 – Índices Derivados

ADR-0010 – UUID Corporativo

ADR-0015 – Gobierno de Vocabularios

ADR-0019 – Preservación Digital

---

# 21. Criterios de aceptación

El ciclo de vida será considerado aprobado cuando:

- Todas las entidades tengan un ciclo definido.
- Existan estados claramente identificados.
- Toda modificación sea auditable.
- La eliminación física sea excepcional.
- Los índices puedan reconstruirse.
- La sincronización sea incremental.
- La preservación digital esté contemplada.
- Las responsabilidades estén claramente asignadas.
---
title: Event Architecture
version: 1.0
status: Draft
owner: Ministerio de Educación Superior
project: Plataforma Nacional de Publicaciones Universitarias (PNPU)
authors:
  - Equipo de Arquitectura
last_update: 2026-07-14
related_documents:
  - 01-Application-Landscape.md
  - 02-C4-Context.md
  - 03-C4-Containers.md
  - 04-C4-Components.md
  - 05-Application-Services.md
  - 06-Integration-Architecture.md
  - 07-API-Architecture.md
  - 08-Search-Architecture.md
  - ../03-Information-Architecture/07-Information-Lifecycle.md
---

# Event Architecture

## 1. Objetivo

Este documento define la arquitectura de eventos de la Plataforma Nacional de Publicaciones Universitarias (PNPU).

La arquitectura orientada a eventos permitirá desacoplar componentes, mejorar la escalabilidad y facilitar la integración futura con nuevos sistemas sin modificar los existentes.

La versión inicial de la plataforma no dependerá de un Event Bus externo, pero todos los eventos estarán modelados desde el diseño.

---

# 2. Principios

- Todo evento representa un hecho ya ocurrido.
- Los eventos son inmutables.
- Los eventos nunca modifican datos; notifican cambios.
- Todo evento tendrá un identificador único.
- Todo evento será auditable.
- El productor no conocerá a los consumidores.
- Los consumidores podrán incorporarse sin modificar el productor.

---

# 3. Evolución por Releases

| Release | Estrategia |
|----------|------------|
| R1 | REST + Sincronización programada |
| R2 | Eventos internos (Domain Events) |
| R3 | Event Dispatcher + Colas |
| R4 | Event Bus (RabbitMQ / NATS) |
| Futuro | Kafka si el volumen lo requiere |

---

# 4. Tipos de Eventos

La PNPU utilizará cuatro categorías.

```
Eventos

│

├── Domain Events

├── Integration Events

├── System Events

└── Notification Events
```

---

# 5. Domain Events

Representan hechos del dominio.

Ejemplos

PublicationCreated

PublicationUpdated

PublicationPublished

PublicationArchived

PublicationDeleted

PublisherCreated

PublisherUpdated

ContributorCreated

ContributorUpdated

CollectionCreated

CollectionUpdated

VocabularyUpdated

NewsPublished

NewsArchived

---

# 6. Integration Events

Permiten comunicar cambios entre sistemas.

Ejemplos

OmekaSynchronizationCompleted

EditorialRegistryUpdated

MetadataImported

SearchIndexUpdated

CacheInvalidated

StatisticsCalculated

---

# 7. System Events

Relacionados con la operación de la plataforma.

Ejemplos

SynchronizationStarted

SynchronizationCompleted

BackupCompleted

HealthCheckFailed

StorageUnavailable

SearchUnavailable

CacheMissRateExceeded

---

# 8. Notification Events

Utilizados para informar a usuarios o administradores.

Ejemplos

EditorialActivated

EditorialDeactivated

MetadataQualityWarning

SynchronizationFailed

PublicationRequiresReview

---

# 9. Modelo de Evento

Todo evento tendrá la siguiente estructura.

```json
{
  "eventId": "01981f2d-5f7b-7d4f-a6b5-0a31f5a2b8c1",
  "eventType": "PublicationPublished",
  "occurredAt": "2026-07-14T12:00:00Z",
  "aggregateId": "01981f2d-4aa1-7d44-93ef-111111111111",
  "aggregateType": "Publication",
  "source": "Omeka",
  "version": 1,
  "correlationId": "5bbd0a...",
  "payload": {}
}
```

---

# 10. Atributos Obligatorios

| Campo | Descripción |
|---------|-------------|
| eventId | UUID v7 |
| eventType | Nombre del evento |
| occurredAt | Fecha ISO 8601 |
| aggregateId | Identificador del recurso |
| aggregateType | Tipo de entidad |
| source | Sistema origen |
| version | Versión del evento |
| correlationId | Trazabilidad |
| payload | Datos del evento |

---

# 11. Flujo de Eventos

```
Omeka

↓

PublicationUpdated

↓

Event Dispatcher

↓

Search Index

↓

Cache

↓

Portal

↓

Observatorio
```

---

# 12. Productores

| Sistema | Eventos |
|----------|----------|
| Omeka | Publicaciones |
| Sistema Editoriales | Editoriales |
| CMS | Noticias |
| Portal | Telemetría |
| Buscador | Consultas |
| Observatorio | Indicadores |

---

# 13. Consumidores

| Sistema | Eventos Consumidos |
|----------|-------------------|
| Search Engine | Publicaciones |
| Portal | Cache |
| API Pública | Actualizaciones |
| Observatorio | Cambios |
| Notification Service | Alertas |

---

# 14. Event Dispatcher

Responsabilidades:

- registrar eventos;
- distribuir eventos;
- aplicar reintentos;
- registrar errores;
- garantizar orden cuando sea necesario;
- evitar duplicados.

---

# 15. Idempotencia

Todo consumidor deberá ser idempotente.

Procesar dos veces el mismo evento no podrá producir efectos distintos.

---

# 16. Orden

Cuando el orden sea importante se utilizará:

AggregateId

↓

Sequence

↓

Timestamp

---

# 17. Versionado

Todo evento tendrá versión.

Ejemplo

PublicationPublished v1

PublicationPublished v2

Los consumidores deberán soportar varias versiones durante el período de transición.

---

# 18. Reintentos

Errores temporales

- retry 1
- retry 2
- retry 3

Después

Dead Letter Queue (R4)

---

# 19. Observabilidad

Cada evento registrará:

- tiempo de publicación;
- tiempo de consumo;
- consumidor;
- duración;
- resultado.

---

# 20. Correlation ID

Toda petición HTTP generará un Correlation ID.

Todos los eventos derivados reutilizarán dicho identificador.

Permitirá reconstruir completamente una operación.

---

# 21. Seguridad

Los eventos no contendrán:

- credenciales;
- secretos;
- tokens;
- información sensible no necesaria.

Los eventos deberán firmarse cuando abandonen el dominio de confianza.

---

# 22. Persistencia

Los eventos podrán conservarse para auditoría.

Tiempo recomendado

5 años.

Los eventos críticos

Permanentes.

---

# 23. Event Naming Convention

Formato

```
<Entity><Action>
```

Ejemplos

PublicationPublished

PublisherUpdated

CollectionCreated

VocabularyUpdated

Incorrecto

UpdatePublication

DoPublication

PublicationEvent

---

# 24. Integración con el Lifecycle

Cada transición del ciclo de vida genera un evento.

Ejemplo

Draft

↓

PublicationValidated

↓

PublicationPublished

↓

PublicationIndexed

↓

PublicationArchived

---

# 25. Integración con Search

PublicationPublished

↓

Indexer

↓

SearchUpdated

↓

CacheInvalidated

↓

SitemapGenerated

---

# 26. Integración con Observatorio

PublicationPublished

↓

StatisticsUpdated

↓

DashboardUpdated

---

# 27. Futuras Integraciones

La arquitectura permitirá incorporar:

- RabbitMQ
- NATS
- Azure Service Bus
- Kafka
- Apache Pulsar

sin modificar el dominio.

---

# 28. ADR Relacionadas

ADR-0006 – Arquitectura Federada.

ADR-0008 – Índices Derivados.

ADR-0018 – Arquitectura Orientada a Eventos.

ADR-0021 – Event Dispatcher.

---

# 29. Criterios de aceptación

La arquitectura de eventos será considerada aprobada cuando:

- Todos los eventos estén identificados.
- Los productores no conozcan a los consumidores.
- Los consumidores sean idempotentes.
- Exista versionado.
- Exista trazabilidad mediante Correlation ID.
- El modelo permita incorporar un Event Bus sin modificar el dominio.
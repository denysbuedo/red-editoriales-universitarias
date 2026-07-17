---
title: Observability Architecture
version: 1.0
status: Draft
owner: Ministerio de Educación Superior
project: Plataforma Nacional de Publicaciones Universitarias (PNPU)
authors:
  - Equipo de Arquitectura
last_update: 2026-07-14
related_documents:
  - 01-Technology-Stack.md
  - 02-Infrastructure-Architecture.md
  - 03-Security-Architecture.md
  - 04-DevOps-Architecture.md
---

# Observability Architecture

# 1. Objetivo

Definir la estrategia de observabilidad de la Plataforma Nacional de Publicaciones Universitarias (PNPU).

La observabilidad permitirá detectar, diagnosticar y resolver incidencias mediante la recolección y análisis de:

- métricas;
- registros (logs);
- trazas;
- eventos;
- indicadores de negocio.

Su propósito es reducir el tiempo de detección (MTTD), el tiempo de recuperación (MTTR) y mejorar la disponibilidad de la plataforma.

---

# 2. Principios

## OBS-001

Toda aplicación deberá ser observable.

---

## OBS-002

Todo servicio deberá exponer métricas.

---

## OBS-003

Toda operación crítica deberá generar logs estructurados.

---

## OBS-004

Los registros deberán correlacionarse mediante Correlation ID.

---

## OBS-005

Las alertas deberán estar basadas en impacto real y evitar falsos positivos.

---

## OBS-006

La observabilidad no podrá degradar significativamente el rendimiento de la plataforma.

---

# 3. Arquitectura

```text
Usuarios
     │
     ▼
HAProxy
     │
     ▼
Portal PNPU
     │
     ▼
Omeka S
     │
     ▼
PostgreSQL
     │
     ▼
Redis
```

Cada componente generará:

- logs;
- métricas;
- eventos;
- health checks.

Estos datos serán recolectados por la plataforma de monitorización.

---

# 4. Componentes

| Componente | Observabilidad |
|------------|----------------|
| HAProxy | Logs, métricas, health checks |
| Portal PNPU | Logs, métricas, trazas |
| Omeka S | Logs PHP, métricas |
| PostgreSQL | Métricas, consultas lentas |
| Redis | Métricas de memoria y rendimiento |
| Storage | Capacidad, disponibilidad |
| Backups | Estado y duración |
| GitHub Actions | Resultados de despliegues |

---

# 5. Logs

Todos los logs deberán cumplir:

- formato estructurado (JSON cuando sea posible);
- fecha ISO-8601;
- nivel de severidad;
- identificador del servicio;
- Correlation ID;
- usuario autenticado (si aplica);
- dirección IP;
- duración de la operación.

Nunca deberán registrarse:

- contraseñas;
- tokens;
- claves API;
- secretos.

---

# 6. Niveles de Log

| Nivel | Uso |
|--------|-----|
| DEBUG | Desarrollo |
| INFO | Operación normal |
| WARN | Situaciones anómalas |
| ERROR | Fallos recuperables |
| FATAL | Fallos críticos |

Producción utilizará como mínimo **INFO**.

---

# 7. Correlation ID

Toda petición HTTP generará un `Correlation ID`.

Este identificador deberá propagarse a:

- Portal;
- Omeka;
- APIs;
- PostgreSQL (cuando sea posible);
- registros de auditoría.

Permitirá reconstruir una operación completa.

---

# 8. Métricas

Se monitorizarán cuatro categorías:

## Infraestructura

- CPU;
- RAM;
- Disco;
- Red;
- I/O.

## Aplicación

- Tiempo de respuesta;
- Solicitudes por segundo;
- Errores 4xx;
- Errores 5xx;
- Usuarios concurrentes.

## Base de datos

- Conexiones;
- Consultas lentas;
- Locks;
- Tamaño de la base de datos;
- Replicación (si aplica).

## Negocio

- Publicaciones publicadas;
- Nuevas editoriales;
- Descargas;
- Búsquedas realizadas;
- Recursos consultados.

---

# 9. Health Checks

Todas las aplicaciones deberán implementar:

```text
/health/live
/health/ready
```

## Live

Verifica que el proceso está ejecutándose.

## Ready

Verifica que:

- PostgreSQL responde;
- Redis responde;
- Omeka está disponible;
- almacenamiento accesible.

---

# 10. Dashboards

Se recomienda disponer, al menos, de:

## Operación

- Estado general.
- Disponibilidad.
- Alertas activas.

## Portal

- Tiempo de respuesta.
- Usuarios concurrentes.
- Errores HTTP.

## Omeka

- Recursos publicados.
- Tiempo de respuesta.
- Errores PHP.

## PostgreSQL

- Conexiones.
- Consultas lentas.
- Uso de disco.

## Redis

- Memoria.
- Hit Ratio.
- Conexiones.

## HAProxy

- Backends activos.
- Latencia.
- Errores.
- Balanceo.

---

# 11. Alertas

Las alertas deberán clasificarse como:

| Nivel | Ejemplo |
|--------|----------|
| Información | Backup finalizado |
| Advertencia | Disco > 80 % |
| Alta | Servicio degradado |
| Crítica | Portal inaccesible |

---

# 12. SLI (Service Level Indicators)

Indicadores propuestos:

- Disponibilidad del Portal.
- Latencia p95.
- Latencia p99.
- Tiempo medio de publicación.
- Tiempo medio de sincronización.
- Éxito de backups.
- Éxito de despliegues.

---

# 13. SLO (Service Level Objectives)

Objetivos iniciales:

| Servicio | Objetivo |
|-----------|----------|
| Portal | 99.5 % |
| API | 99.5 % |
| Omeka | 99 % |
| PostgreSQL | 99.9 % |
| Redis | 99.9 % |

Estos valores podrán revisarse tras el primer año de operación.

---

# 14. Error Budget

Cada servicio dispondrá de un presupuesto de error asociado a su SLO.

Cuando se agote el presupuesto:

- se limitarán nuevas funcionalidades;
- se priorizarán tareas de estabilidad;
- se analizarán las causas raíz.

---

# 15. Exporters

Exporters recomendados:

- node_exporter;
- postgres_exporter;
- redis_exporter;
- mysqld_exporter;
- blackbox_exporter;
- HAProxy exporter (si está disponible).

---

# 16. Retención

| Tipo | Retención |
|------|-----------|
| Logs | 90 días |
| Métricas detalladas | 30 días |
| Métricas agregadas | 1 año |
| Auditoría | Permanente |

Los valores podrán ajustarse según la capacidad disponible.

---

# 17. KPIs Operacionales

## Portal

- Disponibilidad.
- TTFB.
- Tiempo medio de respuesta.
- Errores 5xx.

## Omeka

- Tiempo de respuesta.
- Recursos publicados.
- Errores PHP.

## PostgreSQL

- Consultas lentas.
- Locks.
- Conexiones.

## Redis

- Hit Ratio.
- Memoria utilizada.
- Evicciones.

## HAProxy

- Latencia.
- Backends fuera de servicio.
- Conexiones activas.

---

# 18. Roadmap

## Release 1

- Prometheus.
- Grafana.
- Node Exporter.
- PostgreSQL Exporter.

## Release 2

- Loki.
- Centralización de logs.
- Dashboards operacionales.

## Release 3

- OpenTelemetry.
- Trazas distribuidas.
- Correlación completa.

---

# 19. ADR relacionadas

ADR-0033 – Estrategia de Observabilidad.

ADR-0034 – Correlation ID.

ADR-0035 – Health Checks.

ADR-0036 – SLI/SLO.

---

# 20. Criterios de aceptación

La arquitectura de observabilidad será considerada aprobada cuando:

- todos los servicios expongan health checks;
- existan métricas para infraestructura y aplicaciones;
- los logs estén estructurados;
- exista correlación entre componentes;
- se definan dashboards mínimos;
- se establezcan SLI y SLO;
- las alertas estén documentadas;
- los KPIs operacionales sean medibles.
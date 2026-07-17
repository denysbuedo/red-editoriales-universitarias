---
title: Technology Decisions Register
version: 1.0
status: Approved
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
  - 05-Observability.md
  - 06-Backup-and-Disaster-Recovery.md
  - 07-Deployment-Architecture.md
  - 08-Environment-Strategy.md
  - 09-Performance-and-Scalability.md
---

# Technology Decisions Register

# 1. Objetivo

Este documento consolida las principales decisiones tecnológicas adoptadas durante el diseño de la Plataforma Nacional de Publicaciones Universitarias (PNPU).

No sustituye a las ADR ni a los documentos de arquitectura.

Su propósito es proporcionar una visión ejecutiva de:

- tecnologías seleccionadas;
- alternativas evaluadas;
- justificación;
- impacto;
- estado de adopción.

---

# 2. Principios

Las decisiones tecnológicas de la PNPU se basan en:

- simplicidad;
- software libre;
- interoperabilidad;
- mantenibilidad;
- escalabilidad;
- seguridad;
- automatización;
- estándares abiertos;
- independencia tecnológica.

---

# 3. Registro de Decisiones

## TD-001

### Sistema Operativo

**Decisión**

Ubuntu Server LTS.

**Estado**

Aprobada.

**Motivación**

- soporte prolongado;
- estabilidad;
- amplia comunidad;
- compatibilidad con todo el stack.

---

## TD-002

### Plataforma de despliegue

**Decisión**

Máquinas virtuales.

**Estado**

Aprobada.

**Alternativas**

- Docker
- Kubernetes
- Podman

**Resultado**

No utilizar contenedores.

**Justificación**

- infraestructura existente del MES;
- menor complejidad operativa;
- facilidad de administración;
- menor curva de aprendizaje.

---

## TD-003

### Punto de entrada

**Decisión**

HAProxy remoto.

**Responsabilidades**

- TLS;
- balanceo;
- publicación;
- health checks.

Las aplicaciones permanecerán en redes privadas.

---

## TD-004

### Frontend

**Decisión**

Next.js + React + TypeScript.

**Motivación**

- SEO;
- rendimiento;
- SSR;
- ISR;
- ecosistema.

---

## TD-005

### Framework CSS

**Decisión**

Tailwind CSS.

**Motivación**

- productividad;
- consistencia;
- bajo peso;
- mantenimiento.

---

## TD-006

### Catálogo bibliográfico

**Decisión**

Omeka S.

**Alternativas**

- DSpace;
- Drupal;
- Fedora Commons.

**Resultado**

Omeka S.

**Justificación**

- Dublin Core;
- RDF;
- JSON-LD;
- patrimonio digital;
- interoperabilidad.

---

## TD-007

### CMS

**Decisión**

Markdown/MDX en Release 1.

Directus podrá incorporarse posteriormente si la gestión editorial lo requiere.

---

## TD-008

### Base de datos

**Decisión**

PostgreSQL.

**Responsabilidades**

- datos PNPU;
- configuración;
- sincronización;
- observatorio;
- auditoría.

---

## TD-009

### Base de datos Omeka

**Decisión**

MariaDB/MySQL.

Se mantiene la recomendación oficial del proyecto Omeka S.

---

## TD-010

### Caché

**Decisión**

Redis o Valkey.

Redis nunca será la fuente de verdad.

---

## TD-011

### Motor de búsqueda

**Release 1**

PostgreSQL Full Text Search.

**Evolución**

OpenSearch únicamente cuando exista una necesidad objetiva.

---

## TD-012

### Autenticación

**Decisión**

Keycloak o proveedor institucional compatible con OpenID Connect.

---

## TD-013

### Automatización

**Decisión**

Ansible.

**Responsabilidades**

- instalación;
- configuración;
- despliegue;
- rollback;
- actualización;
- validación.

---

## TD-014

### Gestión de procesos

**Decisión**

systemd.

Cada aplicación dispondrá de una unidad independiente.

---

## TD-015

### Integración Continua

**Decisión**

GitHub Actions.

---

## TD-016

### Control de versiones

**Decisión**

Git + GitHub.

---

## TD-017

### Observabilidad

**Stack**

- Prometheus;
- Grafana;
- Loki.

OpenTelemetry será incorporado en una fase posterior.

---

## TD-018

### Analítica

**Decisión**

Matomo.

No se utilizará Google Analytics.

---

## TD-019

### Backups

**Decisión**

Estrategia 3-2-1.

---

## TD-020

### Arquitectura de despliegue

**Decisión**

Releases versionadas.

```text
releases/

current/

shared/
```

Rollback mediante cambio del enlace simbólico `current`.

---

## TD-021

### Infraestructura como Código

**Decisión**

Toda configuración deberá poder reconstruirse mediante Ansible.

---

## TD-022

### Configuración

Las variables de entorno permanecerán fuera del repositorio.

Ubicación recomendada:

```text
/etc/pnpu/
```

---

## TD-023

### Seguridad

La arquitectura adopta como referencia:

- OWASP ASVS;
- OWASP Top 10;
- CIS Controls;
- NIST CSF.

---

## TD-024

### Health Checks

Todas las aplicaciones deberán implementar:

```text
/health/live

/health/ready
```

---

## TD-025

### Estrategia de escalabilidad

Portal:

Escalado horizontal.

Bases de datos:

Escalado vertical inicialmente.

---

## TD-026

### Estrategia de almacenamiento

Modelo híbrido.

- archivos locales cuando sea necesario;
- almacenamiento institucional;
- crecimiento independiente del Portal.

---

## TD-027

### Política de despliegue

No existirán cambios manuales en Producción.

Todos los despliegues serán:

- automatizados;
- auditables;
- reversibles.

---

## TD-028

### Arquitectura de Eventos

La plataforma utilizará Domain Events desde el diseño.

La incorporación de un Event Bus será progresiva.

---

## TD-029

### APIs

REST como interfaz principal.

OpenAPI 3.1 como contrato.

---

## TD-030

### Estándares de Metadatos

La PNPU adopta:

- Dublin Core Terms;
- Schema.org;
- SKOS;
- FOAF;
- BIBO;
- JSON-LD;
- RDF.

---

# 4. Tecnologías descartadas

| Tecnología | Motivo |
|------------|--------|
| Docker | Decisión de infraestructura |
| Kubernetes | Complejidad innecesaria |
| MongoDB | No aporta ventajas al dominio |
| Elastic desde R1 | Sobredimensionado |
| Google Analytics | Política institucional |
| WordPress | No adecuado para el dominio |

---

# 5. Roadmap Tecnológico

## Release 1

- Portal PNPU.
- PostgreSQL.
- Redis.
- Omeka S.
- Markdown/MDX.
- GitHub Actions.
- Ansible.

---

## Release 2

- Keycloak.
- Observatorio Editorial.
- Mejoras de monitorización.
- CMS visual si se justifica.

---

## Release 3

- OpenSearch.
- OpenTelemetry.
- Arquitectura de eventos ampliada.

---

## Release 4

- Búsqueda semántica.
- IA para recomendaciones.
- Integraciones internacionales.

---

# 6. Gobierno

Las decisiones tecnológicas solo podrán modificarse mediante:

- nueva ADR;
- evaluación de impacto;
- aprobación del Comité Técnico;
- actualización de este registro.

---

# 7. Estado General

| Área | Estado |
|------|--------|
| Stack tecnológico | Aprobado |
| Infraestructura | Aprobada |
| Seguridad | Aprobada |
| DevOps | Aprobado |
| Observabilidad | Aprobada |
| Backups | Aprobados |
| Despliegue | Aprobado |
| Entornos | Aprobados |
| Rendimiento | Aprobado |

---

# 8. Próxima revisión

La revisión tecnológica deberá realizarse:

- antes de cada Release mayor;
- cuando aparezca una tecnología que aporte ventajas claras;
- cuando cambie la infraestructura institucional.

---

# 9. Criterios de aceptación

Este documento será considerado aprobado cuando:

- todas las decisiones tecnológicas estén registradas;
- exista una justificación para cada decisión;
- las tecnologías descartadas estén documentadas;
- el roadmap esté actualizado;
- cualquier nuevo miembro del proyecto pueda comprender el stack tecnológico sin revisar toda la documentación.
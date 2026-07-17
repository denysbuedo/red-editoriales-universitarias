---
title: Backup and Disaster Recovery
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
  - 05-Observability.md
---

# Backup and Disaster Recovery

# 1. Objetivo

Definir la estrategia oficial de respaldo, recuperación y continuidad operativa de la Plataforma Nacional de Publicaciones Universitarias (PNPU).

Esta estrategia busca garantizar:

- continuidad del servicio;
- recuperación ante desastres;
- protección de la información;
- reducción del tiempo de recuperación;
- minimización de pérdida de datos.

---

# 2. Alcance

Aplica a:

- Portal PNPU
- Omeka S
- PostgreSQL
- MariaDB/MySQL
- Redis/Valkey
- Storage institucional
- Configuración de servidores
- Automatización Ansible
- Monitorización
- Documentación técnica

---

# 3. Principios

## BDR-001

Todo dato crítico deberá tener respaldo.

---

## BDR-002

Todo respaldo deberá verificarse.

---

## BDR-003

Todo respaldo deberá poder restaurarse.

---

## BDR-004

Los respaldos deberán almacenarse fuera del servidor de producción.

---

## BDR-005

La restauración deberá probarse periódicamente.

---

## BDR-006

Los respaldos deberán estar protegidos contra modificaciones accidentales.

---

# 4. Estrategia 3-2-1

La PNPU adoptará la estrategia internacional **3-2-1**.

- **3 copias** de los datos.
- **2 medios de almacenamiento** diferentes.
- **1 copia fuera del entorno principal**.

Ejemplo:

- Producción.
- NAS institucional.
- Servidor de respaldo en otra ubicación.

---

# 5. Activos Críticos

| Activo | Criticidad |
|---------|------------|
| PostgreSQL PNPU | Muy Alta |
| Base de datos Omeka | Muy Alta |
| Recursos digitales (PDF, EPUB, imágenes) | Muy Alta |
| Configuración `/etc/pnpu` | Alta |
| Playbooks Ansible | Alta |
| Unidades systemd | Alta |
| Dashboards Grafana | Media |
| Reglas Prometheus | Media |
| Documentación del proyecto | Alta |

---

# 6. Activos que NO se respaldan

No se respaldarán:

- `node_modules`
- caché Redis
- builds de Next.js
- archivos temporales
- logs antiguos fuera de la política de retención
- índices de OpenSearch (reconstruibles)
- cachés de aplicaciones

Estos elementos podrán regenerarse.

---

# 7. Tipos de respaldo

## Completo

Incluye toda la información del componente.

Frecuencia recomendada:

Semanal.

---

## Incremental

Incluye únicamente cambios desde el último respaldo.

Frecuencia:

Diaria.

---

## Diferencial

Opcional para componentes de gran tamaño.

---

# 8. Política de Retención

| Tipo | Retención |
|------|-----------|
| Diario | 30 días |
| Semanal | 12 semanas |
| Mensual | 12 meses |
| Anual | Según política institucional |

---

# 9. Objetivos RPO y RTO

| Servicio | RPO | RTO |
|----------|-----|-----|
| Portal PNPU | 24 h | 4 h |
| PostgreSQL PNPU | 4 h | 2 h |
| Omeka S | 4 h | 4 h |
| Storage | 24 h | 8 h |
| Observatorio | 24 h | 8 h |

Estos valores deberán revisarse anualmente.

---

# 10. Respaldo de PostgreSQL

Se respaldarán:

- base de datos completa;
- roles;
- permisos;
- extensiones;
- configuración relevante.

Herramientas sugeridas:

- `pg_dump`
- `pg_dumpall`
- `pg_basebackup` (si se implementa replicación)

---

# 11. Respaldo de Omeka S

Se respaldarán:

- base de datos;
- directorio de recursos digitales;
- módulos;
- temas;
- configuración;
- archivos de carga.

---

# 12. Respaldo del Portal PNPU

No será necesario respaldar el código fuente si este se encuentra versionado en GitHub.

Sí deberán respaldarse:

- archivos de configuración;
- variables de entorno (`/etc/pnpu`);
- contenidos no versionados;
- archivos generados por usuarios, si existieran.

---

# 13. Respaldo de Infraestructura

Se respaldarán:

- playbooks Ansible;
- inventarios;
- scripts;
- configuración de Nginx;
- configuración de HAProxy (si corresponde al proyecto);
- unidades systemd;
- reglas de firewall;
- dashboards;
- alertas.

---

# 14. Almacenamiento de Backups

Los respaldos deberán almacenarse en:

1. almacenamiento local temporal;
2. NAS institucional;
3. copia externa o secundaria autorizada.

Los respaldos deberán estar cifrados cuando contengan información sensible.

---

# 15. Verificación

Todo respaldo deberá verificarse automáticamente.

La verificación incluirá:

- checksum;
- tamaño esperado;
- fecha;
- posibilidad de restauración.

---

# 16. Restauración

Toda restauración seguirá el siguiente orden:

1. infraestructura base;
2. configuración;
3. bases de datos;
4. almacenamiento;
5. aplicaciones;
6. monitorización;
7. validación funcional.

---

# 17. Procedimiento de Recuperación

## Escenario 1: Falla de una aplicación

- Restaurar la última versión estable.
- Verificar health checks.
- Reincorporar al HAProxy.

## Escenario 2: Pérdida de una VM

- Crear nueva VM.
- Aplicar playbooks Ansible.
- Restaurar configuración.
- Restaurar datos.
- Validar servicios.

## Escenario 3: Pérdida de PostgreSQL

- Restaurar desde el último respaldo válido.
- Aplicar WAL o incrementales si existen.
- Verificar integridad.
- Validar aplicaciones.

## Escenario 4: Pérdida total del entorno

Orden recomendado:

1. Red.
2. DNS.
3. HAProxy.
4. PostgreSQL.
5. Redis.
6. Omeka.
7. Portal.
8. Observabilidad.
9. Validación integral.

---

# 18. Simulacros

Se realizarán simulacros al menos una vez al año.

Se recomienda cubrir:

- restauración de PostgreSQL;
- recuperación de Omeka;
- recuperación completa del Portal;
- recuperación desde backups externos.

Los resultados deberán documentarse.

---

# 19. Riesgos

| Riesgo | Mitigación |
|---------|------------|
| Backups corruptos | Verificación automática |
| Restauración no probada | Simulacros periódicos |
| Falta de espacio | Monitorización |
| Pérdida de secretos | Cifrado y copia segura |
| Error humano | Procedimientos documentados |

---

# 20. Responsabilidades

| Rol | Responsabilidad |
|-----|-----------------|
| Administrador de Infraestructura | Ejecutar y supervisar respaldos |
| Administrador de Bases de Datos | Validar respaldos de PostgreSQL y MariaDB |
| Equipo DevOps | Automatizar procesos |
| Comité Técnico | Aprobar políticas y revisar resultados |

---

# 21. ADR Relacionadas

- ADR-0037 – Estrategia de Backups.
- ADR-0038 – Recuperación ante Desastres.
- ADR-0039 – Política de Retención.
- ADR-0040 – Estrategia 3-2-1.

---

# 22. Criterios de aceptación

La estrategia será considerada aprobada cuando:

- todos los activos críticos estén identificados;
- exista una política de respaldo documentada;
- se definan RPO y RTO;
- se adopte la estrategia 3-2-1;
- los respaldos sean verificables;
- existan procedimientos de restauración;
- se planifiquen simulacros periódicos;
- las responsabilidades estén claramente asignadas.
---
title: Deployment Architecture
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
  - 06-Backup-and-Disaster-Recovery.md
---

# Deployment Architecture

# 1. Objetivo

Definir la arquitectura de despliegue de la Plataforma Nacional de Publicaciones Universitarias (PNPU).

El objetivo es garantizar que cualquier versión de la plataforma pueda desplegarse de forma:

- reproducible;
- automatizada;
- segura;
- auditable;
- reversible.

---

# 2. Principios

## DEPLOY-001

Todo despliegue será automatizado.

---

## DEPLOY-002

Nunca se desplegará directamente sobre la versión en ejecución.

---

## DEPLOY-003

Toda versión será identificable.

---

## DEPLOY-004

Toda versión podrá revertirse.

---

## DEPLOY-005

Los despliegues serán auditables.

---

## DEPLOY-006

Las aplicaciones permanecerán detrás del HAProxy durante todo el proceso.

---

# 3. Arquitectura

```text
Developer

↓

GitHub

↓

GitHub Actions

↓

Build

↓

Artefacto

↓

Servidor de despliegue

↓

Ansible

↓

Ubuntu Server

↓

systemd

↓

Health Check

↓

HAProxy

↓

Producción
```

---

# 4. Estrategia

Cada aplicación utilizará un modelo basado en **releases versionadas**.

```text
/opt/pnpu/

portal/

releases/

1.0.0/

1.0.1/

1.1.0/

current -> 1.1.0

shared/
```

Nunca se modificará una release existente.

---

# 5. Directorios

Cada aplicación tendrá:

```text
/opt/pnpu/<app>/

releases/

current

shared/

logs/

uploads/

config/
```

---

# 6. Artefactos

Cada pipeline generará:

- paquete versionado;
- checksum;
- manifest.json;
- changelog;
- SBOM;
- hash de integridad.

---

# 7. Flujo de despliegue

```text
Build

↓

Tests

↓

Security Scan

↓

Package

↓

Upload

↓

Verificación

↓

Nueva Release

↓

Migraciones

↓

systemd Restart

↓

Health Check

↓

HAProxy

↓

Producción
```

---

# 8. Secuencia de despliegue

1. Descargar artefacto.
2. Verificar checksum.
3. Descomprimir en nueva release.
4. Instalar dependencias.
5. Ejecutar migraciones.
6. Actualizar enlace `current`.
7. Reiniciar servicio.
8. Ejecutar Health Check.
9. Habilitar tráfico.
10. Registrar despliegue.

---

# 9. Gestión mediante systemd

Cada aplicación tendrá una unidad propia.

Ejemplo:

```ini
[Unit]
Description=PNPU Portal

[Service]
User=pnpu
WorkingDirectory=/opt/pnpu/portal/current
EnvironmentFile=/etc/pnpu/portal.env
ExecStart=/usr/bin/npm run start
Restart=always

[Install]
WantedBy=multi-user.target
```

---

# 10. Variables de entorno

Las configuraciones estarán fuera del código.

Ubicación:

```text
/etc/pnpu/
```

Los archivos deberán tener permisos restrictivos y no formarán parte de los artefactos.

---

# 11. Migraciones

Las migraciones deberán:

- estar versionadas;
- ser reversibles cuando sea posible;
- ejecutarse una sola vez;
- registrar su ejecución.

---

# 12. Health Checks

Todas las aplicaciones deberán exponer:

```text
/health/live
/health/ready
```

El HAProxy utilizará `/health/ready` para decidir si una instancia puede recibir tráfico.

---

# 13. Rolling Deployment

Cuando existan dos instancias del Portal:

```text
HAProxy

↓

WEB-01

WEB-02
```

El proceso será:

1. Retirar WEB-01 del balanceador.
2. Desplegar nueva versión.
3. Ejecutar Health Check.
4. Reincorporar WEB-01.
5. Repetir con WEB-02.

No existirá indisponibilidad del servicio.

---

# 14. Rollback

Si una nueva versión falla:

1. Retirar la instancia del HAProxy.
2. Cambiar el enlace `current` a la release anterior.
3. Reiniciar el servicio.
4. Ejecutar Health Check.
5. Reincorporar la instancia.

El rollback no deberá requerir reconstrucción de la aplicación.

---

# 15. Gestión de versiones

Cada release incluirá:

- número de versión;
- fecha;
- commit Git;
- autor del despliegue;
- changelog;
- checksum.

---

# 16. Automatización

Ansible será responsable de:

- copiar artefactos;
- crear directorios;
- actualizar permisos;
- gestionar systemd;
- ejecutar migraciones;
- validar Health Checks;
- realizar rollback.

---

# 17. HAProxy

El HAProxy será el único punto de publicación.

Responsabilidades:

- balanceo;
- health checks;
- terminación TLS;
- control de disponibilidad;
- aislamiento de nodos durante despliegues.

---

# 18. Estrategia de despliegue por componente

| Componente | Estrategia |
|------------|------------|
| Portal PNPU | Rolling Deployment |
| Omeka S | Ventana de mantenimiento controlada |
| PostgreSQL | Migraciones controladas y respaldo previo |
| Redis | Reinicio controlado |
| Observatorio | Rolling cuando aplique |

---

# 19. Validación posterior

Después de cada despliegue se verificará:

- disponibilidad del Portal;
- acceso a Omeka;
- conexión con PostgreSQL;
- conexión con Redis;
- autenticación;
- búsqueda;
- APIs;
- métricas;
- logs.

---

# 20. Registro del despliegue

Cada despliegue registrará:

- versión;
- fecha;
- operador;
- commit;
- duración;
- resultado;
- rollback (si ocurrió).

---

# 21. Riesgos

| Riesgo | Mitigación |
|---------|------------|
| Artefacto corrupto | Verificación mediante checksum |
| Error de migración | Respaldo previo y rollback |
| Configuración incorrecta | Variables externas y Ansible |
| Nodo fuera de servicio | Health Checks y HAProxy |
| Error humano | Automatización completa |

---

# 22. ADR relacionadas

- ADR-0025 – Ubuntu Server como plataforma.
- ADR-0026 – Despliegue sin contenedores.
- ADR-0027 – Automatización con Ansible.
- ADR-0028 – systemd como gestor de procesos.
- ADR-0032 – Releases versionadas.
- ADR-0041 – Rolling Deployment.

---

# 23. Criterios de aceptación

La arquitectura de despliegue será considerada aprobada cuando:

- todas las aplicaciones se desplieguen mediante artefactos versionados;
- el despliegue sea automatizado con Ansible;
- cada servicio utilice systemd;
- exista rollback documentado;
- el HAProxy gestione la disponibilidad durante los despliegues;
- se ejecuten Health Checks antes de habilitar tráfico;
- las configuraciones permanezcan fuera del código;
- todos los despliegues sean auditables y repetibles.
---
title: DevOps Architecture
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
---

# DevOps Architecture

# 1. Objetivo

Este documento define la estrategia DevOps de la Plataforma Nacional de Publicaciones Universitarias (PNPU).

La estrategia DevOps establece los procesos para:

- desarrollo;
- integración continua;
- pruebas;
- despliegue;
- automatización;
- versionado;
- recuperación;
- operación.

Su objetivo es garantizar despliegues repetibles, seguros y con mínimo tiempo de indisponibilidad.

---

# 2. Principios

## DEVOPS-001

Automatizar todo lo repetitivo.

---

## DEVOPS-002

Los despliegues deberán ser reproducibles.

---

## DEVOPS-003

No realizar cambios manuales en producción.

---

## DEVOPS-004

Toda versión deberá poder volver atrás (Rollback).

---

## DEVOPS-005

Todo cambio deberá pasar pruebas automáticas.

---

## DEVOPS-006

Toda modificación quedará registrada en Git.

---

## DEVOPS-007

La infraestructura será gestionada como código.

---

# 3. Arquitectura DevOps

```text
Desarrollador

↓

GitHub

↓

Pull Request

↓

GitHub Actions

↓

Tests

↓

Security Scan

↓

Build

↓

Artefacto

↓

Ansible

↓

VM Ubuntu

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

# 4. Herramientas

| Área | Tecnología |
|------|------------|
| Control de versiones | Git |
| Repositorio | GitHub |
| CI | GitHub Actions |
| Automatización | Ansible |
| Sistema Operativo | Ubuntu Server |
| Gestión de procesos | systemd |
| Calidad | ESLint |
| Formato | Prettier |
| Pruebas | Vitest / Playwright |
| Seguridad | npm audit + CodeQL |
| Dependencias | Dependabot |
| Documentación | MkDocs |

---

# 5. Estrategia Git

Modelo simplificado.

```text
main

↓

release/x.y

↓

feature/*

↓

hotfix/*
```

No se utilizarán ramas de larga duración.

---

# 6. Versionado

Semantic Versioning.

Ejemplos

1.0.0

1.1.0

1.1.1

---

# 7. Conventional Commits

Formato obligatorio.

```
feat:

fix:

docs:

refactor:

test:

ci:

build:

perf:
```

Ejemplo

```
feat(search): agregar búsqueda por ISBN
```

---

# 8. Pull Requests

Todo cambio deberá realizarse mediante Pull Request.

Requisitos mínimos

- revisión técnica;
- pruebas aprobadas;
- pipeline exitoso;
- documentación actualizada.

---

# 9. GitHub Actions

Pipelines mínimos

- Build
- Lint
- Unit Test
- Security Scan
- Package
- Deploy
- Rollback

---

# 10. Pipeline de Integración Continua

```text
Commit

↓

Lint

↓

Type Check

↓

Tests

↓

Build

↓

Security Scan

↓

Package

↓

Artefacto
```

---

# 11. Pipeline de Despliegue

```text
Release

↓

Artefacto

↓

Servidor de despliegue

↓

Ansible

↓

VM

↓

Health Check

↓

Activación

↓

HAProxy
```

---

# 12. Artefactos

Cada release generará:

- paquete versionado;
- checksum;
- changelog;
- manifest.json;
- SBOM.

---

# 13. Despliegue

Cada aplicación utilizará la siguiente estructura.

```
/opt/pnpu/app/

releases/

current

shared/
```

Nunca se desplegará directamente sobre la versión activa.

---

# 14. Rollback

Si falla el Health Check.

Proceso

```
Detener

↓

Cambiar symlink

↓

Iniciar versión anterior

↓

Verificar

↓

Habilitar HAProxy
```

---

# 15. Migraciones

Las migraciones deberán:

- ser versionadas;
- ser reversibles;
- ejecutarse automáticamente;
- registrarse.

---

# 16. Variables de entorno

Se almacenarán fuera del repositorio.

Ubicación sugerida

```
/etc/pnpu/
```

Nunca en Git.

---

# 17. Gestión de secretos

Incluye

- JWT
- SMTP
- PostgreSQL
- Redis
- API Keys

Rotación periódica.

---

# 18. Calidad

Toda Pull Request deberá superar:

- ESLint;
- TypeScript;
- Unit Tests;
- Build;
- Security Scan.

---

# 19. Dependencias

Dependabot revisará:

- vulnerabilidades;
- actualizaciones.

Las actualizaciones mayores deberán validarse manualmente.

---

# 20. Seguridad

Se ejecutarán:

- npm audit;
- CodeQL;
- revisión de secretos;
- revisión de dependencias.

---

# 21. Definición de Done

Una funcionalidad estará terminada cuando:

- código aprobado;
- pruebas aprobadas;
- documentación actualizada;
- pipeline exitoso;
- despliegue validado.

---

# 22. Health Checks

Cada servicio deberá exponer.

```
/health/live

/health/ready
```

---

# 23. Ambientes

- Desarrollo
- QA
- Preproducción
- Producción

Cada ambiente tendrá configuración independiente.

---

# 24. Monitoreo del Pipeline

Se registrarán:

- tiempo de build;
- tiempo de despliegue;
- fallos;
- rollback;
- duración de pruebas.

---

# 25. Métricas DevOps

- frecuencia de despliegues;
- lead time;
- porcentaje de éxito;
- MTTR;
- tiempo medio de rollback.

---

# 26. ADR Relacionadas

ADR-0025 Ubuntu Server

ADR-0026 Sin Docker

ADR-0027 Ansible

ADR-0028 systemd

ADR-0032 Despliegues versionados

---

# 27. Criterios de aceptación

La estrategia DevOps será considerada aprobada cuando:

- todos los despliegues sean automatizados;
- no existan cambios manuales en producción;
- exista rollback automático;
- todas las aplicaciones utilicen systemd;
- exista pipeline CI/CD;
- todas las versiones sean trazables;
- la infraestructura sea reproducible mediante Ansible.
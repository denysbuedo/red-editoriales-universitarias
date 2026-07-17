---
title: Environment Strategy
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
  - 07-Deployment-Architecture.md
---

# Environment Strategy

# 1. Objetivo

Definir la estrategia oficial de entornos de la Plataforma Nacional de Publicaciones Universitarias (PNPU).

Esta estrategia establece:

- los entornos existentes;
- las responsabilidades de cada uno;
- las reglas de promoción entre entornos;
- la gestión de configuraciones;
- la segregación de datos;
- las políticas de despliegue.

El objetivo es garantizar estabilidad, calidad y trazabilidad durante todo el ciclo de vida del software.

---

# 2. Principios

## ENV-001

Cada entorno tendrá un propósito claramente definido.

---

## ENV-002

Nunca se desarrollará directamente sobre Producción.

---

## ENV-003

Toda promoción entre entornos será controlada.

---

## ENV-004

Las configuraciones serán independientes.

---

## ENV-005

Los datos de Producción nunca se utilizarán directamente en Desarrollo.

---

## ENV-006

Los despliegues deberán ser reproducibles.

---

# 3. Entornos

La PNPU utilizará cuatro entornos principales.

```text
Desarrollo

↓

QA

↓

Preproducción

↓

Producción
```

---

# 4. Desarrollo (DEV)

## Objetivo

Desarrollo diario.

## Usuarios

- desarrolladores.

## Características

- cambios frecuentes;
- datos de prueba;
- despliegues continuos;
- integración con GitHub.

## Restricciones

No se utilizarán datos reales.

---

# 5. QA

## Objetivo

Validación funcional y técnica.

## Usuarios

- QA;
- arquitectos;
- analistas.

## Características

- pruebas funcionales;
- pruebas de integración;
- pruebas de regresión;
- validación de APIs.

---

# 6. Preproducción (PRE)

## Objetivo

Validación final antes de Producción.

## Debe reproducir

- infraestructura;
- configuración;
- versiones;
- topología;
- HAProxy;
- PostgreSQL;
- Omeka.

Las diferencias con Producción deberán ser mínimas.

---

# 7. Producción (PROD)

## Objetivo

Servicio oficial.

## Restricciones

- acceso restringido;
- despliegues controlados;
- cambios auditados;
- monitorización permanente.

---

# 8. Flujo de promoción

```text
Feature

↓

DEV

↓

QA

↓

PRE

↓

PROD
```

No se permitirán promociones directas entre DEV y PROD.

---

# 9. Configuración

Cada entorno tendrá:

- variables propias;
- URLs propias;
- bases de datos independientes;
- secretos independientes;
- certificados propios cuando aplique.

Las configuraciones se almacenarán fuera del código.

Ubicación sugerida:

```text
/etc/pnpu/
```

---

# 10. Bases de datos

Cada entorno utilizará una base de datos independiente.

Ejemplo:

| Entorno | Base de datos |
|----------|---------------|
| DEV | pnpu_dev |
| QA | pnpu_qa |
| PRE | pnpu_pre |
| PROD | pnpu_prod |

Nunca se compartirán bases de datos entre entornos.

---

# 11. Storage

Los archivos de cada entorno permanecerán aislados.

Ejemplo:

```text
/storage/dev/

/storage/qa/

/storage/pre/

/storage/prod/
```

---

# 12. Usuarios

Los usuarios administrativos serán independientes.

No deberán compartirse credenciales entre entornos.

---

# 13. Secretos

Cada entorno tendrá:

- JWT Secret;
- credenciales PostgreSQL;
- credenciales Redis;
- SMTP;
- API Keys.

Nunca se reutilizarán secretos entre entornos.

---

# 14. Variables

Ejemplo:

```text
/etc/pnpu/

portal-dev.env

portal-qa.env

portal-pre.env

portal-prod.env
```

---

# 15. Versiones

Cada entorno deberá conocer:

- versión instalada;
- commit Git;
- fecha de despliegue;
- operador.

---

# 16. Promoción

Una versión podrá avanzar al siguiente entorno únicamente si:

- supera pruebas automáticas;
- supera pruebas funcionales;
- supera revisión técnica;
- no presenta vulnerabilidades críticas.

---

# 17. Datos

## Desarrollo

Datos sintéticos.

---

## QA

Datos anonimizados o sintéticos.

---

## Preproducción

Datos representativos anonimizados.

---

## Producción

Datos oficiales.

---

# 18. Sincronización

La configuración de infraestructura se mantendrá sincronizada mediante Ansible.

Las diferencias deberán limitarse a:

- variables;
- secretos;
- capacidad;
- dominios.

---

# 19. Accesos

| Rol | DEV | QA | PRE | PROD |
|------|-----|----|------|------|
| Desarrollador | RW | R | - | - |
| QA | R | RW | R | - |
| Arquitecto | RW | RW | RW | R |
| DevOps | RW | RW | RW | RW |
| Infraestructura | RW | RW | RW | RW |

---

# 20. Monitorización

Todos los entornos dispondrán de:

- health checks;
- logs;
- métricas.

Producción tendrá además:

- alertas;
- dashboards completos;
- auditoría permanente.

---

# 21. Estrategia de ramas

| Rama | Entorno |
|-------|----------|
| feature/* | DEV |
| release/* | QA / PRE |
| main | PROD |
| hotfix/* | PRE → PROD |

---

# 22. Estrategia de despliegue

| Entorno | Método |
|----------|--------|
| DEV | Automático |
| QA | Automático |
| PRE | Manual aprobado |
| PROD | Manual aprobado + ventana de mantenimiento cuando corresponda |

---

# 23. Validaciones

Antes de promover una versión se comprobará:

- build correcto;
- pruebas unitarias;
- pruebas de integración;
- análisis estático;
- escaneo de seguridad;
- migraciones;
- health checks.

---

# 24. Auditoría

Toda promoción registrará:

- versión;
- commit;
- origen;
- destino;
- operador;
- fecha;
- resultado.

---

# 25. Riesgos

| Riesgo | Mitigación |
|---------|------------|
| Configuración distinta | Ansible |
| Datos reales en DEV | Prohibido |
| Secretos compartidos | Secretos independientes |
| Promoción accidental | Aprobaciones obligatorias |
| Diferencias PRE/PROD | Infraestructura equivalente |

---

# 26. ADR Relacionadas

ADR-0042 – Estrategia de Entornos.

ADR-0043 – Gestión de Configuración.

ADR-0044 – Promoción entre Entornos.

---

# 27. Criterios de aceptación

La estrategia de entornos será considerada aprobada cuando:

- existan entornos claramente definidos;
- las configuraciones sean independientes;
- las bases de datos estén separadas;
- los secretos no se compartan;
- las promociones sean controladas;
- los despliegues sean auditables;
- Producción permanezca protegida frente a cambios directos.
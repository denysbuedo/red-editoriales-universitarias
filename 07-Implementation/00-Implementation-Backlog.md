---
title: Implementation Backlog
version: 1.0
status: Approved
owner: Ministerio de Educación Superior
project: Plataforma Nacional de Publicaciones Universitarias (PNPU)
authors:
  - Equipo de Arquitectura
last_update: 2026-07-15
---

# 1. Objetivo

Este documento define el backlog maestro de implementación de la Plataforma Nacional de Publicaciones Universitarias (PNPU).

Su propósito es transformar la arquitectura aprobada en un conjunto de entregables ejecutables por el equipo de desarrollo.

No sustituye la documentación de arquitectura; actúa como puente entre el diseño y la implementación.

---

# 2. Principios

Toda tarea deberá:

- implementar una única responsabilidad;
- poder desarrollarse de forma independiente;
- ser verificable;
- tener criterios de aceptación claros;
- mantener la arquitectura aprobada;
- incluir pruebas automatizadas cuando corresponda.

---

# 3. Estrategia de Releases

| Release | Objetivo | Estado |
|----------|----------|--------|
| Release 0 | Fundación técnica | Pendiente |
| Release 1 | Núcleo del dominio editorial | Pendiente |
| Release 2 | Portal público y catálogo | Pendiente |
| Release 3 | Integraciones y observatorio | Pendiente |
| Release 4 | Optimización y capacidades avanzadas | Pendiente |

---

# 4. Release 0 – Fundación Técnica

Objetivo:

Construir la base técnica del proyecto sin implementar funcionalidades de negocio.

Entregables principales:

- repositorio inicial;
- estructura de carpetas;
- configuración del monorepo;
- Next.js;
- TypeScript;
- Tailwind CSS;
- ESLint;
- Prettier;
- Husky;
- Commitlint;
- GitHub Actions;
- MkDocs;
- configuración de pruebas;
- configuración de calidad;
- documentación inicial.

Resultado esperado:

Un proyecto ejecutable, compilable y listo para recibir funcionalidades.

---

# 5. Release 1 – Dominio Editorial

Objetivo:

Implementar el núcleo funcional del dominio.

Backlog detallado:

- `07-Implementation/01-Release-1-Domain-Backlog.md`

Componentes:

- Editoriales;
- Universidades;
- Colecciones;
- Publicaciones;
- Autores;
- Contribuyentes;
- Taxonomías;
- Identificadores;
- APIs del dominio.

Resultado esperado:

Modelo de dominio completamente operativo y probado.

---

# 6. Release 2 – Portal Público

Objetivo:

Construir la experiencia pública del usuario.

Incluye:

- Página principal;
- Catálogo;
- Navegación;
- Búsqueda;
- SEO;
- Accesibilidad;
- Internacionalización;
- Consumo de APIs.

Resultado esperado:

Portal navegable con acceso al catálogo editorial.

---

# 7. Release 3 – Integraciones

Objetivo:

Conectar la PNPU con los sistemas externos.

Incluye:

- Integración con el Sistema de Gestión de Editoriales;
- Integración con Omeka S;
- Sincronización de metadatos;
- Eventos de dominio;
- APIs públicas.

Resultado esperado:

Ecosistema integrado y sincronizado.

---

# 8. Release 4 – Plataforma Avanzada

Objetivo:

Completar las capacidades estratégicas.

Incluye:

- Observatorio Editorial;
- Analítica;
- OpenSearch (si aplica);
- Recomendaciones;
- Optimizaciones de rendimiento;
- Monitorización avanzada.

Resultado esperado:

Plataforma preparada para operación nacional.

---

# 9. Dependencias

```text
Release 0
      │
      ▼
Release 1
      │
      ▼
Release 2
      │
      ▼
Release 3
      │
      ▼
Release 4
```

No se iniciará una release hasta que los criterios de aceptación de la anterior estén cumplidos.

---

# 10. Definition of Done

Una tarea se considerará finalizada cuando:

- el código compile sin errores;
- las pruebas pasen correctamente;
- se respeten los estándares definidos;
- exista documentación actualizada;
- el análisis estático no reporte errores críticos;
- se hayan realizado las revisiones de código correspondientes;
- se cumplan los criterios de aceptación.

---

# 11. Gestión del Backlog

Cada release se descompondrá en documentos independientes ubicados en su carpeta correspondiente.

Cada documento describirá:

- objetivo;
- alcance;
- dependencias;
- referencias arquitectónicas;
- tareas;
- criterios de aceptación;
- entregables;
- pruebas requeridas.

---

# 12. Priorización

Las tareas seguirán este orden:

1. Infraestructura y calidad.
2. Dominio.
3. APIs.
4. Persistencia.
5. Integraciones.
6. Interfaz de usuario.
7. Optimización.

---

# 13. Riesgos

| Riesgo | Mitigación |
|---------|------------|
| Implementación fuera de la arquitectura | Referenciar siempre los documentos de arquitectura |
| Tareas demasiado grandes | Dividir en unidades de 1–2 días |
| Cambios no controlados | Pull Requests y revisiones técnicas |
| Retrasos | Releases incrementales y entregables verificables |

---

# 14. Criterios de aceptación

El backlog maestro será considerado aprobado cuando:

- todas las releases estén definidas;
- exista una secuencia clara de implementación;
- las dependencias estén identificadas;
- cada release pueda descomponerse en tareas ejecutables;
- el equipo de desarrollo pueda comenzar la implementación sin redefinir la arquitectura.

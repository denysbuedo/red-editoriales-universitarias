---
title: Performance and Scalability
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
  - 05-Observability.md
  - 07-Deployment-Architecture.md
  - 08-Environment-Strategy.md
---

# Performance and Scalability

# 1. Objetivo

Definir la estrategia de rendimiento y escalabilidad de la Plataforma Nacional de Publicaciones Universitarias (PNPU).

La estrategia busca:

- mantener tiempos de respuesta estables;
- permitir el crecimiento gradual;
- optimizar el uso de recursos;
- garantizar una experiencia de usuario consistente;
- facilitar la ampliación de la infraestructura sin rediseñar la arquitectura.

---

# 2. Principios

## PERF-001

Escalar horizontalmente cuando sea posible.

---

## PERF-002

Escalar verticalmente únicamente cuando sea necesario.

---

## PERF-003

Reducir accesos innecesarios a bases de datos.

---

## PERF-004

Toda optimización deberá medirse antes y después de aplicarse.

---

## PERF-005

No optimizar prematuramente.

Las decisiones deberán basarse en métricas reales.

---

# 3. Estrategia General

La escalabilidad de la PNPU se basa en cuatro niveles:

1. Optimización de la aplicación.
2. Uso de caché.
3. Balanceo de carga.
4. Escalado horizontal.

---

# 4. Arquitectura de Escalabilidad

```text
Usuarios
      │
      ▼
HAProxy
   │      │
   ▼      ▼
Portal 1  Portal 2
   │      │
   └──┬───┘
      ▼
 PostgreSQL
      │
      ▼
 Redis
      │
      ▼
 Omeka S
```

El Portal podrá escalar horizontalmente sin modificar la arquitectura.

---

# 5. Objetivos de Rendimiento

| Servicio | Objetivo inicial |
|----------|------------------|
| Portal | TTFB < 500 ms |
| API | < 400 ms |
| Búsqueda | < 1 s |
| Omeka | < 2 s |
| Login | < 2 s |

Los objetivos deberán revisarse anualmente.

---

# 6. Estrategia de Caché

## Portal

- Caché de páginas estáticas.
- Incremental Static Regeneration (ISR) cuando aplique.
- Caché HTTP.

## Redis

Se utilizará para:

- respuestas frecuentes;
- sesiones técnicas;
- rate limiting;
- locks;
- datos efímeros.

Redis nunca será la fuente de verdad.

---

# 7. Optimización de Base de Datos

Las siguientes prácticas serán obligatorias:

- índices adecuados;
- consultas parametrizadas;
- análisis periódico de consultas lentas;
- uso de vistas materializadas cuando aporte valor;
- mantenimiento de estadísticas.

No se permitirá acceso directo desde el frontend.

---

# 8. Búsqueda

## Release 1

PostgreSQL Full Text Search.

## Evolución

OpenSearch cuando se cumpla alguno de los siguientes criterios:

- crecimiento significativo del catálogo;
- necesidad de facetas complejas;
- autocompletado avanzado;
- relevancia configurable;
- búsqueda semántica.

---

# 9. Escalabilidad del Portal

El Portal será completamente **stateless**.

Esto permitirá:

- múltiples instancias;
- balanceo mediante HAProxy;
- despliegues Rolling;
- sustitución rápida de nodos.

Los archivos persistentes no se almacenarán en el disco local del Portal.

---

# 10. Escalabilidad de Omeka S

Inicialmente:

- una instancia.

Evolución:

- separar base de datos;
- separar almacenamiento;
- balancear múltiples nodos web si la carga lo requiere.

---

# 11. Escalabilidad de PostgreSQL

Estrategia:

### R1

Instancia única.

### R2

Réplicas de lectura.

### R3

Alta disponibilidad.

### R4

Optimización avanzada y particionado si fuera necesario.

---

# 12. Escalabilidad de Redis

### Inicial

Instancia única.

### Evolución

- réplica;
- Sentinel;
- cluster únicamente si se justifica.

---

# 13. Escalabilidad del Storage

El almacenamiento deberá:

- permitir ampliación sin afectar a las aplicaciones;
- soportar crecimiento del catálogo;
- separar sistema operativo y datos.

---

# 14. Balanceo

HAProxy será responsable de:

- distribuir tráfico;
- detectar fallos;
- retirar nodos no saludables;
- reincorporar nodos recuperados.

---

# 15. Optimización Frontend

El Portal aplicará:

- compresión;
- lazy loading;
- optimización de imágenes;
- división de código (code splitting);
- precarga selectiva;
- caché de recursos estáticos.

---

# 16. Optimización Backend

Se priorizará:

- minimizar llamadas redundantes;
- reducir consultas repetidas;
- reutilizar conexiones;
- procesamiento asíncrono cuando sea apropiado.

---

# 17. Estrategia de Escalado

## Vertical

Aumentar CPU, RAM o almacenamiento.

Aplicable a:

- PostgreSQL;
- Omeka;
- OpenSearch.

## Horizontal

Agregar nuevas VMs.

Aplicable a:

- Portal;
- Observatorio;
- futuros servicios de API.

---

# 18. Pruebas de Carga

Antes de cada Release mayor se ejecutarán pruebas que incluyan:

- carga normal;
- carga pico;
- estrés;
- resistencia (soak test).

Se documentarán:

- tiempos de respuesta;
- consumo de CPU;
- memoria;
- errores;
- throughput.

---

# 19. KPIs

## Portal

- Tiempo medio de respuesta.
- Latencia p95.
- Latencia p99.
- Usuarios concurrentes.
- Errores 5xx.

## PostgreSQL

- Consultas lentas.
- Uso de CPU.
- Conexiones.
- Locks.

## Redis

- Hit Ratio.
- Memoria.
- Evicciones.

## Omeka

- Tiempo medio de respuesta.
- Recursos servidos.

---

# 20. Cuándo Escalar

Se evaluará el escalado cuando ocurra alguno de los siguientes eventos:

- CPU sostenida > 70 %.
- RAM sostenida > 80 %.
- Disco > 80 %.
- Latencia p95 superior al objetivo.
- Errores 5xx crecientes.
- Saturación de conexiones.
- Aumento sostenido del tráfico.

---

# 21. Riesgos

| Riesgo | Mitigación |
|---------|------------|
| Crecimiento del catálogo | OpenSearch y storage escalable |
| Sobrecarga de PostgreSQL | Réplicas e índices |
| Saturación del Portal | Nuevas instancias detrás de HAProxy |
| Consumo excesivo de memoria | Monitorización y tuning |
| Consultas ineficientes | Revisión periódica y optimización |

---

# 22. Roadmap

## Release 1

- Portal único.
- PostgreSQL.
- Redis.
- PostgreSQL FTS.

## Release 2

- Segunda instancia del Portal.
- Optimización de consultas.
- Mayor uso de caché.

## Release 3

- OpenSearch.
- Réplicas PostgreSQL.
- Observatorio escalable.

## Release 4

- Búsqueda semántica.
- Recomendaciones.
- Optimización basada en analítica de uso.

---

# 23. ADR Relacionadas

- ADR-0045 – Estrategia de Rendimiento.
- ADR-0046 – Escalabilidad Horizontal.
- ADR-0047 – Política de Caché.
- ADR-0048 – Evolución del Motor de Búsqueda.

---

# 24. Criterios de aceptación

La estrategia de rendimiento y escalabilidad será considerada aprobada cuando:

- existan objetivos de rendimiento definidos;
- la arquitectura permita escalar el Portal horizontalmente;
- se establezcan criterios claros para escalar PostgreSQL, Redis y Omeka;
- la política de caché esté documentada;
- se definan pruebas de carga;
- los KPIs sean medibles;
- los umbrales de escalado estén documentados.
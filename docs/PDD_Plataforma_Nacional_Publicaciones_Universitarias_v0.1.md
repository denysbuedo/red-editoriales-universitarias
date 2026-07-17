
# PRODUCT DEFINITION DOCUMENT (PDD)
# Plataforma Nacional de Publicaciones Universitarias de Cuba (PNPU)

**Versión:** 0.1  
**Estado:** Documento de definición del producto  
**Organismo:** Ministerio de Educación Superior (MES)

---

# 1. Propósito

La Plataforma Nacional de Publicaciones Universitarias de Cuba (PNPU) es la iniciativa tecnológica destinada a integrar, descubrir, difundir y preservar la producción editorial de las universidades cubanas.

La plataforma **no sustituye** los sistemas existentes de las editoriales. Su propósito es conectarlos mediante una arquitectura federada, basada en estándares abiertos y APIs.

La PNPU tendrá como principal puerta de entrada el **Portal de la Red Nacional de Editoriales Universitarias (RNEU)**.

---

# 2. El problema

Actualmente la producción editorial universitaria presenta:

- Catálogos distribuidos.
- Sitios web heterogéneos.
- Baja visibilidad internacional.
- Escasa interoperabilidad.
- Ausencia de un buscador nacional.
- Dificultad para generar estadísticas consolidadas.

El problema no es la inexistencia de un portal.

**El problema es la inexistencia de un ecosistema nacional para descubrir la producción editorial universitaria.**

---

# 3. Visión

Construir la infraestructura digital de referencia para la producción editorial universitaria cubana.

La plataforma permitirá que cualquier persona pueda descubrir libros, autores, editoriales y colecciones desde un único punto de acceso, manteniendo la autonomía de cada institución.

---

# 4. Misión

Facilitar la publicación, descubrimiento, consulta y difusión de las publicaciones universitarias mediante una plataforma interoperable, abierta, accesible y sostenible.

---

# 5. Propuesta de valor

## Para el MES

- Visión nacional del ecosistema editorial.
- Indicadores consolidados.
- Mayor presencia institucional.

## Para las Editoriales

- Mayor visibilidad.
- Catálogo nacional.
- Integración sin perder identidad.

## Para los Investigadores

- Descubrimiento rápido.
- Acceso centralizado.
- Mejor citación.

## Para los Estudiantes

- Un único punto de búsqueda.
- Recursos confiables.

---

# 6. ¿Qué ES la PNPU?

La PNPU es:

- una plataforma digital nacional;
- un catálogo federado;
- un punto de descubrimiento;
- una capa de integración mediante APIs;
- una infraestructura para la difusión del conocimiento.

No es:

- un ERP;
- un LMS;
- un sistema de flujo editorial;
- un sustituto de Omeka;
- un reemplazo del sistema de gestión de editoriales.

---

# 7. Ecosistema del producto

```
                    PNPU

      ┌────────────────────────────────┐
      │ Portal Público RNEU            │
      └────────────────────────────────┘
                 ▲
      ┌──────────┴──────────┐
      │                     │
 API Editoriales      API Omeka S
      │                     │
 Sistema Gestión     Libros / Autores
 Editoriales         Colecciones
```

---

# 8. Módulos del producto

## Descubrir

- Libros
- Autores
- Editoriales
- Colecciones
- Universidades

## Publicar

- Novedades
- Catálogos
- Recursos

## Conectar

- APIs
- Omeka
- Repositorios
- Bibliotecas

## Analizar

- Indicadores
- Estadísticas
- Descargas
- Tendencias

## Gobernar

- Usuarios
- Permisos
- Configuración
- Administración RNEU

---

# 9. Personas

## Investigador

Objetivo:
Encontrar publicaciones confiables para investigación.

Necesidades:

- búsqueda avanzada;
- descarga;
- citas;
- metadatos.

---

## Director Editorial

Objetivo:

Dar visibilidad al catálogo de su editorial.

Necesidades:

- actualizar información institucional;
- publicar novedades;
- consultar estadísticas.

---

## Bibliotecario

Objetivo:

Localizar publicaciones y metadatos normalizados.

---

## Estudiante

Objetivo:

Encontrar bibliografía confiable.

---

## Administrador MES

Objetivo:

Conocer el estado del ecosistema editorial mediante indicadores.

---

# 10. Customer Journey

## Descubrir un libro

Google
→ Portal PNPU
→ Libro
→ Editorial
→ Descarga / Repositorio

## Publicar un libro

Editorial
→ Omeka S
→ API
→ Portal PNPU
→ Buscador
→ Usuario

---

# 11. MVP

Release inicial:

- Portal institucional.
- Directorio de editoriales.
- Integración API Editoriales.
- Catálogo Omeka.
- Buscador.
- Noticias.

---

# 12. Roadmap

## Release 1

Portal institucional.

## Release 2

Libros.

Autores.

Colecciones.

## Release 3

Indicadores.

Dashboard.

SEO avanzado.

## Release 4

API pública.

OAI-PMH.

IIIF.

Google Scholar.

---

# 13. KPIs

- Editoriales integradas.
- Libros indexados.
- Autores registrados.
- Colecciones publicadas.
- Tiempo medio de búsqueda.
- Descargas.
- Usuarios únicos.
- Páginas indexadas.

---

# 14. Riesgos

- Calidad desigual de metadatos.
- Duplicidad de autores.
- APIs incompletas.
- Baja actualización de catálogos.
- Falta de gobernanza.

---

# 15. Factores críticos de éxito

1. APIs estables.
2. Omeka S correctamente modelado.
3. Gobierno de datos.
4. Compromiso de las editoriales.
5. SEO desde el primer día.
6. Diseño centrado en el usuario.
7. Arquitectura escalable.

---

# 16. Decisiones estratégicas

- Mantener la RNEU como identidad institucional.
- Situar los libros en el centro de la experiencia.
- Arquitectura federada.
- API First.
- Software Libre.
- Omeka S como catálogo nacional.
- Sistema actual como fuente maestra de editoriales.

---

# 17. Próximos documentos

1. Arquitectura Funcional.
2. Arquitectura de Software.
3. Modelo de Datos.
4. APIs.
5. UX/UI.
6. Infraestructura.
7. Gobierno del dato.

---

# Observación del arquitecto

La mayor innovación de esta propuesta no es tecnológica.

Consiste en cambiar el paradigma del proyecto:

**de un portal institucional a una plataforma nacional para el descubrimiento del conocimiento universitario.**

Ese cambio permitirá que el proyecto evolucione durante muchos años sin perder coherencia arquitectónica.

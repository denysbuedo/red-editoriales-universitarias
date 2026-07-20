# Propuesta de registro editorial e importacion de publicaciones

Estado: Propuesta operativa pendiente de aprobacion  
Fecha: 2026-07-19  
Alcance: Datos institucionales de editoriales, libros en edicion e importacion anual de libros publicados

## 1. Objetivo

Incorporar al trabajo de PNPU los documentos operativos entregados por responsables editoriales,
sin cambiar la arquitectura aprobada ni convertir el portal en un sistema de gestion editorial.

La propuesta aprovecha dos principios expresados por el responsable editorial:

- compatibilizar los datos institucionales con el registro oficial actualizado por la Oficina
  Nacional de ISBN;
- reutilizar el formato solicitado por la Camara Cubana del Libro para la Feria Internacional del
  Libro, evitando capturas duplicadas.

## 2. Criterio arquitectonico

Los datos institucionales de las editoriales no deben tener a Omeka S como fuente principal.

La arquitectura PNPU ya separa responsabilidades:

| Dominio | Fuente esperada |
|---|---|
| Editoriales y universidades | Sistema de Gestion de Editoriales |
| Publicaciones, colecciones, autores, materias y recursos digitales | Omeka S |
| Descubrimiento publico | Portal PNPU |

Por tanto:

- PNPU puede mostrar editoriales con mas metadatos que los actuales;
- esos datos deben llegar por API desde el Sistema de Gestion de Editoriales cuando exista;
- Omeka S puede mantener referencias bibliograficas hacia editoriales, pero no gobernar el registro
  institucional oficial;
- cualquier carga temporal desde documentos debe considerarse diagnostico o migracion controlada,
  no fuente maestra permanente.

## 3. Datos institucionales propuestos para editoriales

Los documentos analizados proponen ampliar el perfil de editorial con:

- nombre de la editorial;
- institucion u organo al que pertenece;
- direccion;
- telefonos de contacto;
- correos electronicos;
- representante legal;
- responsable del ISBN;
- fecha de fundacion;
- sitio web;
- catalogo o repositorio;
- proyectos I+D relacionados.

Estos campos pueden mostrarse en la ficha publica de editorial, pero su fuente oficial debe ser el
Sistema de Gestion de Editoriales.

## 4. Libros en proceso de edicion

Los libros en proceso de edicion no deben modelarse como `Publication` publica.

Razon:

- pueden no tener fecha final de publicacion;
- pueden no tener ISBN definitivo;
- pueden no tener recurso digital;
- pueden no tener licencia aprobada;
- pueden cambiar titulo, autores, formato o editorial antes de publicarse.

El lugar correcto para estos datos es un flujo operativo de gestion editorial, aun no implementado.
Ese flujo podria vivir en un bounded context futuro, por ejemplo:

- `EditorialWorkflow`;
- `PublicationDraft`;
- `EditorialWork`;
- `WorkInProgress`.

Hasta que arquitectura lo apruebe, PNPU no debe publicar esos registros en el catalogo publico.

## 5. Libros publicados

La tabla anual de libros publicados si puede alimentar un proceso de importacion, siempre en modo
validado.

Columnas observadas:

| Columna | Uso posible |
|---|---|
| `isbn` | Identificador bibliografico |
| `Titulo: subtitulo` | Titulo y posible subtitulo |
| `Primer autor o coordinador` | Contribuidor principal |
| `Editorial` | Referencia a Publisher institucional |
| `Genero / Tipo de publicacion` | Vocabulario pendiente de decision |
| `Formato` | Formatos o recursos esperados |
| `Fecha` | Fecha o ano de publicacion |

La tabla no contiene todos los campos obligatorios para publicar directamente en PNPU.

## 6. Campos faltantes para publicacion PNPU completa

Para convertirse en `Publication` publica, cada registro necesita completar o derivar:

- UUID PNPU;
- idioma;
- materias controladas;
- licencia;
- recurso digital con URL;
- resumen, cuando sea posible;
- coleccion, cuando aplique;
- DOI o URI persistente, si existe;
- contribuyentes adicionales, si aplica;
- mapeo confiable a una editorial institucional.

Sin esos datos, el registro puede diagnosticarse, pero no debe entrar automaticamente al catalogo
publico.

## 7. Vocabularios pendientes

El campo `Genero / Tipo de publicacion` requiere decision de gobierno de datos.

Valores observados:

- Libros Universitarios;
- Cursos en Congresos;
- Libros de Interes General;
- Libro;
- Libros de Ficcion;
- Monografias;
- Libros de Referencia;
- Guias de Estudio;
- Presentaciones;
- Poesia.

Opciones:

| Opcion | Ventaja | Inconveniente |
|---|---|---|
| Mapearlo a `Publication.type` | Simple y visible | Mezcla genero, finalidad y forma editorial |
| Crear vocabulario `genre` | Mas correcto bibliograficamente | Requiere extender modelo/API |
| Crear categoria editorial PNPU | Util para reportes nacionales | Requiere decision de taxonomia |

Recomendacion: no modificar el modelo hasta aprobar si este campo sera tipo, genero o categoria.

## 8. Formatos y recursos digitales

El campo `Formato` puede contener multiples valores, por ejemplo `epub, pdf`.

No debe almacenarse solamente como texto libre cuando existan recursos digitales reales. Debe
mapearse a recursos:

- PDF;
- EPUB;
- MOBI;
- otros formatos aprobados.

Si la tabla solo declara el formato pero no la URL del archivo, el importador debe reportar que el
registro requiere enriquecimiento antes de publicarse.

## 9. Proceso propuesto

1. La editorial entrega la tabla anual de libros publicados.
2. PNPU ejecuta un diagnostico local de importacion.
3. El diagnostico reporta errores, vacios y vocabularios detectados.
4. La editorial corrige la tabla o completa datos faltantes.
5. Un proceso aprobado transforma los registros validos a Omeka S o al flujo que defina
   arquitectura.
6. PNPU refresca el catalogo desde Omeka S.
7. Los registros completos aparecen en el portal publico.

## 10. Primer incremento implementable

Crear un comando de diagnostico:

```bash
npm run publications:import-check -- Readme/Listado_Libro_Publicados_EDUNIV.xlsx
```

El comando debe:

- leer la hoja `EDUNIV`;
- contar registros;
- validar ISBN;
- detectar campos vacios;
- mostrar una muestra de filas concretas con campos vacios;
- detectar ISBN duplicados;
- clasificar fechas como ano, mes/ano o fecha ISO;
- listar editoriales, generos, formatos y fechas;
- reportar campos faltantes para PNPU;
- no escribir en Omeka;
- no escribir en PostgreSQL;
- no publicar registros.

Observacion sobre la tabla EDUNIV analizada:

- la columna `Fecha` aparece como ano de publicacion en los registros bibliograficos;
- los campos de mes/ano corresponden mejor al flujo de libros en proceso de edicion;
- el diagnostico debe aceptar ambos formatos, pero reportarlos por separado para que gobierno de datos
  pueda decidir la normalizacion final.

## 11. Criterios de aceptacion

- El diagnostico funciona sin red externa.
- No requiere Docker.
- No almacena secretos.
- No modifica datos.
- Reporta salida legible y salida JSON opcional.
- Tiene una autoprueba local del parser.
- La documentacion explica limites y decisiones pendientes.

## 12. Endpoint operativo de diagnostico

El diagnostico tambien queda expuesto como endpoint administrativo:

```http
POST /api/admin/publication-imports/diagnose
X-PNPU-Admin-Token: <token>
Content-Type: application/json
```

```json
{
  "sourcePath": "Listado_Libro_Publicados_EDUNIV.xlsx",
  "sheet": "EDUNIV"
}
```

Configuracion:

- `PNPU_PUBLICATION_IMPORT_TOKEN`: token operativo requerido para ejecutar el diagnostico;
- `PNPU_PUBLICATION_IMPORT_ROOT`: directorio local permitido para archivos XLSX, por defecto `Readme`.

Restricciones:

- solo acepta rutas relativas;
- solo acepta archivos `.xlsx`;
- rechaza rutas fuera del directorio permitido;
- no escribe datos en Omeka S;
- no escribe datos en PostgreSQL;
- devuelve un lote con estado `diagnosed`, `needs_correction`, `ready_for_mapping` o `rejected`.

La vista operativa inicial esta disponible en:

```text
/admin/importaciones/publicaciones
```

La vista solicita el archivo XLSX, la hoja y el token administrativo. No almacena el token en el
codigo ni en configuracion del cliente; lo usa solamente para invocar el endpoint protegido.

## 13. Preview de mapeo

Antes de escribir en Omeka S, PNPU expone un preview operativo:

```http
POST /api/admin/publication-imports/mapping-preview
X-PNPU-Admin-Token: <token>
Content-Type: application/json
```

El preview clasifica las filas como:

- `mappable`: fila base lista para transformacion, cuando existan todos los datos necesarios;
- `needs_enrichment`: fila bibliografica valida, pero pendiente de campos PNPU u otros mapeos;
- `rejected`: fila con errores de planilla, ISBN duplicado, campos vacios o fecha invalida.

En el incremento actual, las filas completas de EDUNIV se clasifican como `needs_enrichment`,
porque la tabla no trae idioma, materias controladas, licencia, recurso digital ni autoridad
institucional de editorial. Este paso sigue sin escribir en Omeka S ni PostgreSQL.

La vista administrativa permite exportar una plantilla CSV de enriquecimiento con las filas que
requieren completar datos. La plantilla incluye columnas para:

- autoridad institucional de editorial;
- tipo o genero controlado;
- URL del recurso digital;
- idioma;
- materias controladas;
- licencia;
- notas de correccion.

## 14. Dry-run de importacion enriquecida

Cuando la plantilla CSV vuelve completada, PNPU puede ejecutar un dry-run:

```http
POST /api/admin/publication-imports/dry-run
X-PNPU-Admin-Token: <token>
Content-Type: application/json
```

El cuerpo incluye `sourcePath`, `sheet` y `enrichmentCsv`. El servicio:

- vuelve a generar el preview desde el XLSX fuente;
- cruza las filas por numero de fila;
- valida los campos de enriquecimiento requeridos;
- devuelve candidatos `ready`, `incomplete` o `rejected`;
- no escribe en Omeka S;
- no escribe en PostgreSQL.

Este resultado es la entrada natural para el importador Omeka futuro, cuando arquitectura apruebe la
escritura controlada.

## 15. Paquete final validado

La vista administrativa permite exportar un paquete JSON con los candidatos `ready` del dry-run.

El paquete contiene:

- manifiesto del lote;
- fuente XLSX;
- hoja;
- fecha de generacion;
- conteos de filas listas, incompletas y rechazadas;
- advertencia `validated_not_imported`;
- candidatos listos para un importador futuro.
- fecha de publicacion completa `YYYY-MM-DD`;
- autoridades de contribuyentes para resolver `dcterms:creator`.

Este paquete cierra la etapa actual. Aun no representa una importacion real; es un artefacto
validado para decision operativa y para una futura escritura controlada en Omeka S.

## 16. Marca para retomar

La importacion de publicaciones debe retomarse como candidato principal para la carga inicial
historica de la PNPU.

Razon:

- las editoriales ya existen antes de la plataforma;
- cada editorial posee informacion bibliografica anterior que debe subirse;
- la carga manual registro a registro no escala para el arranque nacional;
- el flujo actual ya permite diagnostico, enriquecimiento, dry-run, paquete validado, plan de
  commit no ejecutado y deteccion de ISBN/DOI existentes contra el catalogo activo.

Pendiente para una etapa posterior:

- aprobar una ADR de escritura controlada hacia Omeka S;
- definir el mapeo final de candidatos `ready` a resource templates PNPU en Omeka S;
- ampliar reglas de deduplicacion contra items existentes para otros identificadores institucionales;
- definir rollback operativo de importacion;
- definir auditoria de lote importado;
- reemplazar el token operativo temporal por autenticacion/autorizacion institucional.

Hasta completar esas decisiones, esta etapa queda cerrada en modo `planned_not_executed`.

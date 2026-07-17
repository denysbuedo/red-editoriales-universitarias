# Manual para responsables de editoriales

## Objetivo

Guiar a los responsables de editoriales universitarias en la carga y correccion de metadatos
bibliograficos dentro de Omeka S para su publicacion en el portal nacional PNPU.

Omeka S es el espacio de trabajo para registrar publicaciones, colecciones, autores, materias y
recursos digitales. El portal PNPU es el sitio publico donde esos datos aparecen despues de ser
validados.

## Responsabilidades de la editorial

Cada editorial debe:

- cargar publicaciones con metadatos completos;
- asociar autores y contribuidores correctamente;
- vincular publicaciones con su editorial y universidad;
- crear o seleccionar colecciones editoriales;
- asignar materias controladas;
- adjuntar recursos digitales;
- corregir errores reportados por el administrador PNPU;
- mantener actualizados contactos, enlaces y datos editoriales cuando corresponda.

La editorial no debe modificar plantillas PNPU, vocabularios ni configuraciones globales de Omeka.

## Conceptos basicos

| Concepto en Omeka | Uso en PNPU |
|---|---|
| Item `PNPU Publication` | Publicacion del catalogo |
| Item `PNPU Contributor` | Autor, editor, revisor u otra persona/entidad participante |
| Item `PNPU Publisher` | Editorial universitaria |
| Item `PNPU University` | Universidad asociada |
| Item `PNPU Subject` | Materia o termino controlado |
| Item Set `PNPU Collection` | Coleccion editorial |
| Media | PDF, EPUB, enlace, cubierta u otro recurso digital |

## Orden recomendado de carga

1. Confirmar que la universidad existe.
2. Confirmar que la editorial existe.
3. Crear o revisar autores y contribuidores.
4. Crear o revisar materias.
5. Crear o revisar colecciones.
6. Crear la publicacion.
7. Adjuntar recursos digitales.
8. Solicitar revision o refresh al administrador PNPU.

Este orden evita publicaciones incompletas o con relaciones rotas.

## Carga de autores y contribuidores

Crear un Item con template `PNPU Contributor`.

Campos recomendados:

- nombre completo;
- nombres;
- apellidos;
- rol;
- ORCID, si existe;
- afiliacion;
- pais;
- biografia breve.

Roles habituales:

- `author`;
- `editor`;
- `scientificEditor`;
- `compiler`;
- `translator`;
- `illustrator`;
- `reviewer`;
- `contributor`;
- `organization`.

Si una persona tiene varios roles, deben registrarse segun la politica definida por PNPU.

## Carga de colecciones

Crear un Item Set con template `PNPU Collection`.

Campos recomendados:

- UUID PNPU;
- titulo;
- editorial responsable;
- descripcion;
- codigo de coleccion;
- serie editorial;
- materias relacionadas.

Una coleccion no es una publicacion. Sirve para agrupar publicaciones relacionadas por linea
editorial, serie, tema o programa.

## Carga de publicaciones

Crear un Item con template `PNPU Publication`.

Campos minimos:

- UUID PNPU;
- titulo;
- fecha de publicacion;
- idioma;
- tipo de publicacion;
- formato;
- editorial;
- autores o contribuidores;
- identificador;
- materia;
- recurso digital asociado.

Campos recomendados:

- subtitulo;
- resumen;
- ISBN;
- DOI;
- licencia;
- palabras clave;
- coleccion;
- cubierta;
- URL publica persistente.

## Identificadores

Usar identificadores reales y revisados:

- ISBN;
- eISBN;
- DOI;
- URI;
- Handle u otro identificador persistente aprobado.

No inventar ISBN ni DOI. Si una publicacion no tiene DOI, puede registrarse ISBN o URI persistente
si la politica PNPU lo permite.

## Materias

Las materias deben seleccionarse de vocabularios controlados o recursos `PNPU Subject` existentes.

Evitar:

- materias escritas de formas distintas para el mismo concepto;
- abreviaturas no aprobadas;
- terminos demasiado generales si existe uno mas preciso;
- errores ortograficos.

Ejemplo correcto:

- `Educacion superior`
- `Ingenieria y tecnologia`
- `Desarrollo local`

## Recursos digitales

Toda publicacion necesita al menos un Media asociado.

Tipos posibles:

- PDF;
- EPUB;
- HTML;
- imagen de cubierta;
- enlace externo;
- audio;
- video;
- otro formato aprobado.

Datos recomendados del recurso:

- tipo;
- URL o archivo;
- formato MIME;
- licencia;
- idioma;
- tamano, si esta disponible;
- checksum, si la politica lo exige.

Si el recurso esta restringido, debe indicarse claramente segun la politica aprobada.

## Licencias

Registrar la licencia cuando sea posible.

Ejemplos:

- Copyright;
- CC BY;
- CC BY-SA;
- CC BY-NC;
- licencia institucional especifica.

No asumir que una publicacion es de acceso abierto si la editorial no lo ha aprobado.

## Revision antes de solicitar publicacion

Antes de pedir al administrador PNPU que refresque el catalogo, revisar:

- el titulo esta completo;
- la fecha es correcta;
- la editorial asociada es la correcta;
- todos los autores estan vinculados;
- existe al menos un identificador;
- existe al menos una materia;
- la coleccion es correcta, si aplica;
- hay al menos un recurso digital;
- el resumen no contiene texto provisional;
- la licencia esta indicada cuando corresponde.

## Como aparece en PNPU

Si el registro es valido, aparecera en:

- catalogo de publicaciones;
- ficha de la publicacion;
- ficha de la editorial;
- ficha de autores o contribuidores;
- ficha de coleccion;
- navegacion por materias;
- API publica y sitemap.

Si no aparece, probablemente falte un campo obligatorio o exista un valor invalido.

## Errores comunes

| Error | Consecuencia |
|---|---|
| Crear publicacion sin template PNPU | PNPU puede ignorarla |
| Escribir editorial como texto libre | PNPU no puede relacionarla correctamente |
| No adjuntar Media | La publicacion puede quedar excluida |
| Usar ORCID invalido | PNPU puede omitir el ORCID |
| No asignar materia | La publicacion puede quedar excluida |
| Crear coleccion como Item en vez de Item Set | La coleccion puede no aparecer |
| Repetir autores con nombres distintos | Se duplica la autoridad |
| Escribir ISBN con errores | El identificador puede ser rechazado |

## Buenas practicas

- Cargar primero autoridades y colecciones.
- Reutilizar autores existentes en vez de duplicarlos.
- Revisar nombres propios antes de publicar.
- Usar titulos y resumenes definitivos.
- Mantener consistencia en materias y palabras clave.
- Adjuntar recursos con nombres claros.
- Consultar al administrador PNPU antes de crear nuevos tipos o campos.

## Solicitud de revision

Despues de cargar o corregir datos, enviar al administrador PNPU:

- editorial responsable;
- titulo de la publicacion;
- coleccion asociada;
- fecha de carga o correccion;
- observaciones relevantes;
- si requiere publicacion inmediata o puede esperar al refresco programado.

El administrador revisara el estado del catalogo y confirmara si la publicacion quedo visible en
PNPU o si requiere correcciones.

## Lo que no debe hacerse

- No crear campos nuevos sin autorizacion.
- No cambiar plantillas PNPU.
- No cargar documentos sin derechos claros.
- No duplicar editoriales, universidades o autores.
- No usar textos temporales como resumen definitivo.
- No borrar recursos compartidos sin coordinacion.
- No guardar claves API o contrasenas dentro de metadatos.


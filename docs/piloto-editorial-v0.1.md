# Piloto editorial v0.1

## Objetivo

Preparar la PNPU para un piloto con 1 o 2 editoriales universitarias que carguen datos iniciales de
publicaciones y validen el flujo completo hasta Omeka S y el portal publico.

## Alcance del Piloto

Incluido:

- carga de XLSX por editorial piloto;
- diagnostico automatico de estructura y calidad minima;
- preview de mapeo PNPU;
- descarga de plantilla de enriquecimiento;
- dry-run con datos enriquecidos;
- plan de commit;
- escritura controlada en Omeka S;
- historial y rollback por lote.

Fuera de alcance:

- edicion directa de metadatos dentro de PNPU;
- workflow completo de libros en proceso editorial;
- publicacion automatica sin revision nacional;
- API externa definitiva de editoriales;
- carga masiva sin validacion por lote.

## Roles

| Rol                    | Responsabilidad                                                    |
| ---------------------- | ------------------------------------------------------------------ |
| Administrador nacional | Configura catalogos, revisa planes y autoriza commit               |
| Coordinador editorial  | Entrega XLSX, corrige errores y valida informacion de su editorial |
| Editor de metadatos    | Completa enriquecimiento, materias, licencias y recursos           |
| Revisor editorial      | Revisa datos antes de commit                                       |

## Flujo Operativo

1. El administrador nacional crea o confirma la editorial piloto en Omeka.
2. Se entrega a la editorial la plantilla XLSX/CSV aprobada.
3. La editorial completa datos de 20 a 50 publicaciones iniciales.
4. En `/admin/importaciones/publicaciones` se sube el XLSX indicando:

```text
Editorial piloto: identificador corto de editorial
Lote: nombre corto del lote
```

5. La plataforma guarda el archivo bajo:

```text
PNPU_PUBLICATION_IMPORT_ROOT/publishers/<editorial>/<lote>/archivo.xlsx
```

6. Se ejecuta diagnostico.
7. Se ejecuta preview de mapeo.
8. Se descarga y completa la plantilla de enriquecimiento.
9. Se ejecuta dry-run.
10. Si no hay errores criticos, se genera plan de commit.
11. El administrador nacional ejecuta escritura en Omeka.
12. Se valida navegacion publica.
13. Se ejecuta backup antes y despues de la escritura.

## Criterios de Aceptacion del Piloto

- Cada editorial piloto carga al menos 20 publicaciones.
- El diagnostico no presenta ISBN invalidos ni campos base vacios.
- Todas las publicaciones tienen editorial, materia, licencia, idioma y recurso digital cuando
  aplique.
- El plan de commit no contiene riesgos bloqueantes.
- Las publicaciones aparecen en `/publicaciones`.
- Los filtros por editorial y materia funcionan.
- La ficha publica muestra ISBN/DOI, licencia, contribuyentes, coleccion y recursos.
- Existe rollback probado para un lote pequeno.

## Pendientes Antes de Abrir a Usuarios Editoriales

- Restringir subida y diagnostico por claim editorial `pnpu_editorial_ids`.
- Reemplazar identificador manual de editorial por selector desde autoridades.
- Agregar historial filtrado por editorial.
- Definir retencion de archivos XLSX subidos.
- Formalizar plantilla oficial con nombres de columnas estables.

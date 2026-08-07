# Piloto editorial v0.1

## Objetivo

Preparar la PNPU para un piloto con 1 o 2 editoriales universitarias que carguen datos iniciales de
publicaciones y validen el flujo completo hasta Omeka S y el portal publico.

## Alcance del Piloto

Incluido:

- carga de XLSX por editorial piloto;
- diagnostico automatico de estructura y calidad minima;
- registro persistente de lotes por editorial;
- preview de mapeo PNPU;
- descarga de plantilla base y plantilla de enriquecimiento;
- dry-run con datos enriquecidos;
- plan de commit;
- escritura controlada en Omeka S;
- historial y rollback por lote;
- cola nacional de revision;
- plan no destructivo de retencion de XLSX cargados.

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
2. El administrador nacional configura en Keycloak el claim `pnpu_editorial_ids` para los usuarios
   responsables de esa editorial.
3. La editorial descarga la plantilla base desde `/admin/importaciones/publicaciones`.
4. La editorial completa datos de 20 a 50 publicaciones iniciales.
5. En `/admin/importaciones/publicaciones` se sube el XLSX indicando:

```text
Editorial piloto: identificador operativo de editorial
Lote: nombre corto del lote
```

El identificador operativo debe coincidir con el claim OIDC `pnpu_editorial_ids` del usuario. La
pantalla muestra sugerencias a partir de autoridades y lotes existentes, pero el valor final lo
gobierna Keycloak.

6. La plataforma guarda el archivo bajo:

```text
PNPU_PUBLICATION_IMPORT_ROOT/publishers/<editorial>/<lote>/archivo.xlsx
```

7. La plataforma registra el lote en el estado operativo persistente bajo
   `PNPU_PUBLICATION_IMPORT_WORKFLOW_DIR`.
8. Se ejecuta diagnostico.
9. Se ejecuta preview de mapeo.
10. Se descarga y completa la plantilla de enriquecimiento PNPU.
11. Se ejecuta dry-run.
12. La editorial envia el lote a revision nacional desde la seccion "Lotes de la editorial".
13. El administrador nacional carga la cola en "Revision nacional" y aprueba o rechaza el lote.
14. Si el lote queda aprobado y no hay errores criticos, se genera plan de commit.
15. El administrador nacional ejecuta escritura en Omeka. La plataforma bloquea el commit si el
    lote no esta en estado `approved`.
16. Se valida navegacion publica.
17. Se ejecuta backup antes y despues de la escritura.
18. Se revisa el plan de retencion para confirmar XLSX vigentes y vencidos.

## Criterios de Aceptacion del Piloto

- Cada editorial piloto carga al menos 20 publicaciones.
- El diagnostico no presenta ISBN invalidos ni campos base vacios.
- Todas las publicaciones tienen editorial, materia, licencia, idioma y recurso digital cuando
  aplique.
- El plan de commit no contiene riesgos bloqueantes.
- Cada lote queda visible en el historial operativo de su editorial.
- El lote cambia a `ready_for_review` antes de la escritura nacional.
- El administrador nacional registra `approved` o `rejected` antes de ejecutar commit.
- Las publicaciones aparecen en `/publicaciones`.
- Los filtros por editorial y materia funcionan.
- La ficha publica muestra ISBN/DOI, licencia, contribuyentes, coleccion y recursos.
- Existe rollback probado para un lote pequeno.
- El endpoint de retencion responde y no elimina archivos automaticamente.

## Plantillas Oficiales

Desde la pantalla administrativa se pueden descargar:

- `Plantilla base`: CSV con columnas `isbn`, `title`, `primaryContributor`, `publisher`,
  `genreOrPublicationType`, `format`, `publicationDate`.
- `Plantilla PNPU`: CSV de enriquecimiento con autoridades, materias, licencia, idioma y recurso
  digital.

Para el piloto, la editorial puede abrir el CSV base en LibreOffice/Excel, completar los datos y
guardar como XLSX antes de subirlo. El nombre de la hoja esperado por defecto es `EDUNIV`.

## Verificacion Rapida Despues de Cada Update

Ejecutar desde el entorno de desarrollo con acceso al dominio publicado:

```powershell
$env:PNPU_PILOT_BASE_URL="https://editorial.reduniv.edu.cu"
$env:PNPU_PILOT_PUBLISHER_ID="editorial-uh"
$env:PNPU_PILOT_IMPORT_TOKEN="TOKEN_LOCAL_SOLO_SI_SIGUE_ACTIVO"
# Alternativa OIDC: $env:PNPU_PILOT_BEARER_TOKEN="ACCESS_TOKEN_DE_KEYCLOAK"
npm run acceptance:pilot-import
```

Si `PNPU_ADMIN_AUTH_MODE=oidc` y el token local ya no esta activo, usar `PNPU_PILOT_BEARER_TOKEN`
con un access token emitido por Keycloak para un usuario nacional con rol `pnpu-admin` o
`pnpu-import-writer`. El script tambien valida cola nacional de revision.

## Estado Antes de Abrir a Usuarios Editoriales

- Keycloak dispone del script operativo `configure-keycloak-editorial-user.sh` para crear o
  actualizar usuarios editoriales, rol y mapper `pnpu_editorial_ids`.
- La pantalla administrativa mantiene identificador manual, pero incorpora sugerencias desde
  autoridades y lotes existentes para reducir errores de captura.
- La retencion se define por `PNPU_PUBLICATION_IMPORT_RETENTION_DAYS` y se valida con
  `/api/admin/publication-imports/retention-plan`.

## Politica Inicial de Retencion

Para el piloto se recomienda:

- `PNPU_PUBLICATION_IMPORT_RETENTION_DAYS=365`;
- no borrar automaticamente archivos desde la aplicacion;
- revisar el plan de retencion despues de cada importacion grande;
- mover o eliminar XLSX vencidos solo mediante procedimiento operativo aprobado.

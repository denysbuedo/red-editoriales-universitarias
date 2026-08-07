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
2. El administrador nacional configura en Keycloak el claim `pnpu_editorial_ids` para los usuarios
   responsables de esa editorial.
3. Se entrega a la editorial la plantilla XLSX/CSV aprobada.
4. La editorial completa datos de 20 a 50 publicaciones iniciales.
5. En `/admin/importaciones/publicaciones` se sube el XLSX indicando:

```text
Editorial piloto: identificador corto de editorial
Lote: nombre corto del lote
```

6. La plataforma guarda el archivo bajo:

```text
PNPU_PUBLICATION_IMPORT_ROOT/publishers/<editorial>/<lote>/archivo.xlsx
```

7. La plataforma registra el lote en el estado operativo persistente bajo
   `PNPU_PUBLICATION_IMPORT_WORKFLOW_DIR`.
8. Se ejecuta diagnostico.
9. Se ejecuta preview de mapeo.
10. Se descarga y completa la plantilla de enriquecimiento.
11. Se ejecuta dry-run.
12. La editorial envia el lote a revision nacional desde la seccion "Lotes de la editorial".
13. El administrador nacional carga la cola en "Revision nacional" y aprueba o rechaza el lote.
14. Si el lote queda aprobado y no hay errores criticos, se genera plan de commit.
15. El administrador nacional ejecuta escritura en Omeka.
16. Se valida navegacion publica.
17. Se ejecuta backup antes y despues de la escritura.

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
con un access token emitido por Keycloak para un usuario con alcance sobre la editorial piloto.

## Pendientes Antes de Abrir a Usuarios Editoriales

- Configurar en Keycloak el mapper que emite `pnpu_editorial_ids` por usuario/grupo editorial.
- Reemplazar identificador manual de editorial por selector desde autoridades.
- Definir retencion de archivos XLSX subidos.
- Formalizar plantilla oficial con nombres de columnas estables.

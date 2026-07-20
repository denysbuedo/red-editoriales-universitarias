# Propuesta de importacion controlada hacia Omeka S

Estado: Propuesta pendiente de aprobacion  
Fecha: 2026-07-19  
Alcance: Carga historica inicial de publicaciones universitarias desde paquetes validados

## 1. Objetivo

Definir el camino tecnico para convertir paquetes `validated_not_imported` en escritura controlada
hacia Omeka S, sin cambiar la arquitectura aprobada y sin convertir PNPU en un sistema de gestion
editorial.

Esta propuesta no habilita importacion real. Documenta la decision pendiente para retomarla.

## 2. Contexto operativo

Las editoriales universitarias existen antes de la PNPU y poseen publicaciones historicas que deben
incorporarse al portal nacional. La carga manual registro a registro no escala para el arranque
nacional.

La etapa actual ya produce:

- diagnostico de XLSX;
- preview de mapeo;
- plantilla CSV de enriquecimiento;
- dry-run de CSV enriquecido;
- paquete JSON con candidatos `ready`;
- manifiesto `validated_not_imported`.
- plan de commit no ejecutado con operaciones proyectadas y riesgos bloqueantes.

## 3. Principio de arquitectura

Omeka S debe seguir siendo la fuente bibliografica del catalogo publico, pero la escritura hacia
Omeka solo debe ocurrir mediante un proceso operativo aprobado, auditable y reversible.

PNPU no debe:

- escribir datos incompletos;
- crear editoriales institucionales como fuente maestra en Omeka;
- deduplicar por heuristicas no documentadas;
- mezclar carga historica con administracion editorial diaria;
- almacenar secretos en codigo.

## 4. Entrada aprobada

El importador futuro solo debe aceptar paquetes JSON generados por el dry-run de PNPU.

Condiciones minimas:

- manifiesto con estado `validated_not_imported`;
- candidatos con decision `ready`;
- `publisherAuthorityId` presente;
- `language` presente;
- `subjects` presentes;
- `license` presente;
- `digitalResourceUrl` presente;
- ISBN normalizado presente;
- tipo o genero controlado presente.

## 5. Flujo propuesto

1. La editorial entrega XLSX historico.
2. PNPU ejecuta diagnostico.
3. PNPU genera preview de mapeo.
4. PNPU exporta plantilla CSV de enriquecimiento.
5. La editorial o el equipo nacional completa datos faltantes.
6. PNPU ejecuta dry-run.
7. PNPU exporta paquete de candidatos `ready`.
8. PNPU genera plan de commit sin escritura.
9. Un operador autorizado revisa operaciones y riesgos.
10. Un operador autorizado ejecuta importacion controlada hacia Omeka S cuando exista ADR.
11. PNPU registra manifiesto de lote importado.
12. PNPU refresca snapshot/catalogo desde Omeka S.

## 6. Deduplicacion requerida

Antes de crear items en Omeka S, el importador debe buscar coincidencias por:

- ISBN normalizado;
- DOI, cuando exista;
- `pnpu:uuid`, cuando exista;
- titulo normalizado + editorial + fecha, solo como advertencia, no como decision automatica.

Resultado posible:

| Resultado | Accion |
|---|---|
| Sin coincidencia | Crear item nuevo |
| Coincidencia exacta por ISBN/DOI | No crear; registrar duplicado |
| Coincidencia dudosa por titulo/editorial/fecha | Retener para revision manual |
| Item existente incompleto | Proponer actualizacion solo si una ADR lo autoriza |

La primera version debe preferir crear nuevos registros solo cuando no exista coincidencia exacta.

## 7. Escritura Omeka propuesta

Para cada candidato `ready`:

- crear Item `PNPU Publication`;
- asignar Resource Template aprobado;
- escribir propiedades bibliograficas;
- enlazar o referenciar editorial por autoridad institucional;
- asociar materias controladas;
- registrar identificadores;
- crear o asociar Media para recurso digital, segun politica aprobada;
- conservar referencia al lote de importacion.

No se debe escribir si falta algun campo obligatorio.

## 8. Auditoria de lote

Cada ejecucion debe producir un manifiesto con:

- identificador de lote;
- operador;
- fecha/hora;
- archivo fuente;
- hash del paquete importado;
- conteos de creados, duplicados, retenidos y fallidos;
- IDs Omeka creados;
- errores por candidato;
- version del importador;
- modo de ejecucion: `dry-run`, `commit` o `rollback`.

## 9. Rollback operativo

La importacion debe poder revertirse por lote.

La primera estrategia aceptable:

- registrar todos los IDs Omeka creados por lote;
- permitir eliminacion controlada solo de items creados por ese lote;
- bloquear rollback si algun item fue modificado manualmente despues de importarse;
- registrar resultado del rollback.

## 10. Seguridad

Requisitos minimos:

- autenticacion institucional o Keycloak antes de produccion;
- permisos separados para diagnosticar, validar y escribir;
- token operativo temporal solo en desarrollo;
- secretos fuera del codigo;
- logs sin claves API;
- limite de tamano para paquetes;
- correlacion de solicitudes.

## 11. Variables futuras

Propuestas, pendientes de aprobacion:

```text
PNPU_OMEKA_IMPORT_ENABLED=false
PNPU_OMEKA_IMPORT_TOKEN=
PNPU_OMEKA_IMPORT_DRY_RUN_ONLY=true
PNPU_OMEKA_IMPORT_MAX_CANDIDATES=500
```

Estas variables no sustituyen autenticacion institucional. Solo describen controles operativos para
entornos tempranos.

## 12. Criterios para implementar

No iniciar escritura real hasta cumplir:

- ADR aprobada para escritura controlada hacia Omeka S;
- mapeo final candidato `ready` -> Resource Templates PNPU;
- deduplicacion aprobada;
- auditoria de lote aprobada;
- rollback probado;
- pruebas unitarias e integracion contra fixtures Omeka;
- ejecucion de `npm run quality` y `npm run build`;
- runbook operativo actualizado.

## 13. Plan de commit implementado

El primer incremento ya implementado es deliberadamente no destructivo:

```http
POST /api/admin/publication-imports/commit-plan
X-PNPU-Admin-Token: <token>
Content-Type: application/json
```

El cuerpo recibe `packageJson`, que debe ser un paquete exportado por el dry-run con manifiesto
`validated_not_imported`.

El servicio:

- rechaza paquetes con estructura invalida;
- rechaza paquetes que no tengan manifiesto `validated_not_imported`;
- rechaza candidatos que no esten en decision `ready`;
- detecta ISBN duplicados dentro del paquete;
- consulta el catalogo activo para detectar publicaciones existentes por ISBN o DOI;
- detecta campos requeridos faltantes;
- devuelve operaciones proyectadas:
  - `createPublicationItem`;
  - `linkPublisher`;
  - `linkSubjects`;
  - `attachDigitalResource`;
  - `recordBatchAudit`;
- no escribe en Omeka S;
- no escribe en PostgreSQL.

Si existen riesgos, el plan queda en estado `blocked`. Si no existen riesgos, queda en
`planned_not_executed`.

El DOI es opcional en el CSV de enriquecimiento. Cuando se informa, el plan de commit lo conserva
en el paquete y lo usa como identificador de deduplicacion contra el catalogo activo.

## 14. Siguiente incremento futuro

Cuando se apruebe la decision, el siguiente incremento debe ser:

- ADR de escritura controlada hacia Omeka S;
- deduplicacion contra Omeka antes de crear items;
- manifiesto de auditoria persistente;
- rollback por lote;
- pruebas de integracion contra fixtures Omeka.

Despues de ese plan se implementaria el commit real.

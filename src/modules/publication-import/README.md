# Publication import module

Modulo operativo para diagnosticar lotes de publicaciones entregados por editoriales.

Este modulo no pertenece al catalogo publico. Su responsabilidad es validar archivos de entrada,
preparar candidatos, ejecutar escritura controlada hacia Omeka S y ejecutar rollback controlado
cuando exista un plan limpio.

- `domain`: entidad `PublicationImportBatch` y reglas de estado del lote.
- `application`: casos de uso de diagnostico, preview, dry-run, commit, auditoria y plan de
  rollback.
- `infrastructure`: adaptadores para diagnostico XLSX, busqueda de duplicados en catalogo,
  escritura/verificacion Omeka y auditoria local.
- `interfaces`: construccion de servicios para entrada HTTP.

El modulo puede leer el catalogo activo para detectar ISBN existentes. Solo escribe en Omeka S
cuando `PNPU_OMEKA_IMPORT_ENABLED=true` y el plan de commit no contiene riesgos bloqueantes. Solo
elimina en Omeka S cuando `PNPU_OMEKA_ROLLBACK_ENABLED=true` y el plan de rollback no contiene
riesgos bloqueantes. No escribe en PostgreSQL ni Redis.

## Politica de carga

El endpoint administrativo de subida acepta archivos `.xlsx` de publicaciones hasta 50 MB. Ese
limite es suficiente para el piloto editorial con plantillas enriquecidas, pero no sustituye una
politica operativa completa de almacenamiento.

Para operacion sostenida se debe mantener:

- cuota por editorial sobre `PNPU_PUBLICATION_IMPORT_ROOT`;
- retencion automatizada de lotes antiguos;
- monitoreo de espacio libre del volumen;
- revision periodica de archivos rechazados o duplicados;
- almacenamiento dedicado para binarios grandes si el flujo crece mas alla de planillas XLSX.

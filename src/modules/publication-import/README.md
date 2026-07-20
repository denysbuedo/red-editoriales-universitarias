# Publication import module

Modulo operativo para diagnosticar lotes de publicaciones entregados por editoriales.

Este modulo no pertenece al catalogo publico. Su responsabilidad es validar archivos de entrada,
preparar candidatos, ejecutar escritura controlada hacia Omeka S y producir planes operativos de
rollback sin eliminacion destructiva.

- `domain`: entidad `PublicationImportBatch` y reglas de estado del lote.
- `application`: casos de uso de diagnostico, preview, dry-run, commit, auditoria y plan de
  rollback.
- `infrastructure`: adaptadores para diagnostico XLSX, busqueda de duplicados en catalogo,
  escritura/verificacion Omeka y auditoria local.
- `interfaces`: construccion de servicios para entrada HTTP.

El modulo puede leer el catalogo activo para detectar ISBN existentes. Solo escribe en Omeka S
cuando `PNPU_OMEKA_IMPORT_ENABLED=true` y el plan de commit no contiene riesgos bloqueantes. No
escribe en PostgreSQL ni Redis. El plan de rollback no elimina recursos; solo devuelve operaciones
proyectadas y riesgos.

# Publication import module

Modulo operativo para diagnosticar lotes de publicaciones entregados por editoriales.

Este modulo no pertenece al catalogo publico. Su responsabilidad es validar archivos de entrada,
preparar candidatos y producir planes operativos antes de cualquier escritura hacia Omeka S.

- `domain`: entidad `PublicationImportBatch` y reglas de estado del lote.
- `application`: casos de uso de diagnostico, preview, dry-run y plan de commit.
- `infrastructure`: adaptadores para diagnostico XLSX y busqueda de duplicados en catalogo.
- `interfaces`: construccion de servicios para entrada HTTP.

El modulo puede leer el catalogo activo para detectar ISBN existentes. No escribe en Omeka S,
PostgreSQL ni Redis. Tampoco publica registros en el catalogo.

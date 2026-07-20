# Publication import module

Modulo operativo para diagnosticar lotes de publicaciones entregados por editoriales.

Este modulo no pertenece al catalogo publico. Su responsabilidad es validar archivos de entrada y
producir un lote de importacion con estado operativo antes de cualquier mapeo hacia Omeka S.

- `domain`: entidad `PublicationImportBatch` y reglas de estado del lote.
- `application`: caso de uso de diagnostico y puerto del lector de planillas.
- `infrastructure`: adaptador que ejecuta el diagnostico XLSX existente.
- `interfaces`: construccion de servicios para entrada HTTP.

El modulo no escribe en Omeka S, PostgreSQL ni Redis. Tampoco publica registros en el catalogo.

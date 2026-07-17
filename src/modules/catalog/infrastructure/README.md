# Catalog infrastructure layer

Contendra adaptadores concretos para Omeka S, PostgreSQL, cache u otras integraciones aprobadas.

Los adaptadores deben implementar puertos definidos por la capa de aplicacion o dominio, sin cambiar
los casos de uso.

El modo `PNPU_CATALOG_REPOSITORY=omeka` permanece bloqueado hasta aprobar el mapeo Omeka S -> PNPU.
La propuesta tecnica actual esta documentada en `docs/omeka-pnpu-mapping-proposal.md`.

`src/modules/catalog/infrastructure/omeka/omeka-json-reader.ts` contiene utilidades defensivas para
leer JSON-LD de Omeka S sin acoplar el dominio al formato externo. Estas utilidades no activan el
adaptador; solo preparan la base para el mapper aprobado.

`omeka-resource-template-classifier.ts` clasifica recursos Omeka segun los Resource Templates PNPU
propuestos y `omeka-quality-report.ts` acumula advertencias/rechazos de calidad para el futuro
mapper. Ambos componentes son preparatorios y no cambian el modo activo del repositorio.

`omeka-catalog-snapshot-loader.ts` pagina Items, Item Sets y Media mediante `OmekaApiClient`,
clasifica los recursos y devuelve un reporte de calidad. Sirve como base del futuro adaptador, pero
no construye entidades de dominio hasta que el mapeo sea aprobado.

# Catalog module

Modulo de catalogo editorial de la PNPU.

La estructura sigue Clean Architecture y Hexagonal Architecture:

- `domain`: reglas puras del dominio editorial.
- `application`: casos de uso, puertos y contratos internos de aplicacion.
- `infrastructure`: adaptadores tecnicos reemplazables.
- `interfaces`: entrada/salida externa, incluyendo HTTP.

El dominio no debe importar Next.js, PostgreSQL, Omeka S ni Redis.

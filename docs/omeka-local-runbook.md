# Omeka S local

Este runbook describe la instalacion local de Omeka S usada para validar la integracion PNPU en
Windows. No sustituye la arquitectura de produccion: produccion sigue definida sobre Ubuntu Server
LTS, Apache o Nginx, PHP, MySQL/MariaDB y systemd, sin Docker.

## Estado local esperado

- Omeka S disponible en `http://127.0.0.1/omeka-s/`.
- Laragon sirve Apache con PHP `8.1`.
- MySQL local contiene la base `pnpu_omeka`.
- La configuracion de credenciales vive en `D:\02.INSTALADORES\omeka-s\config\database.ini`.
- El repositorio PNPU no almacena secretos de Omeka ni de MySQL.

## Variables PNPU

Para que el portal pueda verificar disponibilidad de Omeka S, configurar:

```bash
PNPU_OMEKA_BASE_URL=http://127.0.0.1/omeka-s
PNPU_OMEKA_TIMEOUT_MS=2000
PNPU_CATALOG_REPOSITORY=in-memory
PNPU_OMEKA_PAGE_SIZE=100
PNPU_OMEKA_MAX_PAGES=100
PNPU_OMEKA_REQUIRE_APPROVED_MAPPING=false
```

`PNPU_CATALOG_REPOSITORY=omeka` solo debe usarse despues de instalar el perfil PNPU, cargar datos de
prueba y aceptar explicitamente el mapeo con `PNPU_OMEKA_REQUIRE_APPROVED_MAPPING=true`. El portal
puede consultar salud y diagnosticos de Omeka sin usarlo como fuente del catalogo publico.

## Diagnostico

Ejecutar:

```bash
npm run omeka:check
```

El comando consulta:

- `/api/items`
- `/api/item_sets`
- `/api/media`

La salida es JSON e incluye:

- conteos de Items, Item Sets y Media;
- conteos por Resource Template PNPU;
- plantillas PNPU aun no presentes;
- recursos sin plantilla;
- plantillas no reconocidas por el mapeo PNPU.

Una instalacion recien creada puede responder correctamente y aun reportar todas las plantillas PNPU
como faltantes. Ese estado significa que Omeka esta operativo, pero todavia no esta modelado para
PNPU.

Para revisar si los recursos cargados en Omeka ya tienen plantillas PNPU reconocibles por el
adaptador, ejecutar:

```bash
npm run omeka:map
```

Este comando no requiere clave API porque solo lee la API publica. Reporta conteos por plantilla y si
existen datos minimos para mapear publicaciones y referencias.

## Proximo paso funcional

Configurar en Omeka S los Resource Templates definidos por la propuesta:

- `PNPU Publication`
- `PNPU Contributor`
- `PNPU Publisher`
- `PNPU University`
- `PNPU Collection`
- `PNPU Subject`
- `PNPU Digital Resource`

La definicion exacta de propiedades y obligatoriedad esta en
`schemas/omeka/pnpu-resource-templates.json` y se deriva de
`docs/omeka-pnpu-mapping-proposal.md`. Hasta aprobar esa propuesta, no se debe activar el adaptador
Omeka como repositorio principal del catalogo.

## Carga automatizada del perfil PNPU

Crear una clave API desde el panel de usuario administrador de Omeka S y exportarla solo en la
sesion de terminal:

```bash
PNPU_OMEKA_BASE_URL=http://127.0.0.1/omeka-s
PNPU_OMEKA_KEY_IDENTITY=...
PNPU_OMEKA_KEY_CREDENTIAL=...
```

Revisar primero las acciones sin escribir:

```bash
npm run omeka:install-profile -- --dry-run
```

Ejecutar la instalacion:

```bash
npm run omeka:install-profile
```

El instalador usa la API REST de Omeka S. No escribe en la base de datos directamente y no almacena
las claves en el repositorio. La operacion es idempotente: si un vocabulario o template ya existe,
lo reporta como `exists`.

## Carga de datos de prueba

Despues de instalar el perfil PNPU, cargar el set minimo de prueba definido en
`schemas/omeka/pnpu-sample-catalog.json`.

Revisar primero:

```bash
npm run omeka:seed-sample -- --dry-run
```

Ejecutar la carga:

```bash
npm run omeka:seed-sample
```

El seed crea, si no existen:

- tres universidades;
- tres editoriales;
- cinco materias;
- cuatro contribuidores;
- tres colecciones;
- tres publicaciones;
- tres recursos digitales asociados a publicaciones.

La deteccion de duplicados usa `pnpu:uuid` para recursos PNPU y `skos:notation` para materias. La
carga falla explicitamente si el perfil PNPU aun no esta instalado.

## Carga manual de vocabularios

La instalacion base de Omeka S incluye `dcterms`, `dctype`, `bibo` y `foaf`. Para PNPU faltan tres
vocabularios operativos:

- `schemas/omeka/vocabularies/schema-pnpu-subset.ttl`
- `schemas/omeka/vocabularies/skos-pnpu-subset.ttl`
- `schemas/omeka/vocabularies/pnpu.ttl`

Si no se usa el instalador automatizado, importarlos desde el panel administrativo de Omeka S en la
seccion de vocabularios. Estos ficheros contienen el subconjunto minimo de propiedades requerido por
el perfil PNPU; no sustituyen los vocabularios canonicos externos.

Tras importarlos, ejecutar:

```bash
npm run omeka:check
```

El bloque `installation.missingVocabularies` debe quedar vacio y
`installation.missingProperties` no debe listar propiedades `schema`, `skos` ni `pnpu`.

## Creacion de Resource Templates

Crear en Omeka S las plantillas definidas en `schemas/omeka/pnpu-resource-templates.json`.

Reglas de carga:

- El `label` debe coincidir exactamente con el manifiesto.
- Las propiedades marcadas con `required: true` deben configurarse como obligatorias en Omeka.
- `PNPU Collection` se crea como plantilla para Item Sets.
- `PNPU Digital Resource` documenta el perfil esperado de Media asociado a publicaciones.
- No agregar propiedades fuera del manifiesto sin una decision de arquitectura o gobierno de datos.

Al terminar, `npm run omeka:check` debe reportar:

```json
{
  "installation": {
    "missingVocabularies": [],
    "missingProperties": [],
    "readyForPnpuMapping": true
  }
}
```

Ese estado aun no activa `PNPU_CATALOG_REPOSITORY=omeka`; solo confirma que Omeka esta modelado
para cargar datos de prueba PNPU.

## Activacion local del repositorio Omeka

Usar este modo solo despues de que `npm run omeka:check` reporte `readyForPnpuMapping: true` y
`npm run omeka:map` encuentre datos PNPU suficientes para publicaciones y referencias.

Configurar en la sesion local:

```bash
PNPU_CATALOG_REPOSITORY=omeka
PNPU_OMEKA_BASE_URL=http://127.0.0.1/omeka-s
PNPU_OMEKA_REQUIRE_APPROVED_MAPPING=true
PNPU_OMEKA_PAGE_SIZE=100
PNPU_OMEKA_MAX_PAGES=100
PNPU_OMEKA_CACHE_TTL_SECONDS=60
PNPU_CATALOG_REFRESH_TOKEN=...
```

Con esas variables, las paginas y rutas `/v1` cargan el catalogo desde la API publica de Omeka S,
lo convierten al modelo de dominio PNPU y lo exponen mediante los mismos servicios de aplicacion. Si
el mapeo genera rechazos de calidad, la activacion falla con `PNPU-503` para evitar publicar datos
incompletos.

La navegacion publica consume las mismas consultas del dominio con filtros por texto, editorial,
autor o contribuyente, coleccion, idioma, materia y ordenamiento. Los filtros y el orden se aplican
despues de mapear el snapshot Omeka al modelo PNPU y antes de paginar la respuesta.

`PNPU_OMEKA_CACHE_TTL_SECONDS` controla el cache en memoria por proceso del snapshot Omeka ya
mapeado. El valor por defecto recomendado para desarrollo es `60`. Usar `0` desactiva el cache y
fuerza una lectura completa de Omeka en cada request.

Para forzar una recarga despues de modificar datos en Omeka, configurar
`PNPU_CATALOG_REFRESH_TOKEN` y ejecutar:

```bash
curl -X POST \
  -H "X-PNPU-Refresh-Token: $PNPU_CATALOG_REFRESH_TOKEN" \
  http://127.0.0.1:4307/health/catalog/refresh
```

Si `PNPU_CATALOG_REFRESH_TOKEN` no esta configurado, el endpoint responde `PNPU-503` y no ejecuta
ninguna recarga.

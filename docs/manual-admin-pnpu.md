# Manual del administrador PNPU

## Objetivo

Guiar al administrador nacional de la Plataforma Nacional de Publicaciones Universitarias en la
operacion diaria del portal, la integracion con Omeka S y la supervision del catalogo publico.

Este manual no sustituye la arquitectura empresarial ni los runbooks tecnicos. Describe el proceso
operativo esperado para mantener visible, consistente y verificable el catalogo nacional.

## Alcance del administrador

El administrador PNPU es responsable de:

- mantener la configuracion operativa del portal;
- verificar que Omeka S este disponible;
- instalar o revisar el perfil PNPU de Omeka;
- coordinar la carga de datos con las editoriales;
- ejecutar o autorizar refrescos del catalogo;
- revisar errores de calidad de metadatos;
- validar que el portal publico muestre datos correctos;
- escalar incidencias tecnicas cuando el problema no sea de metadatos.

El administrador PNPU no debe modificar directamente la base de datos de Omeka, la base de datos de
PNPU ni secretos almacenados fuera de los mecanismos operativos definidos.

## Sistemas involucrados

| Sistema | Uso operativo |
|---|---|
| Portal PNPU | Publicacion, descubrimiento, API publica, SEO y estado operativo |
| Omeka S | Gestion de publicaciones, colecciones, autores, materias y recursos digitales |
| Sistema de Gestion de Editoriales | Fuente oficial futura para editoriales y universidades |
| GitHub Actions | Validacion continua del codigo y artefactos |
| systemd | Ejecucion del proceso PNPU en Ubuntu Server |
| Ansible | Provisionamiento, despliegue y rollback |

## Flujo general

1. La editorial carga o corrige metadatos en Omeka S.
2. El administrador revisa que los recursos usen plantillas PNPU.
3. PNPU refresca el snapshot del catalogo Omeka.
4. PNPU valida y normaliza los datos contra el modelo de dominio.
5. Los registros validos aparecen en el portal publico.
6. Los registros rechazados se corrigen en Omeka S.

PNPU no publica automaticamente datos invalidos. Si un registro no cumple las reglas minimas del
dominio, debe corregirse en Omeka.

## Configuracion local de referencia

En entorno local de desarrollo, la integracion se valida con:

```bash
PNPU_CATALOG_REPOSITORY=omeka
PNPU_OMEKA_BASE_URL=http://127.0.0.1/omeka-s
PNPU_OMEKA_REQUIRE_APPROVED_MAPPING=true
PNPU_OMEKA_PAGE_SIZE=100
PNPU_OMEKA_MAX_PAGES=100
PNPU_OMEKA_CACHE_TTL_SECONDS=60
PNPU_CATALOG_REFRESH_TOKEN=...
```

Los secretos, claves API y tokens no deben almacenarse en el repositorio.

## Instalacion o revision del perfil PNPU en Omeka

Antes de usar Omeka como fuente activa del catalogo, debe existir el perfil PNPU:

- vocabularios requeridos;
- resource templates PNPU;
- propiedades obligatorias;
- plantilla de colecciones como Item Set;
- plantilla de recursos digitales como Media asociado a publicaciones.

Comando de diagnostico:

```bash
npm run omeka:check
```

El estado esperado es:

```json
{
  "installation": {
    "missingVocabularies": [],
    "missingProperties": [],
    "readyForPnpuMapping": true
  }
}
```

Si faltan vocabularios o propiedades, no debe activarse el repositorio Omeka para publicacion.

## Instalacion automatizada del perfil

Crear una clave API en Omeka S desde el usuario administrador y exportarla solo en la sesion de
trabajo:

```bash
PNPU_OMEKA_BASE_URL=http://127.0.0.1/omeka-s
PNPU_OMEKA_KEY_IDENTITY=...
PNPU_OMEKA_KEY_CREDENTIAL=...
```

Revisar acciones sin escribir:

```bash
npm run omeka:install-profile -- --dry-run
```

Instalar perfil:

```bash
npm run omeka:install-profile
```

El instalador usa la API REST de Omeka S. No escribe directamente en la base de datos.

## Carga inicial de prueba

Despues de instalar el perfil PNPU, puede cargarse el catalogo minimo de prueba:

```bash
npm run omeka:seed-sample -- --dry-run
npm run omeka:seed-sample
```

La carga de prueba crea:

- tres universidades;
- tres editoriales;
- cinco materias;
- cuatro contribuidores;
- tres colecciones;
- tres publicaciones;
- tres recursos digitales asociados.

La carga productiva no debe depender de estos datos de prueba.

## Validacion del mapeo Omeka a PNPU

Ejecutar:

```bash
npm run omeka:map
```

Este comando permite revisar si Omeka contiene recursos reconocibles por PNPU. Debe usarse despues
de cargas masivas, correcciones importantes o cambios en plantillas.

## Refresco del catalogo publico

PNPU usa cache en memoria por proceso para no leer Omeka en cada navegacion. Despues de modificar
datos en Omeka, puede forzarse una recarga controlada:

```bash
curl -X POST \
  -H "X-PNPU-Refresh-Token: $PNPU_CATALOG_REFRESH_TOKEN" \
  http://127.0.0.1:4307/health/catalog/refresh
```

En el entorno local actual puede usarse el puerto donde este ejecutandose el portal, por ejemplo
`4310`.

Si el token no esta configurado o es incorrecto, PNPU debe rechazar la operacion.

## Revision del estado operativo

Endpoints principales:

| Endpoint | Uso |
|---|---|
| `/estado` | Vista operativa legible para revisar catalogo y cache |
| `/health/catalog` | Diagnostico JSON del catalogo Omeka |
| `/health/catalog/refresh` | Refresco controlado del snapshot |
| `/health/ready` | Disponibilidad para recibir trafico |
| `/health/live` | Proceso vivo |
| `/metrics` | Metricas Prometheus |

Despues de una carga o correccion, revisar:

1. `/health/catalog`;
2. `/estado`;
3. `/publicaciones`;
4. `/editoriales`;
5. ficha de la editorial afectada;
6. ficha de la publicacion afectada.

## Reglas minimas para publicacion

Una publicacion debe tener:

- UUID PNPU;
- titulo;
- fecha de publicacion;
- idioma;
- tipo;
- formato;
- editorial;
- al menos un contribuidor;
- al menos un identificador;
- al menos una materia;
- al menos un recurso digital.

Si falta alguno de estos elementos, PNPU puede excluir el registro del catalogo publico.

## Errores frecuentes

| Situacion | Accion recomendada |
|---|---|
| La publicacion existe en Omeka pero no aparece en PNPU | Revisar `/health/catalog` y campos obligatorios |
| Aparece una editorial menos que en Omeka | Confirmar que todos los Publishers usan template PNPU y UUID valido |
| Una coleccion no aparece | Verificar que sea Item Set con template `PNPU Collection` |
| Autor sin ORCID visible | Revisar formato ORCID; si es invalido, PNPU puede omitirlo |
| Recurso digital no aparece | Revisar Media asociado a la publicacion y URL/formato |
| Cambios en Omeka no se ven | Ejecutar refresh o esperar expiracion del cache |

## Operacion segura

- No guardar claves API en archivos versionados.
- No compartir tokens de refresh por correo o mensajeria no segura.
- No corregir datos directamente en MySQL.
- No cambiar plantillas PNPU sin decision de arquitectura o gobierno de datos.
- No publicar registros incompletos para "resolver rapido".
- Documentar fecha, operador y motivo de cargas masivas.

## Checklist despues de carga editorial

- Omeka responde correctamente.
- Los nuevos Items usan Resource Templates PNPU.
- Las colecciones estan creadas como Item Sets.
- Las publicaciones tienen Media asociado.
- `npm run omeka:map` no reporta rechazos criticos.
- El refresh del catalogo responde correctamente.
- `/estado` muestra snapshot reciente.
- Las fichas publicas muestran datos completos.

## Identidad administrativa

Los endpoints administrativos de importacion pueden operar en tres modos:

| Modo | Uso |
| --- | --- |
| `token` | Desarrollo local con `X-PNPU-Admin-Token` |
| `hybrid` | Transicion entre token local y OIDC |
| `oidc` | Produccion con Keycloak/OIDC y segundo factor institucional |

Variables principales:

```text
PNPU_ADMIN_AUTH_MODE=oidc
PNPU_ADMIN_REQUIRED_ROLE=pnpu-admin
PNPU_OIDC_ISSUER=https://keycloak.example.edu/realms/pnpu
PNPU_OIDC_AUDIENCE=pnpu-portal
PNPU_OIDC_CLIENT_ID=pnpu-portal
PNPU_OIDC_SCOPES=openid profile email
```

PNPU no almacena contrasenas de administradores. El usuario, la contrasena, el segundo factor y las
politicas de acceso se administran en Keycloak o en el proveedor OIDC institucional. En produccion,
el JWT OIDC debe incluir el rol requerido.

Para abrir la pantalla administrativa con OIDC:

```text
https://<dominio-pnpu>/api/admin/auth/login?returnTo=/admin/importaciones/publicaciones
```

Para salir de la sesion PNPU:

```text
https://<dominio-pnpu>/api/admin/auth/logout
```

El token local `PNPU_PUBLICATION_IMPORT_TOKEN` solo debe usarse en desarrollo o transicion
controlada.

Para abrir la pantalla administrativa en desarrollo local:

```text
http://127.0.0.1:4310/admin/importaciones/publicaciones?adminToken=<token-local>
```

El portal limpia el token de la URL y conserva una cookie HTTP-only de corta duracion para esa ruta.

## Escalamiento

Escalar a equipo tecnico cuando:

- Omeka no responde;
- PNPU devuelve `PNPU-503` sin causa clara de metadatos;
- el refresh falla con token valido;
- el build o despliegue falla;
- hay errores repetidos en `/health/ready`;
- se requiere cambiar plantillas, modelos, ADRs o reglas de dominio.

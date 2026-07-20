# Runbook de identidad administrativa PNPU

## Alcance

Configurar la autorizacion de endpoints administrativos del Portal PNPU.

## Modos soportados

| Modo | Uso |
| --- | --- |
| `token` | Desarrollo local. Valida `X-PNPU-Admin-Token` contra `PNPU_PUBLICATION_IMPORT_TOKEN`. |
| `hybrid` | Transicion. Acepta token local, OIDC Bearer JWT valido o cookie de sesion OIDC. |
| `oidc` | Produccion. Acepta OIDC Bearer JWT valido o cookie de sesion OIDC. |

## Variables

```text
PNPU_ADMIN_AUTH_MODE=token
PNPU_ADMIN_REQUIRED_ROLE=pnpu-admin
PNPU_ADMIN_IMPORT_READ_ROLE=pnpu-import-reader
PNPU_ADMIN_IMPORT_WRITE_ROLE=pnpu-import-writer
PNPU_ADMIN_IMPORT_ROLLBACK_ROLE=pnpu-import-rollback
PNPU_OIDC_ISSUER=https://keycloak.example.edu/realms/pnpu
PNPU_OIDC_AUDIENCE=pnpu-portal
PNPU_OIDC_CLIENT_ID=pnpu-portal
PNPU_OIDC_CLIENT_SECRET=
PNPU_OIDC_SCOPES=openid profile email
PNPU_PUBLICATION_IMPORT_TOKEN=
```

## Reglas

- En produccion debe usarse `PNPU_ADMIN_AUTH_MODE=oidc`.
- El token local es temporal y no sustituye Keycloak/OIDC.
- PNPU no almacena usuarios ni contrasenas; Keycloak valida usuario, contrasena y segundo factor.
- El cliente OIDC debe permitir Authorization Code con PKCE y callback `/api/admin/auth/callback`.
- El JWT debe estar firmado con `RS256`.
- El `iss` debe coincidir con `PNPU_OIDC_ISSUER`.
- El `aud` debe contener `PNPU_OIDC_AUDIENCE`.
- El usuario debe tener `PNPU_ADMIN_REQUIRED_ROLE` o el rol granular requerido para la operacion.

## Permisos administrativos

| Rol | Alcance |
| --- | --- |
| `pnpu-admin` | Acceso total a la pantalla y a todos los endpoints administrativos. |
| `pnpu-import-reader` | Diagnostico, preview, dry-run, autoridades, historial y planes no destructivos de lectura. |
| `pnpu-import-writer` | Plan de commit y escritura controlada en Omeka S. |
| `pnpu-import-rollback` | Plan de rollback y ejecucion de rollback controlado. |

Los nombres pueden cambiarse con las variables `PNPU_ADMIN_IMPORT_READ_ROLE`,
`PNPU_ADMIN_IMPORT_WRITE_ROLE` y `PNPU_ADMIN_IMPORT_ROLLBACK_ROLE`. La pantalla administrativa puede
abrirse con cualquiera de esos roles, pero cada endpoint vuelve a validar el permiso especifico antes
de ejecutar la operacion.

## Flujo web administrativo

La pantalla administrativa puede iniciar sesion contra Keycloak desde:

```text
/api/admin/auth/login?returnTo=/admin/importaciones/publicaciones
```

El callback configurado en Keycloak debe ser:

```text
https://<dominio-pnpu>/api/admin/auth/callback
```

Al completar el login, PNPU valida el token OIDC y crea una cookie HTTP-only de 8 horas llamada
`pnpu_admin_session`. Para cerrar sesion local en PNPU:

```text
/api/admin/auth/logout
```

El segundo factor se configura en Keycloak mediante las politicas institucionales del realm
(`Required Action`, flujo de autenticacion o politica equivalente). PNPU solo consume el resultado
OIDC validado.

## Roles

El rol puede venir en cualquiera de estas ubicaciones del token:

- `realm_access.roles`;
- `resource_access[PNPU_OIDC_CLIENT_ID].roles`;
- `groups`.

## Endpoints protegidos

Los endpoints administrativos de importacion aceptan:

```http
Authorization: Bearer <jwt>
```

o, solo en modo `token`/`hybrid`:

```http
X-PNPU-Admin-Token: <token-local>
```

## Pantalla administrativa local

La pantalla `/admin/importaciones/publicaciones` tambien queda protegida. En desarrollo local puede
abrirse una sesion de 8 horas con:

```text
http://127.0.0.1:4310/admin/importaciones/publicaciones?adminToken=<token-local>
```

El portal valida el token, crea una cookie HTTP-only limitada a la ruta administrativa y redirige a
la URL sin el token en el query string. En produccion debe usarse `PNPU_ADMIN_AUTH_MODE=oidc` y el
flujo web OIDC institucional.

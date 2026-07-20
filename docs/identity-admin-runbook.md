# Runbook de identidad administrativa PNPU

## Alcance

Configurar la autorizacion de endpoints administrativos del Portal PNPU.

## Modos soportados

| Modo | Uso |
| --- | --- |
| `token` | Desarrollo local. Valida `X-PNPU-Admin-Token` contra `PNPU_PUBLICATION_IMPORT_TOKEN`. |
| `hybrid` | Transicion. Acepta token local u OIDC Bearer JWT valido. |
| `oidc` | Produccion. Acepta solo OIDC Bearer JWT valido. |

## Variables

```text
PNPU_ADMIN_AUTH_MODE=token
PNPU_ADMIN_REQUIRED_ROLE=pnpu-admin
PNPU_OIDC_ISSUER=https://keycloak.example.edu/realms/pnpu
PNPU_OIDC_AUDIENCE=pnpu-portal
PNPU_OIDC_CLIENT_ID=pnpu-portal
PNPU_PUBLICATION_IMPORT_TOKEN=
```

## Reglas

- En produccion debe usarse `PNPU_ADMIN_AUTH_MODE=oidc`.
- El token local es temporal y no sustituye Keycloak/OIDC.
- El JWT debe estar firmado con `RS256`.
- El `iss` debe coincidir con `PNPU_OIDC_ISSUER`.
- El `aud` debe contener `PNPU_OIDC_AUDIENCE`.
- El usuario debe tener `PNPU_ADMIN_REQUIRED_ROLE`.

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
la URL sin el token en el query string. En produccion debe usarse `PNPU_ADMIN_AUTH_MODE=oidc` y un
flujo institucional delante del portal o peticiones con `Authorization: Bearer <jwt>`.

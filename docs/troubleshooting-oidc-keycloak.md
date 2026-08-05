# Troubleshooting OIDC/Keycloak - PNPU Portal

## Alcance

Guia operativa para diagnosticar problemas de acceso administrativo en PNPU Portal usando Keycloak,
OIDC, 2FA y HAProxy.

Aplica a:

```text
Portal: https://editorial.reduniv.edu.cu
Realm: pnpu
Client ID: pnpu-portal
Issuer: https://identidad.reduniv.edu.cu/realms/pnpu
```

## Variables esperadas en PNPU Portal

Archivo:

```bash
/etc/pnpu/portal.env
```

Valores base:

```env
PNPU_ADMIN_AUTH_MODE=oidc
PNPU_PUBLIC_BASE_URL=https://editorial.reduniv.edu.cu
PNPU_OIDC_ISSUER=https://identidad.reduniv.edu.cu/realms/pnpu
PNPU_OIDC_AUDIENCE=pnpu-portal
PNPU_OIDC_CLIENT_ID=pnpu-portal
PNPU_OIDC_CLIENT_SECRET=CAMBIAR_SECRET_REAL
PNPU_OIDC_SCOPES=openid profile email
```

Despues de modificar:

```bash
sudo systemctl restart pnpu-portal
```

## Validar conectividad desde la VM del portal

```bash
curl --noproxy identidad.reduniv.edu.cu \
  -i https://identidad.reduniv.edu.cu/realms/pnpu/.well-known/openid-configuration
```

Resultado esperado:

```text
HTTP/2 200
"issuer":"https://identidad.reduniv.edu.cu/realms/pnpu"
```

Si falla por proxy Squid, forzar resolucion interna al HAProxy:

```bash
sudo nano /etc/hosts
```

```text
10.46.4.22 identidad.reduniv.edu.cu
```

Y en `/etc/pnpu/portal.env`:

```env
NO_PROXY=127.0.0.1,localhost,10.46.4.22,identidad.reduniv.edu.cu,catalogo.reduniv.edu.cu
no_proxy=127.0.0.1,localhost,10.46.4.22,identidad.reduniv.edu.cu,catalogo.reduniv.edu.cu
```

## Validar redirect_uri

Ejecutar:

```bash
curl -I \
  -H "Host: editorial.reduniv.edu.cu" \
  -H "X-Forwarded-Proto: https" \
  "http://127.0.0.1:3000/api/admin/auth/login?returnTo=/admin"
```

El header `location` debe contener:

```text
redirect_uri=https%3A%2F%2Feditorial.reduniv.edu.cu%2Fapi%2Fadmin%2Fauth%2Fcallback
```

Si contiene `localhost` o `127.0.0.1`, revisar:

```env
PNPU_PUBLIC_BASE_URL=https://editorial.reduniv.edu.cu
```

## Configuracion del cliente Keycloak

En Keycloak:

```text
Realm: pnpu
Clients -> pnpu-portal -> Settings
```

Valores esperados:

```text
Client authentication: On
Standard flow: On
Direct access grants: Off
Valid redirect URIs:
  https://editorial.reduniv.edu.cu/api/admin/auth/callback
Valid post logout redirect URIs:
  https://editorial.reduniv.edu.cu/*
Web origins:
  https://editorial.reduniv.edu.cu
```

## Audience mapper

Si el callback falla con:

```text
Invalid JWT audience.
```

En Keycloak:

```text
Clients -> pnpu-portal -> Client scopes -> pnpu-portal-dedicated -> Mappers
```

Crear mapper:

```text
Mapper type: Audience
Name: pnpu-portal-audience
Included Client Audience: pnpu-portal
Add to access token: On
Add to ID token: On
```

Si no aparece `Included Client Audience`, usar:

```text
Included Custom Audience: pnpu-portal
```

El token debe incluir:

```json
"aud": "pnpu-portal"
```

o:

```json
"aud": ["pnpu-portal"]
```

## Roles

Crear en el realm `pnpu`:

```text
pnpu-admin
pnpu-import-reader
pnpu-import-writer
pnpu-import-rollback
pnpu-editorial-coordinator
pnpu-editorial-metadata-editor
pnpu-editorial-reviewer
pnpu-editorial-viewer
```

Usuario administrador inicial:

```text
Username: admin-pnpu
```

Roles minimos:

```text
pnpu-admin
pnpu-import-reader
pnpu-import-writer
pnpu-import-rollback
```

## Mapper de roles

En:

```text
Clients -> pnpu-portal -> Client scopes -> pnpu-portal-dedicated -> Mappers
```

Crear si no existe:

```text
Mapper type: User Realm Role
Name: realm-roles
Token Claim Name: realm_access.roles
Claim JSON Type: String
Multivalued: On
Add to access token: On
Add to ID token: On
Add to userinfo: On
```

## 2FA

Para forzar doble factor en el usuario inicial:

```text
Users -> admin-pnpu -> Required user actions
```

Seleccionar:

```text
Update Password
Configure OTP
```

## Diagnostico con logs del portal

Despues de un fallo en callback:

```bash
sudo journalctl -u pnpu-portal -n 150 --no-pager | grep admin_oidc_callback_failed
```

Razones comunes:

```text
OIDC token exchange failed with HTTP 401: invalid_client
Invalid JWT audience.
OIDC token does not include the required role.
OIDC callback state cookie is missing.
OIDC callback state does not match the stored state.
```

Acciones:

- `invalid_client`: revisar `PNPU_OIDC_CLIENT_SECRET`.
- `Invalid JWT audience`: revisar mapper Audience.
- `required role`: revisar roles del usuario y mapper `realm_access.roles`.
- `state cookie is missing`: revisar dominio, HTTPS, cookies y que no se este mezclando `localhost`
  con dominio publico.

## Validacion final

```text
https://editorial.reduniv.edu.cu/admin
```

Resultado esperado:

1. Redirige a Keycloak.
2. Solicita usuario, contrasena y 2FA.
3. Regresa a `https://editorial.reduniv.edu.cu/admin`.
4. Muestra `Sesion OIDC activa`.
5. Permite abrir importaciones.

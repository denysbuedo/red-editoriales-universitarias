# Theme Reduniv para Keycloak

## Objetivo

Personalizar la pantalla de autenticacion institucional de Keycloak sin cambiar el flujo OIDC,
roles, 2FA ni validacion de tokens.

El theme `reduniv` usa el logo institucional de Reduniv y una apariencia sobria basada en azul
oscuro, azul claro y grises.

## Artefacto

Generar en la estacion de desarrollo:

```bash
npm run package:keycloak-theme
```

Esto produce:

```text
artifacts/reduniv-keycloak-theme-0.1.0.tar.gz
artifacts/reduniv-keycloak-theme-0.1.0.tar.gz.sha256
```

Checksum validado:

```text
SHA-256: 6f432a2a7a3d901a5d6ae2a2e7c50069ca1b2f46575084420be6ef8555d496c1
```

## Despliegue en la VM de identidad

Subir a `/home/ituser/updates` en la VM de Keycloak:

```text
reduniv-keycloak-theme-0.1.0.tar.gz
reduniv-keycloak-theme-0.1.0.tar.gz.sha256
deploy-keycloak-theme.sh
```

Ejecutar:

```bash
cd /home/ituser/updates
chmod +x deploy-keycloak-theme.sh
./deploy-keycloak-theme.sh
```

El script instala el theme en:

```text
/opt/keycloak/themes/reduniv
```

Luego reinicia el servicio `keycloak`.

## Activacion en el realm

En la consola administrativa de Keycloak:

```text
Realm: reduniv
Realm settings
Themes
Login theme: reduniv
Save
```

## Logout SSO

Para que el boton `Cerrar sesion` de PNPU cierre tambien la sesion de Keycloak, el client
`pnpu-portal` del realm `reduniv` debe permitir:

```text
Valid post logout redirect URIs:
  https://editorial.reduniv.edu.cu/*
```

El portal redirige al endpoint de cierre de Keycloak descubierto desde:

```text
https://identidad.reduniv.edu.cu/realms/reduniv/.well-known/openid-configuration
```

Si Keycloak no esta disponible, PNPU limpia la cookie local y regresa al portal publico.

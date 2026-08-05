# Hardening inicial v0.1

## Objetivo

Registrar controles minimos de seguridad para la linea base productiva v0.1.

## Portal PNPU

Verificar en `vm-catalogoeditoriales`:

```bash
sudo ls -l /etc/pnpu/portal.env
sudo systemctl status pnpu-portal --no-pager
curl -I http://127.0.0.1:3000/
curl http://127.0.0.1:3000/health/ready
```

Requisitos:

- `/etc/pnpu/portal.env` no debe ser legible por usuarios no autorizados.
- `PNPU_ADMIN_AUTH_MODE=oidc` en produccion.
- `PNPU_PUBLICATION_IMPORT_TOKEN` solo debe mantenerse si hay excepcion documentada.
- `PNPU_OIDC_ISSUER` debe apuntar a `https://identidad.reduniv.edu.cu/realms/reduniv`.
- `/metrics` debe quedar protegido por ACL de HAProxy o red institucional si se publica.

## Keycloak

Verificar en `vm-identidad`:

```bash
sudo /opt/keycloak/bin/kcadm.sh get realms/reduniv | grep browserFlow
sudo /opt/keycloak/bin/kcadm.sh get clients -r reduniv | grep pnpu-portal
curl -i http://127.0.0.1:9000/health/ready
```

Requisitos:

- Realm institucional: `reduniv`.
- Browser flow: `reduniv-browser-otp`.
- OTP obligatorio para usuarios administrativos.
- Client `pnpu-portal` con redirect URI exacto:

```text
https://editorial.reduniv.edu.cu/api/admin/auth/callback
```

- Post logout redirect URI:

```text
https://editorial.reduniv.edu.cu/*
```

## Omeka S

Verificar en `vm-catalogoeditoriales`:

```bash
curl http://127.0.0.1/api/items
curl http://127.0.0.1:3000/health/catalog
```

Requisitos:

- Admin de Omeka solo por HTTPS publico.
- Claves API usadas por PNPU con permisos minimos necesarios.
- `database.ini` con permisos restringidos.
- Perfil PNPU sin propiedades faltantes.

## HAProxy Remoto

Requisitos recomendados:

- TLS publico para:

```text
editorial.reduniv.edu.cu
catalogo.reduniv.edu.cu
identidad.reduniv.edu.cu
```

- Rutas internas:

```text
editorial.reduniv.edu.cu -> vm-catalogoeditoriales:3000
catalogo.reduniv.edu.cu -> vm-catalogoeditoriales:80
identidad.reduniv.edu.cu -> vm-identidad:8080
```

- Restringir endpoints operativos si la politica institucional lo exige:

```text
/metrics
/health/catalog/refresh
/admin
```

## Pendientes de Hardening

- Definir rotacion periodica de secrets OIDC y Omeka API.
- Definir retencion y cifrado de backups.
- Formalizar ACL para `/metrics`.
- Revisar logs para no exponer tokens ni secretos.
- Incorporar escaneo de dependencias como criterio bloqueante en CI/CD.

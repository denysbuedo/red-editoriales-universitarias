# Linea base de produccion v0.1

## Objetivo

Registrar el estado operativo real de PNPU v0.1 despues de validar portal, Omeka S, Keycloak,
2FA, logout federado y despliegue por artefactos sin Docker.

Este documento fija una linea base para soporte, despliegues futuros y traspaso a otros equipos.

## Dominios

| Servicio           | URL publica                        | VM                       | Puerto interno |
| ------------------ | ---------------------------------- | ------------------------ | -------------: |
| Portal PNPU        | `https://editorial.reduniv.edu.cu` | `vm-catalogoeditoriales` |         `3000` |
| Catalogo Omeka S   | `https://catalogo.reduniv.edu.cu`  | `vm-catalogoeditoriales` |           `80` |
| Identidad Keycloak | `https://identidad.reduniv.edu.cu` | `vm-identidad`           |         `8080` |
| Health Keycloak    | interno                            | `vm-identidad`           |         `9000` |

El TLS publico termina en HAProxy remoto. PNPU y Omeka se exponen internamente por HTTP.

## Portal PNPU

| Elemento               | Estado                     |
| ---------------------- | -------------------------- |
| Version                | `0.1.0`                    |
| Runtime                | Next.js sobre systemd      |
| Usuario de proceso     | `pnpu`                     |
| Ruta base              | `/opt/pnpu/portal`         |
| Release activo         | `/opt/pnpu/portal/current` |
| Variables              | `/etc/pnpu/portal.env`     |
| Artefacto              | `pnpu-portal-0.1.0.tar.gz` |
| Commit runtime vigente | `4ab9395`                  |

Endpoints operativos esperados:

```text
/health/live
/health/ready
/health/catalog
/metrics
/version
```

## Omeka S

| Elemento              | Estado                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------- |
| URL publica           | `https://catalogo.reduniv.edu.cu`                                                      |
| URL interna para PNPU | `http://127.0.0.1`                                                                     |
| Perfil PNPU           | Instalado                                                                              |
| Seed de prueba        | Instalado en entorno actual                                                            |
| Plantillas PNPU       | Publication, Contributor, Publisher, University, Collection, Subject, Digital Resource |
| Vocabularios PNPU     | `schema`, `skos`, `pnpu`                                                               |

PNPU consume Omeka S con:

```text
PNPU_CATALOG_REPOSITORY=omeka
PNPU_OMEKA_BASE_URL=http://127.0.0.1
```

La escritura controlada hacia Omeka esta disponible solo desde endpoints administrativos con roles
autorizados.

## Keycloak

| Elemento            | Estado                                            |
| ------------------- | ------------------------------------------------- |
| URL publica         | `https://identidad.reduniv.edu.cu`                |
| Realm institucional | `reduniv`                                         |
| Client PNPU         | `pnpu-portal`                                     |
| Issuer PNPU         | `https://identidad.reduniv.edu.cu/realms/reduniv` |
| Theme login         | `reduniv`                                         |
| Browser flow        | `reduniv-browser-otp`                             |
| 2FA                 | OTP obligatorio en login                          |
| Logout              | Federado desde PNPU hacia `end_session_endpoint`  |

Roles administrativos minimos:

```text
pnpu-admin
pnpu-import-reader
pnpu-import-writer
pnpu-import-rollback
```

Roles editoriales definidos:

```text
pnpu-editorial-coordinator
pnpu-editorial-metadata-editor
pnpu-editorial-reviewer
pnpu-editorial-viewer
```

## Artefactos

| Artefacto                             | Destino          | Uso                                    |
| ------------------------------------- | ---------------- | -------------------------------------- |
| `pnpu-portal-0.1.0.tar.gz`            | VM PNPU          | Runtime del portal                     |
| `pnpu-omeka-tools-0.1.0.tar.gz`       | VM PNPU/catalogo | Perfil PNPU, seed y diagnosticos Omeka |
| `reduniv-keycloak-theme-0.1.0.tar.gz` | VM identidad     | Theme login Keycloak                   |
| `pnpu-ops-tools-0.1.0.tar.gz`         | Cualquier VM     | Backup, health-check y scripts ops     |

Los checksums vigentes estan documentados en:

```text
docs/deploy_ubuntu.md
docs/keycloak-reduniv-theme.md
```

## Pendientes Controlados

- Ejecutar importacion con planilla real de una editorial.
- Sustituir seed de prueba por datos reales cuando se apruebe la carga inicial.
- Definir API institucional externa para datos maestros de editoriales.
- Crear tarea programada nocturna para `scripts/backup-operational-state.sh` con `systemd timer`.
- Completar Ansible para Keycloak y Omeka, no solo portal.
- Revisar exposicion publica de `/metrics` con HAProxy o ACL institucional.

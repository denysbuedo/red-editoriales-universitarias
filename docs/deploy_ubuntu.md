# Despliegue Ubuntu 22.04 - PNPU Portal

## Objetivo

Instalar y publicar la plataforma PNPU Portal en Ubuntu Server 22.04 sin Docker, usando Node.js,
systemd, Omeka S como catalogo y HAProxy remoto para HTTPS.

Este procedimiento asume:

- Omeka S ya esta instalado en el mismo servidor.
- Omeka S queda publicado publicamente en `https://catalogo.reduniv.edu.cu`.
- PNPU Portal quedara publicado publicamente en `https://editorial.reduniv.edu.cu`.
- HAProxy remoto termina TLS y reenvia al servidor por HTTP interno.
- El backend de Omeka en HAProxy apunta a `IP_SERVIDOR:80`.
- El backend de PNPU Portal en HAProxy apuntara a `IP_SERVIDOR:3000`.

## 1. Verificar el repositorio local antes de desplegar

En la PC de desarrollo, desde la raiz del proyecto:

```powershell
git status --short
git log -1 --oneline
npm run quality
npm run build
npm run package:release
npm run package:validate
```

El estado esperado antes de generar el artefacto final es:

- Sin cambios pendientes de codigo o documentacion versionada.
- `Readme/` puede aparecer como no versionado si contiene documentos externos de trabajo.
- El artefacto debe quedar en `artifacts/pnpu-portal-0.1.0.tar.gz`.
- El checksum debe quedar en `artifacts/pnpu-portal-0.1.0.tar.gz.sha256`.

Para la version actual validada localmente:

```text
Artefacto: artifacts/pnpu-portal-0.1.0.tar.gz
SHA-256: ff4bd53ffca088a9f789c6ccc119016cc5cb8f99f5c5e753e7d6e497883f69fb
```

Si se regenera el artefacto, usar siempre el nuevo `.sha256`.

## 2. Subir el artefacto al servidor

Desde la PC de desarrollo:

```powershell
scp .\artifacts\pnpu-portal-0.1.0.tar.gz ituser@IP_SERVIDOR:/tmp/
scp .\artifacts\pnpu-portal-0.1.0.tar.gz.sha256 ituser@IP_SERVIDOR:/tmp/
```

Para actualizaciones operativas con scripts, copiar los archivos a `/home/ituser/updates`:

```powershell
scp .\artifacts\pnpu-portal-0.1.0.tar.gz ituser@IP_SERVIDOR:/home/ituser/updates/
scp .\artifacts\pnpu-portal-0.1.0.tar.gz.sha256 ituser@IP_SERVIDOR:/home/ituser/updates/
scp .\scripts\deploy-portal-artifact.sh ituser@IP_SERVIDOR:/home/ituser/updates/
```

En el servidor:

```bash
cd /home/ituser/updates
chmod +x deploy-portal-artifact.sh
./deploy-portal-artifact.sh
```

En el servidor:

```bash
sudo mkdir -p /opt/pnpu/portal/shared/artifacts
sudo mv /tmp/pnpu-portal-0.1.0.tar.gz /opt/pnpu/portal/shared/artifacts/
sudo mv /tmp/pnpu-portal-0.1.0.tar.gz.sha256 /opt/pnpu/portal/shared/artifacts/
```

Verificar integridad:

```bash
cd /opt/pnpu/portal/shared/artifacts
sha256sum -c pnpu-portal-0.1.0.tar.gz.sha256
```

Debe responder:

```text
pnpu-portal-0.1.0.tar.gz: OK
```

## 3. Instalar dependencias del sistema

En el servidor Ubuntu 22.04:

```bash
sudo apt update
sudo apt install -y ca-certificates curl xz-utils tar
```

Instalar Node.js 22.13.0 desde binario oficial:

```bash
cd /tmp
curl -fsSLO https://nodejs.org/dist/v22.13.0/node-v22.13.0-linux-x64.tar.xz
sudo mkdir -p /usr/local/lib/nodejs
sudo tar -xJf node-v22.13.0-linux-x64.tar.xz -C /usr/local/lib/nodejs
sudo ln -sf /usr/local/lib/nodejs/node-v22.13.0-linux-x64/bin/node /usr/local/bin/node
sudo ln -sf /usr/local/lib/nodejs/node-v22.13.0-linux-x64/bin/npm /usr/local/bin/npm
sudo ln -sf /usr/local/lib/nodejs/node-v22.13.0-linux-x64/bin/npx /usr/local/bin/npx
```

Verificar:

```bash
node --version
npm --version
```

`node --version` debe devolver `v22.13.0` o superior compatible con el proyecto.

## 4. Crear usuario y directorios

```bash
sudo groupadd --system pnpu || true
sudo useradd --system --gid pnpu --home-dir /opt/pnpu --shell /usr/sbin/nologin pnpu || true

sudo mkdir -p /opt/pnpu/portal/releases
sudo mkdir -p /opt/pnpu/portal/shared
sudo mkdir -p /opt/pnpu/portal/shared/.pnpu
sudo mkdir -p /opt/pnpu/portal/shared/deployments
sudo mkdir -p /etc/pnpu

sudo chown -R pnpu:pnpu /opt/pnpu
sudo chmod 750 /etc/pnpu
```

## 5. Descomprimir release

```bash
sudo mkdir -p /opt/pnpu/portal/releases/0.1.0
sudo tar -xzf /opt/pnpu/portal/shared/artifacts/pnpu-portal-0.1.0.tar.gz \
  -C /opt/pnpu/portal/releases/0.1.0 \
  --strip-components=1
sudo chown -R pnpu:pnpu /opt/pnpu/portal/releases/0.1.0
```

Crear enlace persistente para datos operativos escritos por la aplicacion:

```bash
sudo rm -rf /opt/pnpu/portal/releases/0.1.0/.pnpu
sudo ln -s /opt/pnpu/portal/shared/.pnpu /opt/pnpu/portal/releases/0.1.0/.pnpu
sudo chown -h pnpu:pnpu /opt/pnpu/portal/releases/0.1.0/.pnpu
```

Instalar dependencias de produccion:

```bash
cd /opt/pnpu/portal/releases/0.1.0
sudo -u pnpu npm ci --omit=dev
```

Si durante una actualizacion anterior aparece un error de `husky: not found`, se esta usando un
artefacto generado antes de sanear el `package.json` de runtime. Subir el artefacto vigente y repetir
el paso. Como desbloqueo temporal para ese artefacto anterior:

```bash
sudo -u pnpu npm ci --omit=dev --ignore-scripts
```

Actualizar enlace activo:

```bash
sudo ln -sfn /opt/pnpu/portal/releases/0.1.0 /opt/pnpu/portal/current
sudo chown -h pnpu:pnpu /opt/pnpu/portal/current
```

## 6. Configurar variables de entorno

Crear el archivo:

```bash
sudo nano /etc/pnpu/portal.env
```

Contenido base para el primer despliegue:

```env
NODE_ENV=production
PORT=3000

PNPU_PUBLIC_BASE_URL=https://editorial.reduniv.edu.cu
PNPU_COMMIT_SHA=195ef70
PNPU_LOG_LEVEL=info
PNPU_ENABLE_REQUEST_LOGS=true

PNPU_CATALOG_REPOSITORY=omeka
PNPU_OMEKA_BASE_URL=https://catalogo.reduniv.edu.cu
PNPU_OMEKA_TIMEOUT_MS=5000
PNPU_OMEKA_PAGE_SIZE=100
PNPU_OMEKA_MAX_PAGES=100
PNPU_OMEKA_CACHE_TTL_SECONDS=60
PNPU_OMEKA_REQUIRE_APPROVED_MAPPING=true

PNPU_OMEKA_KEY_IDENTITY=CAMBIAR_KEY_IDENTITY
PNPU_OMEKA_KEY_CREDENTIAL=CAMBIAR_KEY_CREDENTIAL

PNPU_CATALOG_REFRESH_TOKEN=CAMBIAR_TOKEN_REFRESH

PNPU_ADMIN_AUTH_MODE=token
PNPU_PUBLICATION_IMPORT_TOKEN=CAMBIAR_TOKEN_ADMIN_LOCAL
PNPU_PUBLICATION_IMPORT_ROOT=/opt/pnpu/portal/shared/imports
PNPU_OMEKA_IMPORT_ENABLED=true
PNPU_OMEKA_ROLLBACK_ENABLED=true

PNPU_ADMIN_REQUIRED_ROLE=pnpu-admin
PNPU_ADMIN_IMPORT_READ_ROLE=pnpu-import-reader
PNPU_ADMIN_IMPORT_WRITE_ROLE=pnpu-import-writer
PNPU_ADMIN_IMPORT_ROLLBACK_ROLE=pnpu-import-rollback

PNPU_EDITORIAL_COORDINATOR_ROLE=pnpu-editorial-coordinator
PNPU_EDITORIAL_METADATA_EDITOR_ROLE=pnpu-editorial-metadata-editor
PNPU_EDITORIAL_REVIEWER_ROLE=pnpu-editorial-reviewer
PNPU_EDITORIAL_VIEWER_ROLE=pnpu-editorial-viewer

PNPU_OIDC_ISSUER=
PNPU_OIDC_AUDIENCE=
PNPU_OIDC_CLIENT_ID=
PNPU_OIDC_CLIENT_SECRET=
PNPU_OIDC_SCOPES=openid profile email
```

Proteger el archivo:

```bash
sudo chown root:pnpu /etc/pnpu/portal.env
sudo chmod 640 /etc/pnpu/portal.env
```

Crear carpeta de importaciones:

```bash
sudo mkdir -p /opt/pnpu/portal/shared/imports
sudo chown -R pnpu:pnpu /opt/pnpu/portal/shared/imports
```

Notas:

- Los valores `CAMBIAR_*` son secretos operativos y no deben ir al repositorio.
- Si Keycloak/OIDC ya esta disponible, cambiar `PNPU_ADMIN_AUTH_MODE=oidc` y completar las variables
  `PNPU_OIDC_*`.
- Si el servidor no puede resolver o alcanzar `https://catalogo.reduniv.edu.cu`, usar temporalmente
  `PNPU_OMEKA_BASE_URL=http://127.0.0.1` y documentar la excepcion operacional.

## 7. Crear servicio systemd

Crear:

```bash
sudo nano /etc/systemd/system/pnpu-portal.service
```

Contenido:

```ini
[Unit]
Description=PNPU Portal
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pnpu
Group=pnpu
WorkingDirectory=/opt/pnpu/portal/current
EnvironmentFile=/etc/pnpu/portal.env
ExecStart=/usr/local/bin/npm run start
Restart=always
RestartSec=5
TimeoutStopSec=30
KillSignal=SIGINT
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
PrivateDevices=true
ProtectClock=true
ProtectControlGroups=true
ProtectKernelLogs=true
ProtectKernelModules=true
ProtectKernelTunables=true
RestrictRealtime=true
RestrictSUIDSGID=true
LockPersonality=true
ReadWritePaths=/opt/pnpu/portal/shared
ReadWritePaths=/tmp

[Install]
WantedBy=multi-user.target
```

Activar:

```bash
sudo systemctl daemon-reload
sudo systemctl enable pnpu-portal
sudo systemctl restart pnpu-portal
```

Ver logs:

```bash
sudo systemctl status pnpu-portal --no-pager
sudo journalctl -u pnpu-portal -n 100 --no-pager
```

## 8. Verificar localmente en el servidor

```bash
curl -I http://127.0.0.1:3000/
curl http://127.0.0.1:3000/health/live
curl http://127.0.0.1:3000/health/ready
curl http://127.0.0.1:3000/version
curl http://127.0.0.1:3000/health/catalog
```

Forzar refresco controlado del snapshot Omeka:

```bash
curl -X POST http://127.0.0.1:3000/health/catalog/refresh \
  -H "X-PNPU-Refresh-Token: CAMBIAR_TOKEN_REFRESH"
```

## 9. Configurar HAProxy remoto

Backend esperado para PNPU Portal:

```haproxy
backend pnpu_portal_backend
   server pnpu_portal 10.46.6.85:3000 check
```

Backend ya usado para Omeka:

```haproxy
backend catalogo_backend
   server catalogo 10.46.6.85:80 check
```

Rutas publicas esperadas:

```text
https://editorial.reduniv.edu.cu  -> PNPU Portal -> 10.46.6.85:3000
https://catalogo.reduniv.edu.cu   -> Omeka S     -> 10.46.6.85:80
```

## 10. Verificar desde la PC de desarrollo

Desde la raiz del repo:

```powershell
$env:PNPU_ACCEPTANCE_BASE_URL="https://editorial.reduniv.edu.cu"
$env:PNPU_ACCEPTANCE_REQUIRE_OMEKA="true"
npm run acceptance:v0.1
```

Tambien revisar en navegador:

```text
https://editorial.reduniv.edu.cu/
https://editorial.reduniv.edu.cu/publicaciones
https://editorial.reduniv.edu.cu/editoriales
https://editorial.reduniv.edu.cu/colecciones
https://editorial.reduniv.edu.cu/autores
https://editorial.reduniv.edu.cu/materias
https://editorial.reduniv.edu.cu/estado
```

## 11. Instalar perfil PNPU en Omeka

El artefacto `pnpu-portal-0.1.0.tar.gz` es solo runtime de la plataforma. Para preparar Omeka S se
usa un paquete separado de herramientas:

```text
artifacts/pnpu-omeka-tools-0.1.0.tar.gz
artifacts/pnpu-omeka-tools-0.1.0.tar.gz.sha256
```

Checksum actual:

```text
58f7cedf243839d35d045b07c5e99d4b99e0e9501faafa095fc270f014c895a1  pnpu-omeka-tools-0.1.0.tar.gz
```

Desde la PC de desarrollo:

```powershell
npm run package:omeka-tools
scp .\artifacts\pnpu-omeka-tools-0.1.0.tar.gz ituser@IP_SERVIDOR:/tmp/
scp .\artifacts\pnpu-omeka-tools-0.1.0.tar.gz.sha256 ituser@IP_SERVIDOR:/tmp/
```

Para usar el script operativo:

```powershell
scp .\artifacts\pnpu-omeka-tools-0.1.0.tar.gz ituser@IP_SERVIDOR:/home/ituser/updates/
scp .\artifacts\pnpu-omeka-tools-0.1.0.tar.gz.sha256 ituser@IP_SERVIDOR:/home/ituser/updates/
scp .\scripts\deploy-omeka-tools.sh ituser@IP_SERVIDOR:/home/ituser/updates/
```

En el servidor:

```bash
cd /home/ituser/updates
chmod +x deploy-omeka-tools.sh
export PNPU_OMEKA_KEY_IDENTITY="CAMBIAR_KEY_IDENTITY"
export PNPU_OMEKA_KEY_CREDENTIAL="CAMBIAR_KEY_CREDENTIAL"
export PNPU_CATALOG_REFRESH_TOKEN="CAMBIAR_TOKEN_REFRESH"
./deploy-omeka-tools.sh
```

Para no cargar seed de prueba:

```bash
export PNPU_OMEKA_RUN_SEED_SAMPLE=false
```

En el servidor:

```bash
sudo mkdir -p /opt/pnpu/tools/omeka
sudo chown -R ituser:ituser /opt/pnpu/tools
mv /tmp/pnpu-omeka-tools-0.1.0.tar.gz /opt/pnpu/tools/
mv /tmp/pnpu-omeka-tools-0.1.0.tar.gz.sha256 /opt/pnpu/tools/

cd /opt/pnpu/tools
sha256sum -c pnpu-omeka-tools-0.1.0.tar.gz.sha256
tar -xzf pnpu-omeka-tools-0.1.0.tar.gz -C /opt/pnpu/tools/omeka --strip-components=1
cd /opt/pnpu/tools/omeka
```

No ejecutar `npm ci` en este paquete; las herramientas no requieren dependencias externas.

Configurar variables temporales en la sesion SSH:

```bash
export PNPU_OMEKA_BASE_URL="http://127.0.0.1"
export PNPU_OMEKA_KEY_IDENTITY="CAMBIAR_KEY_IDENTITY"
export PNPU_OMEKA_KEY_CREDENTIAL="CAMBIAR_KEY_CREDENTIAL"
export PNPU_OMEKA_TIMEOUT_MS="10000"
```

Ejecutar:

```bash
npm run omeka:check
npm run omeka:install-profile
npm run omeka:check
npm run omeka:seed-sample
npm run omeka:map
```

Refrescar el snapshot de la plataforma:

```bash
curl -X POST http://127.0.0.1:3000/health/catalog/refresh \
  -H "X-PNPU-Refresh-Token: CAMBIAR_TOKEN_REFRESH"
```

Validar:

```bash
curl http://127.0.0.1:3000/health/catalog
curl -I http://127.0.0.1:3000/publicaciones
```

## 12. Flujo de actualizacion recomendado

No subir artefactos `.tar.gz` al repositorio Git. El repositorio contiene codigo, documentacion,
infraestructura y scripts. Los `.tar.gz` son artefactos generados y deben publicarse como artefactos
de release en CI/CD o transferirse por un canal operativo controlado.

Mientras el proyecto siga en desarrollo activo:

1. Implementar cambios en la PC de desarrollo.
2. Ejecutar `npm run quality` y `npm run build`.
3. Actualizar version cuando corresponda, por ejemplo `0.1.1`.
4. Generar `npm run package:release`.
5. Generar `npm run package:omeka-tools` solo cuando cambien scripts o schemas de Omeka.
6. Validar checksums.
7. Publicar artefactos como GitHub Release o artefacto de GitHub Actions.
8. Ejecutar despliegue automatizado con Ansible o workflow aprobado.

Regla practica:

- Si solo cambia la plataforma web/API, subir solo `pnpu-portal-<version>.tar.gz`.
- Si cambian templates, vocabularios, seed o scripts de Omeka, subir tambien
  `pnpu-omeka-tools-<version>.tar.gz`.
- No usar `git pull` en produccion como mecanismo normal de despliegue.

La mejor operacion objetivo es:

- GitHub Actions construye y valida los artefactos.
- El operador aprueba el despliegue.
- Ansible copia artefactos al servidor, cambia el symlink `current`, reinicia systemd y ejecuta
  health checks.
- SSH queda reservado para incidencias o mantenimiento excepcional.

## 13. Operacion basica

Reiniciar:

```bash
sudo systemctl restart pnpu-portal
```

Ver estado:

```bash
sudo systemctl status pnpu-portal --no-pager
```

Ver logs:

```bash
sudo journalctl -u pnpu-portal -f
```

Actualizar variables:

```bash
sudo nano /etc/pnpu/portal.env
sudo systemctl restart pnpu-portal
```

## 14. Rollback manual

Si existe una release anterior en `/opt/pnpu/portal/releases/<version_anterior>`:

```bash
sudo ln -sfn /opt/pnpu/portal/releases/<version_anterior> /opt/pnpu/portal/current
sudo chown -h pnpu:pnpu /opt/pnpu/portal/current
sudo systemctl restart pnpu-portal
curl http://127.0.0.1:3000/health/ready
```

## 15. Criterio de despliegue correcto

El despliegue se considera correcto cuando:

- `systemctl status pnpu-portal` muestra el servicio activo.
- `http://127.0.0.1:3000/health/ready` responde correctamente desde el servidor.
- `https://editorial.reduniv.edu.cu/` abre la plataforma desde fuera.
- `/health/catalog` reporta repositorio `omeka`.
- Las paginas publicas muestran datos reales desde Omeka.
- La aceptacion `npm run acceptance:v0.1` termina con `0 FAIL`.

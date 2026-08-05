# Backup operativo minimo

## Objetivo

Definir una copia operativa minima para poder recuperar PNPU v0.1, Omeka S y Keycloak ante error de
actualizacion, perdida de configuracion o migracion de servidor.

No sustituye una politica institucional completa de backup. Es la base inicial para operacion.

## Alcance

### VM PNPU/catalogo

Respaldar:

- base de datos MySQL/MariaDB de Omeka S;
- configuracion de Omeka S;
- perfil y datos publicados en `/var/www/omeka-s`;
- variables del portal en `/etc/pnpu/portal.env`;
- releases y artefactos del portal en `/opt/pnpu/portal`;
- scripts de updates en `/home/ituser/updates`.

### VM identidad

Respaldar:

- base de datos PostgreSQL de Keycloak;
- `/etc/keycloak/keycloak.env`;
- `/opt/keycloak/themes`;
- export del realm `reduniv`.

## Script

El repositorio incluye:

```text
scripts/backup-operational-state.sh
```

El script detecta los componentes presentes en la VM y genera un directorio comprimible en:

```text
/home/ituser/backups/pnpu-operational-YYYYmmdd-HHMMSS
```

Uso:

```bash
cd /home/ituser/updates
chmod +x backup-operational-state.sh
sudo ./backup-operational-state.sh
```

Variables opcionales:

```bash
BACKUP_ROOT=/home/ituser/backups
OMEKA_DB_NAME=omeka
OMEKA_DB_USER=omeka
OMEKA_DB_PASSWORD='...'
KEYCLOAK_DB_NAME=keycloak
KEYCLOAK_DB_USER=keycloak
KEYCLOAK_DB_PASSWORD='...'
KEYCLOAK_REALM=reduniv
```

Si las credenciales de Omeka no se pasan por variables, el script intenta leerlas desde:

```text
/var/www/omeka-s/config/database.ini
```

## Verificacion

Despues de ejecutar, comprobar:

```bash
ls -lah /home/ituser/backups
find /home/ituser/backups -maxdepth 2 -type f | sort
```

Validar que existan al menos:

```text
manifest.txt
portal-env.tar.gz
keycloak-env.tar.gz
keycloak-themes.tar.gz
omeka-config.tar.gz
```

Si la VM contiene bases de datos locales, deben aparecer:

```text
omeka-db.sql.gz
keycloak-db.dump
```

## Seguridad

- Los backups contienen secretos.
- Deben almacenarse fuera del servidor con permisos restringidos.
- No deben subirse al repositorio.
- Deben cifrarse si se copian a medios externos.

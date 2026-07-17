# Infraestructura PNPU

Automatización inicial de Release 0 para el Portal PNPU.

## Alcance

- Preparación de directorios `/opt/pnpu/portal`.
- Usuario de servicio `pnpu`.
- Archivo de entorno externo en `/etc/pnpu/portal.env`.
- Unidad `systemd` para `pnpu-portal`.
- Verificación de health checks.
- Transferencia, verificación SHA-256 y descompresión de artefactos versionados.
- Registro de metadata de despliegue en `shared/deployments`.

## Restricciones

- No utiliza Docker, Docker Compose, Podman ni Kubernetes.
- No almacena secretos en el repositorio.
- No contiene inventario real de producción.

## Verificación local

```bash
python scripts/validate-infrastructure.py
```

## Variables de despliegue

Las rutas de artefactos se definen por entorno y no contienen secretos.

```yaml
pnpu_release_version: 0.1.0
pnpu_release_artifact_local_path: artifacts/pnpu-portal-0.1.0.tar.gz
pnpu_release_checksum_local_path: artifacts/pnpu-portal-0.1.0.tar.gz.sha256
```

El repositorio de catálogo se selecciona con una variable explícita:

```yaml
pnpu_catalog_repository: in-memory
pnpu_omeka_base_url: ""
pnpu_omeka_timeout_ms: 2000
```

`in-memory` es el único modo activo para Release 1 inicial. El valor futuro `omeka` está bloqueado
en la aplicación hasta que exista un mapeo aprobado entre Resource Templates de Omeka S y el modelo
canónico PNPU. `pnpu_omeka_base_url` debe configurarse fuera del repositorio cuando se use para
health checks de integración.

La validación completa de sintaxis Ansible se ejecuta en CI sobre Ubuntu:

```bash
ansible-playbook -i infrastructure/inventories/dev/hosts.yml infrastructure/playbooks/provision.yml --syntax-check
ansible-playbook -i infrastructure/inventories/dev/hosts.yml infrastructure/playbooks/deploy.yml --syntax-check
ansible-playbook -i infrastructure/inventories/dev/hosts.yml infrastructure/playbooks/verify.yml --syntax-check
ansible-playbook -i infrastructure/inventories/dev/hosts.yml infrastructure/playbooks/rollback.yml --syntax-check
```

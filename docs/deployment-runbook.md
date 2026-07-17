# Runbook de despliegue del Portal PNPU

## Objetivo

Desplegar un artefacto versionado del Portal PNPU sobre Ubuntu Server mediante Ansible y systemd.

## Precondiciones

- Artefacto `.tar.gz` generado por `npm run package:release`.
- Checksum validado con `npm run package:validate`.
- Variables de entorno externas configuradas en `/etc/pnpu/portal.env`.
- VM accesible por Ansible mediante SSH.
- HAProxy preparado para usar `/health/ready`.
- Node.js y npm disponibles en la ruta definida por `pnpu_node_bin`.

## Flujo

1. Ejecutar controles de calidad.
2. Generar artefacto de release.
3. Validar checksum y contenido del artefacto.
4. Copiar artefacto al nodo objetivo.
5. Validar checksum SHA-256 en el nodo objetivo.
6. Descomprimir en `/opt/pnpu/portal/releases/<version>`.
7. Instalar dependencias de producción con `npm ci --omit=dev`.
8. Construir assets de producción con `npm run build`.
9. Actualizar `current`.
10. Reiniciar `pnpu-portal`.
11. Validar `/health/live` y `/health/ready`.
12. Registrar versión, fecha, operador y resultado.

## Comandos de referencia

```bash
npm run quality
npm run build
npm run package:release
npm run package:validate
ansible-playbook -i infrastructure/inventories/dev/hosts.yml infrastructure/playbooks/deploy.yml
```

## Criterio de éxito

- `systemctl status pnpu-portal` indica servicio activo.
- `/health/ready` devuelve `status=ready`.
- `/health/ready` devuelve la versión indicada en `pnpu_release_version`.
- Existe metadata de despliegue en `shared/deployments/<version>.json`.
- HAProxy puede reincorporar el nodo al balanceo.

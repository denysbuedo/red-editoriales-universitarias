# Runbook de rollback del Portal PNPU

## Objetivo

Restaurar una release anterior del Portal PNPU sin reconstruir la aplicación.

## Disparadores

- Falla `/health/ready` después del despliegue.
- Error crítico de arranque de `systemd`.
- Regresión operativa validada por QA, DevOps o Arquitectura.

## Flujo

1. Retirar la instancia del balanceador HAProxy.
2. Confirmar la versión anterior disponible en `/opt/pnpu/portal/releases`.
3. Actualizar `current` hacia la release anterior.
4. Reiniciar `pnpu-portal`.
5. Ejecutar health checks y validar la versión esperada.
6. Reincorporar la instancia al balanceador.
7. Registrar metadata de rollback en `shared/deployments`.
8. Registrar incidente y resultado.

## Comando de referencia

```bash
ansible-playbook -i infrastructure/inventories/dev/hosts.yml infrastructure/playbooks/rollback.yml
```

## Criterio de éxito

- `/health/live` devuelve `status=ok`.
- `/health/ready` devuelve `status=ready`.
- `/health/ready` devuelve la versión indicada en `pnpu_previous_release_version`.
- El tráfico vuelve a la versión estable anterior.

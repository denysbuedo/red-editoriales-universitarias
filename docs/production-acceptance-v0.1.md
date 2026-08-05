# Aceptacion de produccion v0.1 - PNPU Portal

## Objetivo

Confirmar que la base operativa v0.1 de PNPU Portal funciona en produccion antes de continuar con
mas funcionalidad.

Esta aceptacion cubre:

- portal publico;
- catalogo Omeka S;
- estado operativo;
- autenticacion Keycloak con 2FA;
- area administrativa;
- importaciones de publicaciones;
- despliegue systemd sin Docker.

## Entorno esperado

```text
Portal: https://editorial.reduniv.edu.cu
Catalogo Omeka S: https://catalogo.reduniv.edu.cu
Identidad: https://identidad.reduniv.edu.cu
Servidor PNPU: vm-catalogoeditoriales
Puerto interno PNPU: 3000
```

## Checklist publico

Validar en navegador:

```text
https://editorial.reduniv.edu.cu/
https://editorial.reduniv.edu.cu/acerca
https://editorial.reduniv.edu.cu/publicaciones
https://editorial.reduniv.edu.cu/editoriales
https://editorial.reduniv.edu.cu/colecciones
https://editorial.reduniv.edu.cu/autores
https://editorial.reduniv.edu.cu/materias
https://editorial.reduniv.edu.cu/estado
```

Resultado esperado:

- el header institucional aparece en todas las paginas;
- el footer muestra el soporte de Reduniv/MES;
- los enlaces principales navegan correctamente;
- los conteos del home coinciden con el catalogo visible;
- las fichas de publicaciones muestran editorial, coleccion, ISBN/DOI, licencia y recursos cuando
  existan;
- no hay enlaces a `localhost`, `127.0.0.1` ni dominios anteriores.

## Checklist operativo en servidor

Ejecutar en `vm-catalogoeditoriales`:

```bash
curl http://127.0.0.1:3000/health/live
curl http://127.0.0.1:3000/health/ready
curl http://127.0.0.1:3000/health/catalog
curl http://127.0.0.1:3000/version
```

Resultado esperado:

- `/health/live` responde `status: ok`;
- `/health/ready` responde `status: ready`;
- `/health/catalog` responde `status: ready`;
- Omeka aparece disponible;
- el snapshot reconoce publicaciones, editoriales, autores, materias, colecciones y recursos;
- `/version` muestra el commit desplegado.

## Checklist Omeka S

Validar:

```text
https://catalogo.reduniv.edu.cu/admin
https://catalogo.reduniv.edu.cu/api/items
```

Resultado esperado:

- Omeka abre sin usar `/omeka-s`;
- el API responde;
- existen los vocabularios y plantillas PNPU;
- el perfil PNPU no reporta propiedades faltantes.

## Checklist Keycloak/OIDC

Validar:

```text
https://identidad.reduniv.edu.cu/realms/pnpu/.well-known/openid-configuration
https://editorial.reduniv.edu.cu/admin
```

Flujo esperado:

1. `/admin` redirige a Keycloak.
2. El usuario `admin-pnpu` inicia sesion.
3. Keycloak solicita 2FA.
4. El portal vuelve a `https://editorial.reduniv.edu.cu/admin`.
5. La pagina muestra `Sesion OIDC activa`.
6. El boton `Cerrar sesion` regresa al portal publico.

Roles minimos del usuario administrador:

```text
pnpu-admin
pnpu-import-reader
pnpu-import-writer
pnpu-import-rollback
```

## Checklist de importaciones

Validar en:

```text
https://editorial.reduniv.edu.cu/admin/importaciones/publicaciones
```

Resultado esperado:

- la pagina muestra la sesion activa;
- se puede ejecutar diagnostico con un XLSX existente en la carpeta de importaciones;
- `Preview mapeo` responde sin error;
- `Autoridades Omeka` lista editoriales/materias/contribuyentes reconocidos;
- acciones de escritura y rollback quedan disponibles solo para roles autorizados.

## Checklist desde PC de desarrollo

Si la red permite acceso externo:

```powershell
$env:PNPU_ACCEPTANCE_BASE_URL="https://editorial.reduniv.edu.cu"
$env:PNPU_ACCEPTANCE_REQUIRE_OMEKA="true"
npm run acceptance:v0.1
```

Resultado esperado:

```text
0 FAIL
```

## Pendientes controlados para proxima fase

- Validar importacion con fichero real de una editorial.
- Revisar expiracion de sesion y politica de logout global con Keycloak.
- Formalizar gestion de usuarios y roles en manual de administrador.
- Pasar datos propios de plataforma a PostgreSQL cuando se implemente el dominio correspondiente.
- Integrar API externa de editoriales como fuente principal cuando el sistema institucional este
  disponible.
- Completar Ansible para despliegue repetible.
- Automatizar publicacion de artefactos con GitHub Actions.

## Criterio de cierre v0.1

La fase v0.1 se considera cerrada cuando:

- todos los checklist anteriores pasan;
- no existen errores 5xx en navegacion normal;
- `/admin` funciona con Keycloak y 2FA;
- `/health/catalog` esta `ready`;
- el despliegue esta documentado con checksum vigente;
- los pendientes estan registrados y aceptados.

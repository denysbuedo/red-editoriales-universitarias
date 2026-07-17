# Release 0 - Fundación técnica

## Alcance

Este incremento introduce la base ejecutable del portal PNPU sin funcionalidad de negocio.

## Componentes

- Next.js con App Router.
- React y TypeScript en modo estricto.
- Tailwind CSS.
- ESLint y Prettier.
- Vitest para pruebas automatizadas.
- GitHub Actions para lint, typecheck, pruebas y build.
- Husky y Commitlint para controles locales de calidad y commits convencionales.
- MkDocs Material para documentación técnica.
- Dependabot para dependencias npm, pip y GitHub Actions.
- CodeQL para análisis estático de seguridad.
- Plantilla de Pull Request con checklist de arquitectura, calidad y seguridad.
- Esqueleto Ansible para provisionamiento, despliegue, verificación y rollback.
- Unidad `systemd` parametrizada para el Portal PNPU.
- Script de health check para despliegues sobre Ubuntu Server.
- Cabeceras HTTP de seguridad configuradas en Next.js.
- Contrato OpenAPI 3.1 mínimo para endpoints técnicos de salud.
- Empaquetado de release con artefacto `.tar.gz`, checksum SHA-256, manifest, changelog y SBOM.
- Validación automática del artefacto de release antes de publicarlo en CI.
- Configuración runtime tipada mediante `PNPU_PUBLIC_BASE_URL`.
- `robots.txt` y `sitemap.xml` técnicos para SEO inicial.
- Runbooks de despliegue y rollback.
- Trazabilidad HTTP mediante `X-Correlation-Id`.
- Publicación del contrato OpenAPI en `/openapi.yaml`.
- Metadata operativa en `/version`.
- Métricas Prometheus básicas en `/metrics`.
- Configuración inicial de Prometheus y alertas del Portal PNPU.
- Runbook de observabilidad.
- Logs estructurados JSON con `X-Correlation-Id` y controles de nivel/activación.
- Pruebas de humo contra servidor Next.js real.
- Despliegue Ansible con transferencia de artefacto, verificación SHA-256 y registro de metadata.
- Rollback Ansible con validación de versión y registro de metadata.
- Health checks `/health/live` y `/health/ready`.

## Cabeceras de seguridad

La configuración del portal aplica las cabeceras obligatorias definidas por la arquitectura de
seguridad:

- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `Content-Security-Policy`

## Runtime

- Node.js 22.13.0 o superior.
- npm 10 o superior.

## Seguridad de dependencias

El proyecto usa `overrides.postcss` para forzar una versión de PostCSS sin vulnerabilidades
moderadas conocidas, incluida la dependencia transitiva usada por Next.js.

## Restricciones aplicadas

- No se incorpora Docker ni tecnología de contenedores.
- No se agrega persistencia ni integración externa.
- No se implementa lógica de dominio editorial.
- No se modifican ADRs, modelos de información ni esquemas.

## Verificación local

```bash
npm run dev:local
npm run quality
npm audit --audit-level=moderate
npm run build
npm run smoke
npm run package:release
npm run package:validate
```

## Verificación detallada

```bash
npm run lint
npm run typecheck
npm test
npm audit --audit-level=moderate
npm run build
npm run smoke
npm run package:release
npm run package:validate
mkdocs build --strict
python scripts/validate-infrastructure.py
python scripts/validate-openapi.py
ansible-playbook -i infrastructure/inventories/dev/hosts.yml infrastructure/playbooks/provision.yml --syntax-check
```

El servidor local de desarrollo queda disponible en `http://127.0.0.1:4307`.

## Controles de Pull Request

Toda Pull Request debe declarar alcance, verificación ejecutada, impacto arquitectónico y
controles de seguridad aplicados. La plantilla se encuentra en `.github/pull_request_template.md`.

## Convenciones de commit

Los commits deben seguir Conventional Commits. Tipos permitidos por la configuración base:

- `build`
- `chore`
- `ci`
- `docs`
- `feat`
- `fix`
- `perf`
- `refactor`
- `revert`
- `style`
- `test`

Alcances permitidos:

- `app`
- `architecture`
- `build`
- `ci`
- `docs`
- `schemas`
- `security`
- `tests`

Ejemplo:

```text
ci(security): agregar codeql y dependabot
```

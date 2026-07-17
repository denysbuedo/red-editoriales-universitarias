# Guía de implementación Release 1

## Objetivo

Orientar la primera implementación de dominio sin redefinir la arquitectura.

## Módulo inicial

```text
src/modules/catalog/
├── domain/
├── application/
├── infrastructure/
└── interfaces/
```

## Reglas

- El dominio no importa Next.js.
- El dominio no importa PostgreSQL, Omeka ni HTTP.
- Los Value Objects validan y normalizan.
- Los route handlers llaman servicios de aplicación.
- Los DTOs no exponen identificadores técnicos internos.

## Primer incremento de código

Implementar Value Objects:

- `PnpuUuid`
- `Isbn`
- `Doi`
- `Orcid`
- `LanguageCode`

## Pruebas mínimas

- creación válida;
- rechazo de valores vacíos;
- normalización;
- validación de checksum ISBN;
- validación de checksum ORCID;
- preservación de errores descriptivos.

## Convención de errores

Los errores de dominio no deben ser respuestas HTTP. La traducción a `PNPU-404`, `PNPU-422` u
otros códigos ocurre en la capa `interfaces/http`.

## Prohibiciones

- No conectar a Omeka S en el primer incremento.
- No crear tablas PostgreSQL antes de definir puertos y casos de uso.
- No añadir autenticación hasta que la arquitectura de identidad esté aplicada.
- No crear endpoints fuera de `/v1`.

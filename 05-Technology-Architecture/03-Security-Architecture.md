---
title: Security Architecture
version: 1.0
status: Draft
owner: Ministerio de Educación Superior
project: Plataforma Nacional de Publicaciones Universitarias (PNPU)
authors:
  - Equipo de Arquitectura
last_update: 2026-07-14
related_documents:
  - 01-Technology-Stack.md
  - 02-Infrastructure-Architecture.md
  - ../04-Application-Architecture/*
---

# Security Architecture

# 1. Objetivo

Este documento define la arquitectura de seguridad de la Plataforma Nacional de Publicaciones Universitarias (PNPU).

La arquitectura de seguridad establece las políticas, principios, mecanismos técnicos y responsabilidades necesarias para proteger:

- la información;
- los servicios;
- la infraestructura;
- las aplicaciones;
- los usuarios;
- los activos digitales.

Su propósito es garantizar la confidencialidad, integridad, disponibilidad y trazabilidad de toda la plataforma.

---

# 2. Alcance

Aplica a:

- Portal PNPU
- Omeka S
- Sistema de Gestión de Editoriales
- API Pública
- Observatorio Editorial
- Servicios de autenticación
- Bases de datos
- Infraestructura
- Backups
- Sistemas de monitoreo

---

# 3. Referencias

La arquitectura toma como referencia:

- OWASP ASVS 5
- OWASP Top 10
- NIST Cybersecurity Framework 2.0
- CIS Controls v8
- CIS Ubuntu Benchmark
- PostgreSQL Security Guide
- PHP Security Best Practices
- Node.js Security Best Practices
- OAuth 2.1
- OpenID Connect
- RFC 7519 (JWT)

---

# 4. Objetivos de Seguridad

La plataforma deberá garantizar:

## Confidencialidad

La información sólo podrá ser consultada por usuarios autorizados.

---

## Integridad

Toda modificación deberá ser autorizada, registrada y verificable.

---

## Disponibilidad

Los servicios deberán permanecer disponibles según los niveles de servicio definidos.

---

## Autenticidad

Toda identidad deberá ser verificable.

---

## Trazabilidad

Toda operación importante deberá poder reconstruirse posteriormente.

---

# 5. Principios

## SEC-001

Denegar por defecto.

Todo acceso estará prohibido salvo autorización explícita.

---

## SEC-002

Mínimo privilegio.

Cada usuario dispondrá únicamente de los permisos necesarios.

---

## SEC-003

Defensa en profundidad.

La seguridad se implementará en múltiples capas.

---

## SEC-004

No confiar en la red.

El hecho de encontrarse dentro de la red institucional no implica confianza automática.

---

## SEC-005

Separación de responsabilidades.

Los distintos componentes deberán ejecutarse con usuarios independientes.

---

## SEC-006

Auditoría permanente.

Toda operación relevante deberá quedar registrada.

---

## SEC-007

Automatización.

Las configuraciones de seguridad deberán ser reproducibles mediante Ansible.

---

# 6. Arquitectura de Seguridad

```text
Internet

↓

HAProxy

↓

Portal

↓

BFF

↓

Servicios

↓

Bases de datos

↓

Backups
```

Cada nivel constituye una capa de protección.

---

# 7. Activos

Los activos principales son:

- publicaciones;
- autores;
- editoriales;
- universidades;
- usuarios;
- credenciales;
- metadatos;
- archivos digitales;
- backups;
- configuraciones;
- registros de auditoría.

---

# 8. Clasificación de Información

| Nivel | Descripción |
|---------|------------|
| Pública | Visible para cualquier usuario |
| Institucional | Uso interno |
| Restringida | Solo personal autorizado |
| Confidencial | Información sensible |

---

# 9. Roles

## Visitante

Puede consultar información pública.

---

## Editor

Puede administrar contenidos editoriales.

---

## Catalogador

Administra metadatos.

---

## Administrador Editorial

Administra únicamente su editorial.

---

## Administrador PNPU

Administra la plataforma.

---

## Administrador Infraestructura

Administra servidores.

No administra contenido.

---

## Auditor

Acceso de solo lectura a registros.

---

# 10. Gestión de Identidades

La autenticación deberá centralizarse.

Proveedor recomendado:

Keycloak.

En caso de existir un proveedor institucional compatible con OpenID Connect, podrá sustituir a Keycloak.

---

# 11. Autenticación

Métodos soportados.

- Usuario y contraseña.
- OpenID Connect.
- OAuth2.
- LDAP.
- Active Directory.
- MFA.

---

# 12. Políticas de Contraseña

Longitud mínima

12 caracteres.

Requisitos

- mayúsculas;
- minúsculas;
- números;
- caracteres especiales.

Se prohibirá reutilizar contraseñas recientes.

---

# 13. MFA

Obligatorio para:

- administradores;
- operadores;
- infraestructura.

Recomendado para todos los usuarios internos.

---

# 14. Gestión de Sesiones

Las sesiones deberán:

- expirar automáticamente;
- invalidarse al cerrar sesión;
- invalidarse al cambiar contraseña;
- invalidarse cuando exista actividad sospechosa.

---

# 15. Tokens

Los JWT deberán:

- tener expiración;
- estar firmados;
- no contener información sensible;
- utilizar HTTPS exclusivamente.

---

# 16. Autorización

Modelo:

RBAC.

Cada permiso estará asociado a un rol.

Nunca a usuarios individuales.

---

# 17. Matriz de Acceso

| Recurso | Visitante | Editor | Admin Editorial | Admin PNPU |
|----------|-----------|---------|-----------------|------------|
| Publicaciones | R | RW | RW | RW |
| Editoriales | R | - | RW propia | RW |
| Usuarios | - | - | - | RW |
| Configuración | - | - | - | RW |
| Logs | - | - | - | R |

---

# 18. Separación de Usuarios Linux

Cada servicio utilizará su propio usuario.

Ejemplo

pnpu

omeka

postgres

redis

grafana

prometheus

matomo

keycloak

Ningún servicio utilizará root.

---

# 19. Variables de Entorno

Las credenciales nunca estarán dentro del código.

Se almacenarán en:

```
/etc/pnpu/
```

Permisos

600

Propietario

usuario del servicio.

---

# 20. Gestión de Secretos

Secretos incluidos:

- contraseñas;
- API Keys;
- JWT Secret;
- claves SMTP;
- credenciales PostgreSQL;
- credenciales Redis.

Los secretos deberán rotarse periódicamente.

---

# 21. Seguridad del HAProxy

El HAProxy será responsable de:

- TLS;
- HSTS;
- redirección HTTPS;
- balanceo;
- health checks;
- limitación básica de conexiones;
- ocultamiento de servidores internos.

No almacenará datos de negocio.

---

# 22. Requisitos para las Aplicaciones

Todas las aplicaciones deberán:

- validar entradas;
- escapar salidas;
- utilizar consultas parametrizadas;
- validar autorización;
- registrar auditoría;
- evitar información sensible en errores.

---

# 23. Protección CSRF

Obligatoria para:

- formularios;
- panel administrativo;
- operaciones POST;
- PUT;
- DELETE.

---

# 24. Protección XSS

Obligatoria.

Todo contenido HTML deberá sanitizarse.

---

# 25. Protección SQL Injection

Obligatoria.

Solo consultas parametrizadas.

Queda prohibida la concatenación de SQL.

---

# 26. Cabeceras HTTP

Obligatorias.

- HSTS
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy
- CSP

---

# 27. Rate Limiting

Se aplicará sobre:

- login;
- APIs;
- búsqueda;
- formularios.

Redis será utilizado para almacenar contadores.

---

# 28. Auditoría

Toda operación crítica deberá registrar:

- usuario;
- IP;
- fecha;
- recurso;
- operación;
- resultado.

---

# 29. Logging

Los logs deberán centralizarse.

No contendrán:

- contraseñas;
- tokens;
- secretos.

---

# 30. Criterios de aceptación

La arquitectura de seguridad será considerada aprobada cuando:

- todas las aplicaciones utilicen HTTPS mediante HAProxy;
- exista autenticación centralizada;
- exista RBAC;
- exista MFA para administradores;
- los secretos permanezcan fuera del código;
- las aplicaciones no se ejecuten como root;
- exista auditoría completa;
- las aplicaciones cumplan OWASP Top 10;
- las configuraciones sean reproducibles mediante Ansible.
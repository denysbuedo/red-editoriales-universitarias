# Exportacion Zenodo

## Estado v0.1

La PNPU incorpora una exportacion administrativa de metadatos candidatos para Zenodo en:

```text
GET /api/admin/catalog/zenodo-export
```

El endpoint lee el catalogo activo PNPU, genera un paquete JSON de revision y no realiza acciones
remotas sobre Zenodo.

## Alcance Implementado

Incluido:

- serializacion de publicaciones PNPU hacia un paquete candidato compatible con revision Zenodo;
- metadatos bibliograficos basicos: titulo, fecha, idioma, licencia, palabras clave, autores,
  identificadores y recursos digitales;
- advertencias operativas cuando falta DOI, autores con rol `author` o recursos digitales;
- proteccion administrativa con los mismos controles OIDC/token de importaciones.

No incluido:

- creacion de depositos Zenodo;
- reserva automatica de DOI;
- subida de archivos a Zenodo;
- publicacion remota;
- sincronizacion bidireccional de estados PNPU-Zenodo.

## Criterio Arquitectonico

La integracion automatica con Zenodo requiere una ADR antes de escribir contra su API. El flujo
propuesto para esa ADR es:

1. PNPU mantiene el UUID nacional como identificador interno estable.
2. El administrador nacional exporta y revisa el paquete candidato.
3. PNPU crea un deposito borrador en Zenodo cuando exista decision aprobada.
4. Zenodo devuelve DOI reservado.
5. PNPU registra el DOI reservado en Omeka antes de publicar definitivamente.
6. PNPU publica en Zenodo y marca el DOI como verificado.

Esto evita que el DOI sea la primera fuente de identidad de PNPU y reduce el riesgo de publicar
registros incompletos.

## Uso Operativo Inicial

Desde la plataforma:

```text
Administracion -> Diagnostico del catalogo -> Exportar Zenodo
```

Desde terminal, con token administrativo local solo si sigue habilitado:

```bash
curl -H "X-PNPU-Admin-Token: TOKEN" \
  https://editorial.reduniv.edu.cu/api/admin/catalog/zenodo-export \
  -o pnpu-zenodo-metadata.json
```

Con OIDC, usar una sesion administrativa del navegador o un bearer token con rol `pnpu-admin` o
`pnpu-import-reader`.

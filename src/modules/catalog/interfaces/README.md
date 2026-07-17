# Catalog interfaces layer

Contendra adaptadores de entrada y salida externos del modulo, incluyendo controladores HTTP.

Los route handlers no deben contener logica de negocio. Deben validar entrada superficial, invocar
servicios de aplicacion y traducir errores del dominio a respuestas API normalizadas.

# Sitio de Jhon Steven Alvarez Ruiz

Sitio personal, blog y portafolio de **Jhon Steven Alvarez Ruiz** — economista,
analista de datos y desarrollador en Neiva, Colombia. El HTML público se genera
sin dependencias; las funciones privadas de Vercel permiten publicar escritos y
consultar una auditoría anónima desde `/admin/`.

```bash
npm test                  # seguridad, contenido, audio, rutas y snapshots
npm run build             # genera publico/
npm run servir            # http://127.0.0.1:8099
npm run sync:github       # actualiza los repositorios públicos
npm run sync:activity     # actualiza el agregado del ledger local
```

## Arquitectura

| Pieza | Responsabilidad |
|---|---|
| `datos.js` | Perfil, experiencia y proyectos seleccionados. |
| `datos-github.js` | Snapshot seguro de todos los repositorios públicos propios. |
| `datos-actividad.js` | Totales anónimos de tokens, llamadas, tareas y proveedores. |
| `escritos/*.md` | Fuente editorial del blog. |
| `plantilla.js` | Cabecera, navegación, SEO y JSON-LD comunes. |
| `construir.js` | Blog, proyectos, actividad, feed, sitemap y HTML estático. |
| `api/` y `lib/` | Autenticación, CMS y auditoría en funciones de Vercel. |
| `activos/animacion.js` | Movimiento, audio persistente y navegación progresiva. |

La navegación interna reemplaza únicamente el contenido principal. El elemento
`<audio>` permanece vivo, por lo que cambiar de Inicio a Blog o Proyectos no
reinicia ni apaga la obra.

## Música

La obra es la **Sinfonía n.º 5 en do menor, op. 67 de Beethoven**, interpretada
por la Skidmore College Orchestra. Es una grabación real completa de 35:41,
almacenada localmente como MP3; el navegador no sintetiza notas ni consulta un
servicio de terceros.

La procedencia, los cuatro movimientos originales, la declaración de dominio
público y la huella SHA-256 están en
`activos/beethoven-quinta-sinfonia.LICENCIA.md`.

## Blog y panel privado

Cada escrito es Markdown con un encabezado pequeño y validado:

```markdown
---
titulo: Una idea concreta
categoria: Análisis
fecha: 2026-08-23
resumen: Una descripción breve para la portada y los buscadores.
etiquetas: datos, Colombia
---

Texto del artículo…
```

El panel `/admin/` permite crear y actualizar estos archivos mediante la API de
contenidos de GitHub. Cada publicación queda versionada en `master`; la
integración GitHub–Vercel vuelve a construir automáticamente el sitio.

Variables de entorno requeridas en Vercel:

| Variable | Uso |
|---|---|
| `ADMIN_USER` | Usuario único del panel. |
| `ADMIN_PASSWORD_HASH` | Hash `scrypt`, nunca la contraseña en texto. |
| `SESSION_SECRET` | Secreto aleatorio de al menos 32 bytes. |
| `GITHUB_SITE_TOKEN` | Token server-only con Contents lectura/escritura en `SirHegel/sitio`. |
| `GITHUB_AUDIT_REPO` | Repositorio privado de auditoría; en producción, `SirHegel/sitio-auditoria`. |
| `GITHUB_AUDIT_TOKEN` | Requerido y separado por configuración; debe limitarse al repositorio de auditoría. |
| `GITHUB_AUDIT_BRANCH` | Opcional; si falta se usa la rama predeterminada. |
| `IPAPI_KEY` | Opcional; mejora la disponibilidad de la estimación VPN/proxy/Tor. |
| `SITE_ORIGIN` | Origen canónico, por ejemplo `https://jhonstevenalvarezruiz.vercel.app`. |

Las cookies de sesión son `HttpOnly`, `Secure`, `SameSite=Strict` y están
firmadas. Las mutaciones requieren origen coincidente y token CSRF. El Markdown
se valida tanto al escribir como al leer.

## Auditoría y privacidad

Vercel Web Analytics es la fuente principal para visitantes, páginas, rutas,
países y dispositivos agregados. No usa cookies de seguimiento. El sistema
propio conserva únicamente el primer ingreso de cada sesión: hora, primera ruta,
dominio referente, país, región, ciudad, clase de dispositivo, sistema,
navegador y estimación de VPN/proxy/Tor.

La IP se entrega transitoriamente a `ipapi.is` para clasificar la red y el código
del sitio la descarta: no la escribe, muestra, cifra ni convierte en hash. El
proveedor externo y la infraestructura pueden procesarla bajo sus condiciones;
la página pública `/privacidad/` explica ese límite. Tampoco se conservan
coordenadas ni el User-Agent completo.

La muestra diaria vive en un repositorio privado distinto. La rama activa y el
panel conservan una ventana máxima de 90 días; como Git mantiene el historial de
commits, retirar un archivo de esa rama no equivale a borrarlo de todo el
historial remoto. Un límite distribuido del firewall —12 solicitudes cada diez
minutos por IP y huella TLS— protege las variantes con y sin barra final de
`/api/visita` y `/api/auth/entrar`. La detección de VPN sigue siendo una
estimación: una VPN residencial o nueva puede no ser identificada y una red
corporativa puede parecer un proxy.

## Sincronización automática

`.github/workflows/sincronizar-portafolio.yml` consulta GitHub cada hora.
Excluye forks y repositorios privados, sanea los README y solo crea un commit
cuando cambia el catálogo.

La actividad de Orquesta IA nace en un ledger local que no debe subir a GitHub.
`herramientas/sincronizar-actividad.js` publica únicamente agregados. El timer de
usuario incluido en `despliegue/systemd/` ejecuta el exportador cada hora y se
detiene si encuentra trabajo manual sin guardar:

```bash
mkdir -p ~/.config/systemd/user
cp despliegue/systemd/sitio-actividad.* ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now sitio-actividad.timer
```

## Despliegue

Vercel ejecuta `node construir.js`, sirve `publico/` y detecta las funciones de
`api/`. `vercel.json` añade CSP, cabeceras de seguridad, caché revalidable para
activos y `no-store` para las respuestas privadas.

La verificación continua está en `.github/workflows/verificar.yml`; todo cambio
debe pasar las pruebas antes de considerarse publicable.

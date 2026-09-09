# Sitio de Jhon Steven Alvarez Ruiz

Sitio personal, blog y portafolio de **Jhon Steven Alvarez Ruiz** — analista de
datos y desarrollador de automatización en Neiva, Colombia. Genera HTML estático;
React/Preact y MapLibre se cargan para los mapas del estudio. Las funciones privadas
de Vercel permiten publicar escritos y consultar registros de seguridad en `/admin/`.

```bash
npm test                  # seguridad, contenido, audio, rutas y snapshots
npm run build             # genera publico/
npm run cv                # regenera la hoja de vida ATS en HTML y PDF
npm run servir            # http://127.0.0.1:8099
npm run sync:github       # actualiza los repositorios públicos
npm run sync:activity     # actualiza el agregado del ledger local
```

## Arquitectura

| Pieza | Responsabilidad |
|---|---|
| `datos.js` | Perfil, experiencia y proyectos seleccionados. |
| `datos-github.js` | Snapshot seguro de repositorios propios, inventarios, releases, PR externas, logros y métricas fijadas a revisión. |
| `datos-actividad.js` | Totales anónimos de tokens, llamadas, tareas y proveedores. |
| `escritos/*.md` | Fuente editorial del blog. |
| `plantilla.js` | Cabecera, navegación, SEO y JSON-LD comunes. |
| `construir.js` | Blog, proyectos, actividad, feed, sitemap y HTML estático. |
| `juegos.js` y `activos/juegos.css` | Catálogo `/juegos/`: Neiva Abierta y Bloquitos, enlaces directos y presentación adaptable al celular. |
| `datos/descarga-neiva.json` y `descarga-neiva.js` | Descarga nativa: exige URL, SHA, bytes, plataforma y comprobante de ejecución coincidentes. |
| `herramientas/preparar-descarga-neiva.mjs` | Coteja el archivo ya descargado; sin `--aplicar` no activa enlaces. [Flujo de publicación](documentos/neiva-descarga.md). |
| `api/` y `lib/` | Autenticación, CMS y auditoría en funciones de Vercel. |
| `activos/animacion.js` | Movimiento, audio persistente y navegación progresiva. |
| `activos/cinematografia.js` | Un contexto 3D persistente, cámara, calidad adaptativa, menú y pausa. |
| `activos/observatorio-3d.js` y `observatorio.css` | Geometría Three.js procedural y dirección visual del observatorio. |
| `ciencia.js` y `activos/modelo-ciencia.js` | Laboratorio de interferencia, modelo auditable y problema inverso. |
| `activos/lectura-accesible.js` | Desplazamiento de tablas y fórmulas mediante teclado. |
| `datos/continuidad-publicacion-oro.json` | Estado del artículo ya publicado y SHA del manuscrito revisado. |

La navegación interna reemplaza únicamente el contenido principal. El elemento
`<audio>` permanece vivo, por lo que cambiar de Inicio a Blog o Proyectos no
reinicia ni apaga la obra.

La entrada y todas las páginas comparten una habitación modelada con Three.js:
terciopelo, suelo chevrón, lámpara, butaca y un instrumento orbital de cromo.
No se cargan fotografías ni videos como escenografía. El puntero mueve la
cámara; los objetos y sus controles equivalentes permiten modificar luz, telón
u órbita. Se compila `observatorio-motor.js` con esbuild en cada construcción.

El reloj sigue `requestAnimationFrame`; la opción Auto reduce la resolución si
120 cuadros consecutivos promedian más de 25 ms. Alta permite DPR hasta 2;
Ligera usa 0,85. La frecuencia alcanzada depende del equipo. La pausa, el
movimiento reducido y la pestaña oculta detienen el reloj de la sala. Sin WebGL
permanecen contenido, navegación y controles científicos de lectura. La entrada
opcional ofrece música o silencio y se puede omitir con Escape.

`/ciencia/` reúne tres estudios con modelos 3D: reserva vesicular, depuración
de dopamina y estabilidad de circuitos excitatorios/inhibitorios. Cada ficha
explica un problema, permite resolverlo y exporta sus curvas. Se derivan diseños
que conservan incertidumbre y se publican pruebas, antecedentes y límites.
La prioridad científica no está establecida; los ensayos son sintéticos y no
constituyen validación biológica. El estudio anterior sigue disponible en
`/ciencia/interferencia/`.

`node herramientas/investigar-neuro.mjs` reproduce los casos fijados en
`docs/neuro-protocolo.json` y escribe `activos/resultados-neuro.json`.
`node --test pruebas/neuro-modelos.test.mjs pruebas/neuro-interfaz.test.mjs`
comprueba cálculo e interacción. Las demostraciones están en
`docs/neurociencia.md`. La dopamina usa un conformero computacional de PubChem
CID 681; los otros modelos son esquemas geométricos. Dos entradas de esbuild
comparten Three.js para evitar cargar dos copias de la biblioteca.

Las 24 fichas de proyectos incluyen explicaciones de entrada, proceso, salida,
tecnologías y límites, contrastadas con revisiones fijas de código. El generador
`proyecto-explicaciones.js` corrige descripciones que no correspondían al código
sin alterar el inventario medido. Alcance en `docs/proyectos-explicados.md`.
Las referencias audiovisuales y su método de inspección siguen disponibles en
`documentos/referencias-observatorio.md`.

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
Solo `master` despliega automáticamente; las demás ramas están deshabilitadas.
El artículo especial de oro conserva su fuente MDX y mapas. Su acta de continuidad
permite reconstruir una publicación existente sin declarar cerrado el derecho de
réplica. Un manuscrito que no coincida con su SHA detiene la compilación.

Variables de entorno requeridas en Vercel:

| Variable | Uso |
|---|---|
| `ADMIN_USER` | Usuario único del panel. |
| `ADMIN_PASSWORD_HASH` | Hash `scrypt`, nunca la contraseña en texto. |
| `SESSION_SECRET` | Firma de sesión y derivación de la clave para cifrar IP. Su rotación impide descifrar registros anteriores. |
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

Vercel Web Analytics conserva la analítica agregada. La auditoría propia registra
páginas visitadas, hora, identificador de evento, origen permitido, equipo y
estimaciones de ubicación y tipo de red. Los bloqueadores, JavaScript desactivado,
las cuotas y los fallos de red impiden prometer un registro universal de accesos.

La IP se cifra con AES-256-GCM y solo se revela tras autenticar, durante siete
días. La identidad de conexión usa HMAC con rotación diaria. Solo se confía en
la cabecera protegida de Vercel; los encabezados arbitrarios del cliente no son
una fuente válida. Antes de leer o escribir registros, se verifica que el
repositorio de auditoría sea privado.

El panel consulta 30 días calendario y muestra como máximo 100 registros. Git
conserva versiones históricas cifradas: siete días es una ventana de consulta,
no una promesa de borrado del historial. Las visitas antiguas no contienen una IP
recuperable. La política pública `/privacidad/` explica este alcance.

`ipapi.is` recibe la IP transitoriamente para estimar VPN, proxy, Tor y proveedor.
El mapa usa ubicación aproximada de Vercel, con precisión desconocida. No identifica
barrio, domicilio ni a una persona. Las IP, cookies y secretos nunca van en el
enlace al mapa; tampoco se almacena el User-Agent completo.

## Sincronización automática

`.github/workflows/sincronizar-portafolio.yml` consulta GitHub cada hora con el
token efímero del runner. Excluye forks y repositorios privados, sanea los README,
inventaría cada árbol Git y recoge releases, PR externas y logros visibles. También
valida `metricas/repositorios.json` del perfil: cada cifra queda vinculada a un SHA.

La corrida de 22 repositorios usa 92 solicitudes API al corte actual. Su costo es
`O(R + F + P)` tiempo y espacio, con `R` repositorios, `F` entradas de árbol y `P`
pull requests. El modo enriquecido exige `GITHUB_TOKEN` o `GH_TOKEN`; 92 supera la
cuota anónima de 60 solicitudes por hora. Una respuesta incompleta o un árbol
truncado falla antes de reemplazar el snapshot anterior. El workflow instala con
`npm ci`, regenera la hoja de vida con el snapshot, prueba, construye y crea un
commit con los datos y sus artefactos PDF/HTML/manifiesto cuando hay cambios.

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

Vercel ejecuta `npm run build`, sirve `publico/` y detecta las funciones de
`api/`. `vercel.json` añade CSP, cabeceras de seguridad, caché revalidable para
activos y `no-store` para las respuestas privadas.

La verificación continua está en `.github/workflows/verificar.yml`; todo cambio
debe pasar las pruebas antes de considerarse publicable.

El repositorio público incluye el sitio reproducible y sus datos cartográficos
publicables. Correos, acuses, destinatarios y geometrías reservadas permanecen
en el expediente local y no forman parte de GitHub ni del artefacto Vercel.

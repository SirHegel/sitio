# Sitio de Jhon Steven Alvarez Ruiz

Sitio personal de **Jhon Steven Alvarez Ruiz** — economista y analista de datos en
Neiva, Huila, Colombia. Es el sitio canónico de su nombre: el lugar al que apuntan
LinkedIn, GitHub y el resto de sus perfiles, y desde el que se declara —en JSON-LD—
que todos ellos son la misma persona.

    node construir.js          # genera publico/
    node --test pruebas/*.test.mjs
    npm run servir             # http://127.0.0.1:8099

## Cómo está hecho

Sin dependencias. Ni una. `construir.js` lee `datos.js` y escribe HTML estático;
el título, la descripción, el canónico, el sitemap y el marcado estructurado salen
todos de la misma fuente, de modo que no pueden desincronizarse. Un sitio cuyo
marcado contradice su contenido no confunde solo a Google.

| Archivo | Qué hace |
|---|---|
| `datos.js` | Todo el contenido. Fuente única. |
| `plantilla.js` | La cabecera común y la entidad `Person` de schema.org. |
| `construir.js` | Genera las páginas, el sitemap y `robots.txt`. |
| `activos/estilos.css` | Paleta Paris, Texas y escala modular 1.333. |
| `activos/animacion.js` | El horizonte en lienzo, el revelado y el halo. |
| `activos/musica.js` | Bach, BWV 846, sintetizado nota a nota con Web Audio. |
| `herramientas/portada.py` | Genera la tarjeta de 1200×630 para redes. |

## La música

El Preludio n.º 1 en Do mayor no es un archivo de audio: son 35 armonías, una
figura arpegiada y un envolvente. Se sintetiza en el navegador con osciladores.
Pesa lo que pesan sus datos y no pide nada a ningún servidor.

Las pruebas verifican la transcripción: 35 compases de cinco voces, ordenadas de
grave a agudo, empezando y terminando en Do mayor.

## La regla del scrim

Ningún texto se apoya directamente sobre la capa en movimiento. Todo bloque de
lectura descansa sobre una plancha traslúcida con filete. La animación vive
detrás del scrim, fuera de la columna de texto, o en el ornamento. Nunca bajo
una palabra.

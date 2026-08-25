# Hoja de vida pública

La fuente HTML y el PDF descargable se generan desde los datos públicos del
sitio y `datos-hoja-de-vida.js`:

```bash
npm run cv
```

El PDF queda en `activos/hoja-de-vida-jhon-steven-alvarez-ruiz.pdf` para que el
generador estático lo copie a producción. La composición usa un flujo principal
lineal, encabezados semánticos, enlaces reales y texto seleccionable para facilitar
la lectura en sistemas ATS.

La generación requiere Google Chrome y las utilidades `pdfinfo`/`pdftotext` de
Poppler. Además produce un manifiesto de huellas SHA-256; las pruebas fallan si
los datos, el generador, la fotografía, la fuente HTML y el PDF se desincronizan.

La fotografía se deriva de `activos/retrato-profesional.jpg`. El original
generado se conserva fuera del repositorio en la carpeta de imágenes de Codex.

import { accessSync, constants, realpathSync, statSync } from "node:fs";
import { resolve } from "node:path";

const RUTAS_CHROME = [
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
];

export function rutaChromePermitida(configurada) {
  switch (resolve(configurada)) {
    case "/usr/bin/google-chrome": return "/usr/bin/google-chrome";
    case "/usr/bin/google-chrome-stable": return "/usr/bin/google-chrome-stable";
    case "/usr/bin/chromium": return "/usr/bin/chromium";
    case "/usr/bin/chromium-browser": return "/usr/bin/chromium-browser";
    default: throw new Error("PUPPETEER_EXECUTABLE_PATH debe seleccionar una ruta conocida de Chrome");
  }
}

function validarChromeConocido(ruta) {
  const real = realpathSync(ruta);
  if (!statSync(real).isFile()) throw new Error(`${ruta} no es un archivo regular`);
  accessSync(real, constants.X_OK);
  return real;
}

export function ejecutableChrome(configurada = process.env.PUPPETEER_EXECUTABLE_PATH) {
  if (configurada) return validarChromeConocido(rutaChromePermitida(configurada));

  for (const ruta of RUTAS_CHROME) {
    try {
      return validarChromeConocido(ruta);
    } catch {
      // Continúa con la siguiente ruta fija conocida.
    }
  }
  return undefined;
}

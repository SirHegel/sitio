import {
  existsSync,
  lstatSync,
  realpathSync,
  statSync,
} from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from "node:path";

function estaDentro(raizReal, candidataReal) {
  const tramo = relative(raizReal, candidataReal);
  return tramo === "" || (!isAbsolute(tramo) && tramo !== ".." && !tramo.startsWith(`..${sep}`));
}

export function archivoRegularDentro(raizPermitida, candidata, descripcion = "El archivo") {
  const raizReal = realpathSync(resolve(raizPermitida));
  const candidataReal = realpathSync(resolve(candidata));

  if (!estaDentro(raizReal, candidataReal)) {
    throw new Error(`${descripcion} debe permanecer dentro de ${raizReal}`);
  }
  if (!statSync(candidataReal).isFile()) {
    throw new Error(`${descripcion} debe ser un archivo regular`);
  }

  return candidataReal;
}

export function salidaRegularExacta(destinoPermitido, candidata, descripcion = "La salida") {
  const permitidaAbsoluta = resolve(destinoPermitido);
  const permitida = resolve(realpathSync(dirname(permitidaAbsoluta)), basename(permitidaAbsoluta));
  const candidataAbsoluta = resolve(candidata);

  // Rechaza primero por identidad léxica. Así nunca se hace una operación de
  // sistema de archivos sobre un directorio elegido por la entrada rechazada.
  if (candidataAbsoluta !== permitidaAbsoluta) {
    throw new Error(`${descripcion} solo puede escribirse en ${permitida}`);
  }
  const destino = permitida;
  if (existsSync(destino)) {
    const estado = lstatSync(destino);
    if (estado.isSymbolicLink() || !estado.isFile()) {
      throw new Error(`${descripcion} existente debe ser un archivo regular, no un enlace`);
    }
  }

  return destino;
}

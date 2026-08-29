#!/usr/bin/env node

import { randomBytes } from "node:crypto";

const CANALES = new Set(["whatsapp", "telegram", "linkedin", "github", "facebook", "instagram", "x", "email", "qr", "sms", "signal"]);
const [ruta = "/", canal = ""] = process.argv.slice(2);

if (!ruta.startsWith("/") || ruta.startsWith("//")) throw new Error("La ruta debe comenzar por /.");
if (!CANALES.has(canal)) throw new Error(`Canal inválido. Usa: ${[...CANALES].join(", ")}.`);

const url = new URL(ruta, "https://jhonstevenalvarezruiz.vercel.app");
if (url.origin !== "https://jhonstevenalvarezruiz.vercel.app") throw new Error("La ruta debe pertenecer al sitio.");
const identificador = `s-${randomBytes(6).toString("hex")}`;
url.searchParams.set("via", canal);
url.searchParams.set("utm_source", canal);
url.searchParams.set("utm_medium", "share");
url.searchParams.set("utm_campaign", identificador);

console.log(url.href);
console.error(`Identificador privado para tu registro: ${identificador}`);

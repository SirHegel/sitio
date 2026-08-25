import test from "node:test";
import assert from "node:assert/strict";

import {
  SESSION_COOKIE,
  SESSION_SECONDS,
  cookie,
  createPasswordHash,
  createSession,
  readSession,
  recordLoginFailure,
  recordLoginSuccess,
  requireLoginCapacity,
  requireMutation,
  verifyCredentials,
  verifySignedToken,
} from "../lib/auth.js";
import {
  parseArticleMarkdown,
  serializeArticle,
  validateArticle,
  validateSlug,
} from "../lib/escritos.js";
import {
  aggregateVisit,
  createVisitEvent,
  evaluateNetwork,
  normalizeDaily,
  parseUserAgent,
  requirePublishedPath,
  validateVisitInput,
} from "../lib/auditoria.js";

const SECRETO_FICTICIO = "secreto-ficticio-de-pruebas-con-mas-de-32-bytes";

function request(headers = {}) {
  return { headers: Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])) };
}

test("scrypt verifica la clave sin guardar texto reversible", async () => {
  const hash = await createPasswordHash("clave-ficticia-muy-larga", {
    N: 1024,
    r: 8,
    p: 1,
    keyLength: 32,
    salt: Buffer.alloc(16, 7),
  });
  const env = { ADMIN_USER: "administrador", ADMIN_PASSWORD_HASH: hash, SESSION_SECRET: SECRETO_FICTICIO };
  assert.match(hash, /^scrypt\$1024\$8\$1\$/);
  assert.equal(await verifyCredentials("administrador", "clave-ficticia-muy-larga", env), true);
  assert.equal(await verifyCredentials("administrador", "clave-incorrecta", env), false);
  assert.equal(await verifyCredentials("otra-persona", "clave-ficticia-muy-larga", env), false);
  assert.ok(!hash.includes("clave-ficticia"));
});

test("la sesión está firmada, expira y usa una cookie endurecida", () => {
  const env = { ADMIN_USER: "administrador", SESSION_SECRET: SECRETO_FICTICIO };
  const now = Date.UTC(2026, 7, 23, 12);
  const session = createSession(env, now);
  const req = request({ cookie: `${SESSION_COOKIE}=${session.token}` });
  assert.equal(readSession(req, env, now + 1_000)?.sub, "admin:administrador");
  assert.equal(readSession(req, env, now + SESSION_SECONDS * 1_000), null);
  const reemplazo = session.token.endsWith("A") ? "B" : "A";
  assert.equal(verifySignedToken(`${session.token.slice(0, -1)}${reemplazo}`, "admin:administrador", env, now), null);
  assert.match(cookie(SESSION_COOKIE, session.token, SESSION_SECONDS), /HttpOnly; Secure; SameSite=Strict/);
  assert.ok(SESSION_COOKIE.startsWith("__Host-"));
});

test("las mutaciones exigen simultáneamente mismo origen y CSRF", () => {
  const env = { SITE_ORIGIN: "https://ejemplo.test" };
  const valid = request({ origin: "https://ejemplo.test", "sec-fetch-site": "same-origin", "x-csrf-token": "token-ficticio" });
  assert.doesNotThrow(() => requireMutation(valid, "token-ficticio", env));
  assert.throws(() => requireMutation(request({ origin: "https://atacante.test", "x-csrf-token": "token-ficticio" }), "token-ficticio", env), { code: "origen_no_permitido" });
  assert.throws(() => requireMutation(request({ origin: "https://ejemplo.test", "x-csrf-token": "otro" }), "token-ficticio", env), { code: "csrf_invalido" });
});

test("el freno de login aplica espera progresiva sin usar identificadores", () => {
  recordLoginSuccess();
  const now = Date.UTC(2026, 7, 23, 12);
  for (let index = 0; index < 4; index += 1) {
    assert.doesNotThrow(() => requireLoginCapacity(now));
    recordLoginFailure(now);
  }
  assert.doesNotThrow(() => requireLoginCapacity(now));
  recordLoginFailure(now);
  assert.throws(() => requireLoginCapacity(now), { status: 429, code: "demasiados_intentos" });
  assert.doesNotThrow(() => requireLoginCapacity(now + 1_000));
  recordLoginSuccess();
  assert.doesNotThrow(() => requireLoginCapacity(now));
});

const ARTICULO = {
  slug: "economia-y-datos",
  titulo: "Economía y datos: una lectura",
  categoria: "Economía",
  fecha: "2026-08-23",
  resumen: "Una síntesis comprobable.",
  etiquetas: ["Economía", "Datos"],
  cuerpo: "# Hipótesis\n\nEl argumento se apoya en **evidencia**.",
};

test("el Markdown conserva solo el front matter permitido y vuelve a validarse al leer", () => {
  const markdown = serializeArticle(ARTICULO);
  assert.match(markdown, /^---\ntitulo: /);
  const parsed = parseArticleMarkdown(markdown, { slug: ARTICULO.slug, sha: "a".repeat(40) });
  assert.deepEqual({ ...parsed, sha: undefined }, { ...ARTICULO, sha: undefined });
  assert.equal(parsed.sha, "a".repeat(40));
  assert.throws(() => parseArticleMarkdown(markdown.replace("titulo:", "autor:"), { slug: ARTICULO.slug }), { code: "front_matter_invalido" });

  const especial = { ...ARTICULO, titulo: 'La "forma" y la barra \\', resumen: String.raw`Una ruta como C:\datos no pierde sus escapes.` };
  assert.deepEqual(parseArticleMarkdown(serializeArticle(especial), { slug: especial.slug }), especial);
});

test("slugs, campos extra y Markdown activo son rechazados", () => {
  assert.throws(() => validateSlug("../secreto"), { code: "slug_invalido" });
  assert.throws(() => validateArticle({ ...ARTICULO, propietario: "otro" }), { code: "campo_no_permitido" });
  assert.throws(() => validateArticle({ ...ARTICULO, cuerpo: "<script>alert(1)</script>" }), { code: "markdown_inseguro" });
  assert.throws(() => validateArticle({ ...ARTICULO, fecha: "2026-02-31" }), { code: "fecha_invalida" });
  assert.throws(() => validateArticle({ ...ARTICULO, categoria: "⚖️" }), { code: "categoria_invalida" });
});

test("la visita descarta consultas, credenciales y detalles de User-Agent", () => {
  assert.deepEqual(validateVisitInput({ path: "/blog/?correo=privado", referrer: "https://buscador.test/ruta?q=secreto" }, "https://ejemplo.test"), {
    path: "/blog/",
    referrer: "buscador.test",
    campana: "",
  });
  assert.equal(validateVisitInput({ path: "/hoja-de-vida/", referrer: "" }).path, "/hoja-de-vida/");
  assert.throws(() => validateVisitInput({ path: "/", ip: "192.0.2.1" }), { code: "campo_no_permitido" });
  assert.throws(() => validateVisitInput({ path: "/admin/", referrer: "" }), { code: "ruta_privada" });
  assert.throws(() => validateVisitInput({ path: "/ruta-inventada/", referrer: "" }), { code: "ruta_no_publica" });
  assert.deepEqual(parseUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1"), {
    dispositivo: "Móvil",
    sistema: "iOS / iPadOS",
    navegador: "Safari",
  });
});

test("la auditoría contrasta los módulos con el sitemap publicado", async () => {
  const origin = "https://catalogo-ejemplo.test";
  const fetchSitemap = async () => new Response(`<?xml version="1.0"?>
    <urlset><url><loc>${origin}/</loc></url>
    <url><loc>${origin}/blog/texto-real/</loc></url></urlset>`, {
    status: 200,
    headers: { "content-type": "application/xml" },
  });
  await assert.doesNotReject(() => requirePublishedPath("/blog/texto-real/", origin, fetchSitemap));
  await assert.rejects(() => requirePublishedPath("/blog/inventado/", origin, fetchSitemap), {
    code: "ruta_no_publicada",
  });
});

test("si ipapi.is falla, la visita continúa con red no evaluada", async () => {
  const network = await evaluateNetwork(request({ "x-forwarded-for": "192.0.2.55" }), {}, async () => {
    throw new Error("servicio fuera de línea");
  });
  assert.deepEqual(network, {
    vpn: null,
    proxy: null,
    tor: null,
    datacenter: null,
    egress: null,
    clasificacion: "no evaluada",
  });
});

test("los eventos agregados nunca conservan IP, hash ni User-Agent bruto", () => {
  const req = request({
    "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36",
    "x-vercel-ip-country": "CO",
    "x-vercel-ip-country-region": "HUI",
    "x-vercel-ip-city": "Neiva",
    "x-forwarded-for": "192.0.2.55",
  });
  const event = createVisitEvent(req, { path: "/proyectos/?id=7", referrer: "" }, {
    vpn: false,
    proxy: false,
    tor: false,
    datacenter: false,
    egress: false,
    clasificacion: "no detectada",
  }, new Date("2026-08-23T12:00:00.000Z"), "https://ejemplo.test");
  assert.equal(event.ruta, "/proyectos/");
  assert.equal(event.dispositivo, "Escritorio");
  assert.equal(event.pais, "Colombia");
  assert.ok(!JSON.stringify(event).includes("192.0.2.55"));
  assert.ok(!Object.hasOwn(event, "userAgent"));

  const daily = normalizeDaily({
    recientes: [{ ...event, ip: "192.0.2.55", ipHash: "f".repeat(64), userAgent: "Mozilla/5.0 detalle bruto" }],
  }, "2026-08-23");
  aggregateVisit(daily, event);
  const serialized = JSON.stringify(daily);
  assert.ok(!serialized.includes("192.0.2.55"));
  assert.ok(!serialized.includes("f".repeat(64)));
  assert.ok(!serialized.includes("detalle bruto"));
});

test("la etiqueta de canal se conserva y se limpia, y nunca admite datos personales", () => {
  // Un rótulo normal sobrevive y la ruta sigue quedando sin consulta.
  assert.deepEqual(validateVisitInput({ path: "/blog/?via=linkedin", referrer: "" }, "https://ejemplo.test"), {
    path: "/blog/",
    referrer: "Directo",
    campana: "linkedin",
  });

  // Se recorta a minúsculas y a un alfabeto corto: si alguien intenta
  // colar un correo o un nombre por el enlace, no queda nada utilizable
  // para identificar a una persona.
  assert.equal(validateVisitInput({ path: "/blog/?via=Juan.Perez@gmail.com", referrer: "" }, "https://ejemplo.test").campana, "juanperezgmailcom");
  assert.equal(validateVisitInput({ path: "/blog/?via=" + "x".repeat(80), referrer: "" }, "https://ejemplo.test").campana.length, 32);
  assert.equal(validateVisitInput({ path: "/blog/", referrer: "" }, "https://ejemplo.test").campana, "");
});

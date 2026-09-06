import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import auditHandler from "../api/admin/auditoria.js";
import { aggregateVisit, approximateLocation, createVisitEvent, extractForwardedIp, normalizeDaily, persistVisit, readAudit, requirePrivateAuditRepository, requireVisitCapacity, revealVisitIp, validateVisitInput } from "../lib/auditoria.js";

const env = { VERCEL: "1", SESSION_SECRET: "clave-ficticia-de-auditoria-superior-a-32-bytes", GITHUB_AUDIT_TOKEN: "credencial-ficticia", GITHUB_AUDIT_REPO: "ficticio/auditoria" };
const now = Date.parse("2026-09-06T12:00:00.000Z");
const network = { clasificacion: "no evaluada" };
const req = { headers: { "x-vercel-forwarded-for": "192.0.2.10", "x-forwarded-for": "198.51.100.99", "x-vercel-ip-country": "CO", "x-vercel-ip-city": "Bogot%C3%A1", "x-vercel-ip-latitude": "4.711234", "x-vercel-ip-longitude": "-74.072111", "x-vercel-id": "bog1::iad1::ficticio", "user-agent": "Chrome/100" } };
const event = (date = now) => createVisitEvent(req, { path: "/blog/?via=linkedin", eventId: "b40fba79-3af1-4f8f-a401-d1a14fa363ec" }, network, new Date(date), "https://ejemplo.test", env);
const response = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
const gitFile = (daily) => response({ type: "file", encoding: "base64", content: Buffer.from(JSON.stringify(daily)).toString("base64"), sha: "sha-ficticio" });

test("Vercel usa su cabecera protegida; fuera de Vercel solo se confía en el socket", () => {
  assert.equal(extractForwardedIp(req, env), "192.0.2.10");
  assert.equal(extractForwardedIp(req, {}), "");
  assert.equal(extractForwardedIp({ ...req, socket: { remoteAddress: "::1" } }, {}), "::1");
  assert.equal(extractForwardedIp({ headers: { "x-vercel-forwarded-for": "192.0.2.1, 192.0.2.2", "x-real-ip": "192.0.2.3" } }, env), "");
  assert.equal(extractForwardedIp({ headers: { "x-real-ip": "2001:db8::1" } }, env), "2001:db8::1");
});

test("la IP se cifra, cambia de rastro diario y nunca aparece en JSON persistido", () => {
  const visit = event();
  const daily = aggregateVisit(normalizeDaily(null, "2026-09-06"), visit);
  assert.equal(revealVisitIp(daily.recientes[0], env, now + 1), "192.0.2.10");
  assert.ok(!JSON.stringify(daily).includes("192.0.2.10"));
  assert.equal(visit.conexion.diario, event(now + 1000).conexion.diario);
  assert.notEqual(visit.conexion.diario, event(now + 86_400_000).conexion.diario);
  assert.notEqual(visit.conexion.cifrada, event().conexion.cifrada);
});

test("el cifrado rechaza alteraciones de ruta, fecha, ciphertext y secreto", () => {
  const visit = event();
  for (const altered of [{ ...visit, ruta: "/" }, { ...visit, hora: new Date(now - 1000).toISOString() }, { ...visit, conexion: { ...visit.conexion, cifrada: visit.conexion.cifrada.replace(/^./, "!") } }]) {
    assert.equal(revealVisitIp(altered, env, now + 1), "");
  }
  assert.equal(revealVisitIp(visit, { SESSION_SECRET: "otro-secreto-ficticio-mayor-de-32-bytes" }, now + 1), "");
  assert.equal(revealVisitIp(visit, env, now + 7 * 86_400_000), "");
  assert.equal(revealVisitIp(visit, env, now - 1), "");
});

test("la ausencia de clave conserva el registro sin IP y comunica el estado", () => {
  const visit = createVisitEvent(req, { path: "/" }, network, new Date(now), "https://ejemplo.test", { VERCEL: "1" });
  assert.equal(visit.conexion.estado, "cifrado_no_configurado");
  assert.ok(!JSON.stringify(visit).includes("192.0.2.10"));
});

test("mapa de contexto valida coordenadas sin inventar radio ni cero para datos ausentes", () => {
  assert.deepEqual(approximateLocation(req, env), { latitud: 4.71, longitud: -74.07, fuente: "Vercel GeoIP", precision: "Ciudad o región; error desconocido", radioKm: null });
  assert.equal(approximateLocation(req, {}), null);
  for (const headers of [{}, { "x-vercel-ip-latitude": "", "x-vercel-ip-longitude": "" }, { "x-vercel-ip-latitude": "91", "x-vercel-ip-longitude": "12" }, { "x-vercel-ip-latitude": "0", "x-vercel-ip-longitude": "0" }]) assert.equal(approximateLocation({ headers }, env), null);
});

test("reintentos del mismo evento no inflan el total; referencias privadas y canales personales se excluyen", () => {
  const daily = normalizeDaily(null, "2026-09-06");
  aggregateVisit(daily, event());
  aggregateVisit(daily, event());
  assert.equal(daily.total, 1);
  assert.equal(daily.recientes.length, 1);
  assert.equal(validateVisitInput({ path: "/", referrer: "/admin/secreto/" }).referrer, "Interno: otra página");
  assert.equal(validateVisitInput({ path: "/?via=nombre-apellido" }).campana, "");
  assert.throws(() => validateVisitInput({ path: "/", eventId: "correo@example.test" }), { code: "evento_invalido" });
});

test("conserva atribución previa de UTM, enlaces opacos y referentes sin recoger campañas personales", () => {
  const attribution = validateVisitInput({ path: "/?utm_source=signal&utm_campaign=s-123456abcdef", referrer: "https://l.facebook.com/redireccion?correo=privado" });
  assert.equal(attribution.campana, "signal");
  assert.equal(attribution.enlace, "s-123456abcdef");
  assert.equal(validateVisitInput({ path: "/", referrer: "https://l.instagram.com/" }).campana, "instagram");
  assert.equal(validateVisitInput({ path: "/", referrer: "https://instagram.com.falso.test/" }).campana, "");
  assert.equal(validateVisitInput({ path: "/?utm_source=mi-cuenta&utm_campaign=nombre-apellido" }).enlace, "");
  const previous = normalizeDaily({ version: 2, porEnlace: { "s-123456abcdef": 4 }, recientes: [{ ...event(), familia: "iPhone", enlace: "s-123456abcdef" }] }, "2026-09-06");
  assert.equal(previous.porEnlace["s-123456abcdef"], 4);
  assert.equal(previous.recientes[0].familia, "iPhone");
  assert.equal(previous.recientes[0].enlace, "s-123456abcdef");
});

test("el límite frena abuso por conexión y se reinicia al siguiente minuto", () => {
  for (let i = 0; i < 20; i++) requireVisitCapacity(req, env, now);
  assert.throws(() => requireVisitCapacity(req, env, now), { status: 429 });
  assert.doesNotThrow(() => requireVisitCapacity(req, env, now + 60_000));
});

test("Git público o no verificable detiene toda escritura de auditoría", async () => {
  for (const reply of [response({ private: false }), response({}, 403)]) {
    let calls = 0;
    await assert.rejects(() => persistVisit(event(), env, async () => { calls++; return reply; }), { code: "repositorio_privado_requerido" });
    assert.equal(calls, 1);
  }
  await assert.doesNotReject(() => requirePrivateAuditRepository(env, async () => response({ private: true })));
});

test("persistencia reintenta conflictos de Git y mantiene un único evento cifrado", async () => {
  let writes = 0;
  let saved;
  const fetchImpl = async (url, options) => {
    if (!String(url).includes("/contents/")) return response({ private: true });
    if (options.method === "GET") return response({}, 404);
    writes++;
    saved = JSON.parse(Buffer.from(JSON.parse(options.body).content, "base64").toString());
    return writes === 1 ? response({}, 409) : response({ content: { sha: "guardado" } });
  };
  const result = await persistVisit(event(), env, fetchImpl);
  assert.equal(result.totalDelDia, 1);
  assert.equal(writes, 2);
  assert.equal(saved.recientes.length, 1);
  assert.ok(!JSON.stringify(saved).includes("192.0.2.10"));
});

test("la consulta usa días calendario, entrega IP solo a tiempo y nunca entrega ciphertext", async () => {
  const old = aggregateVisit(normalizeDaily(null, "2026-08-28"), event(now - 9 * 86_400_000));
  const current = aggregateVisit(normalizeDaily(null, "2026-09-06"), event());
  const requested = [];
  const fetchImpl = async (url) => {
    requested.push(String(url));
    if (!String(url).includes("/contents/")) return response({ private: true });
    if (String(url).endsWith("/visitas")) return response(["2026-09-06", "2026-08-28", "2020-01-01", "2099-01-01"].map((day) => ({ name: `${day}.json`, path: `visitas/${day}.json`, type: "file" })));
    return gitFile(String(url).includes("2026-09-06") ? current : old);
  };
  const result = await readAudit(env, fetchImpl, 30, now + 1);
  assert.equal(result.resumen.total, 2);
  assert.equal(result.recientes[0].conexion.ip, "192.0.2.10");
  assert.equal(result.recientes[1].conexion.ip, "");
  assert.ok(!JSON.stringify(result).includes("cifrada\":"));
  assert.ok(!requested.some((url) => url.endsWith("2020-01-01.json") || url.endsWith("2099-01-01.json")));
});

test("la API privada exige sesión y no cachea la respuesta de error", async () => {
  const headers = {};
  const res = { setHeader: (name, value) => { headers[name] = value; }, end: (body) => { res.body = body; } };
  await auditHandler({ method: "GET", headers: {} }, res);
  assert.equal(res.statusCode, 401);
  assert.match(headers["Cache-Control"], /no-store/);
  assert.ok(!res.body.includes("192.0.2.10"));
});

test("el cliente registra cada carga aun con sesión anterior y preserva solo canales conocidos", async () => {
  const source = await readFile(new URL("../activos/analitica.js", import.meta.url), "utf8");
  const bodies = [];
  for (const path of ["/blog/?via=linkedin&correo=secreto", "/proyectos/?via=cuenta-personal", "/?utm_source=telegram&utm_campaign=s-123456abcdef&utm_medium=cuenta-personal"]) {
    const location = new URL(`https://ejemplo.test${path}`);
    const context = vm.createContext({ URL, location, document: { referrer: "" }, crypto: { randomUUID: () => "b40fba79-3af1-4f8f-a401-d1a14fa363ec" }, sessionStorage: { getItem: () => "1", setItem: () => assert.fail("no debe crear seguimiento de sesión") }, fetch: async (_, options) => { bodies.push(JSON.parse(options.body)); return { status: 202 }; }, addEventListener() {}, setTimeout() {}, clearTimeout() {} });
    vm.runInContext(source, context);
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.equal(bodies.length, 3);
  assert.equal(bodies[0].path, "/blog/?via=linkedin");
  assert.equal(bodies[1].path, "/proyectos/");
  assert.equal(bodies[2].path, "/?utm_source=telegram&utm_campaign=s-123456abcdef");
  assert.ok(!JSON.stringify(bodies).includes("secreto"));
});

test("PJAX fija un UUID y referente por ruta; un reintento lento no mezcla páginas posteriores", async () => {
  const source = await readFile(new URL("../activos/analitica.js", import.meta.url), "utf8");
  const bodies = [];
  const listeners = new Map();
  const timers = new Map();
  let releaseFirst;
  let nextId = 0;
  const context = vm.createContext({
    URL,
    location: new URL("https://ejemplo.test/?via=linkedin"),
    document: { referrer: "https://buscador.test/ruta?correo=privado" },
    crypto: { randomUUID: () => `b40fba79-3af1-4f8f-a401-d1a14fa363e${++nextId}` },
    addEventListener: (name, fn) => listeners.set(name, fn),
    setTimeout: (fn) => { const id = timers.size + 1; timers.set(id, fn); return id; },
    clearTimeout: (id) => timers.delete(id),
    fetch: async (_, options) => {
      bodies.push(JSON.parse(options.body));
      if (bodies.length === 1) return new Promise((resolve) => { releaseFirst = resolve; });
      return { status: 202 };
    },
  });
  vm.runInContext(source, context);
  context.location = new URL("https://ejemplo.test/blog/?via=telegram&correo=secreto");
  listeners.get("sitio:navegacion")();
  listeners.get("sitio:navegacion")();
  assert.equal(bodies.length, 1, "la segunda ruta espera el turno sin sustituir el cuerpo de la primera");
  releaseFirst({ status: 503 });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(bodies.length, 2);
  assert.equal(bodies[1].path, "/blog/?via=telegram");
  assert.equal(bodies[1].referrer, "/");
  assert.notEqual(bodies[0].eventId, bodies[1].eventId);
  assert.equal(bodies[0].referrer, "https://buscador.test");
  const retry = [...timers.values()][0];
  retry();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(bodies.length, 3);
  assert.deepEqual(bodies[2], bodies[0]);
  context.location = new URL("https://ejemplo.test/proyectos/");
  listeners.get("sitio:navegacion")();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(bodies[3].referrer, "/blog/");
  assert.equal(new Set(bodies.map((body) => body.eventId)).size, 3);
  context.location = new URL("https://ejemplo.test/admin/");
  listeners.get("sitio:navegacion")();
  listeners.get("online")();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(bodies.length, 4, "el panel privado y online después de éxito no añaden visitas");
  assert.ok(!JSON.stringify(bodies).includes("secreto"));
  assert.ok(!JSON.stringify(bodies).includes("privado"));
});

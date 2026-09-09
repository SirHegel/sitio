import test from 'node:test';
import assert from 'node:assert/strict';
import { PROYECTOS, REPOSITORIOS_GITHUB } from '../datos.js';
import { EXPLICACIONES_PROYECTOS, explicacionDeProyecto, explicacionProyecto, proyectoConExplicacion } from '../proyecto-explicaciones.js';

const publico = (nombre) => {
  const github = REPOSITORIOS_GITHUB.repositorios.find((r) => r.nombre.toLowerCase() === nombre.toLowerCase());
  assert.ok(github, `falta ${nombre}`);
  return { slug: github.slug, nombre: github.nombre, repo: github.url, github, resumen: github.descripcion, lenguajes: github.lenguajes.map((l) => l.nombre) };
};

test('cada repositorio propio y el diseño privado tienen una explicación específica y trazable', () => {
  const proyectos = [...REPOSITORIOS_GITHUB.repositorios.map((r) => publico(r.nombre)), PROYECTOS.find((p) => !p.repo)];
  const propositos = new Set();
  for (const proyecto of proyectos) {
    const detalle = explicacionDeProyecto(proyecto);
    assert.ok(detalle, `${proyecto.nombre}: requiere lectura editorial antes de ampliar el catálogo`);
    for (const campo of ['resumen', 'proposito', 'alcance', 'validacion', 'limites']) assert.ok(detalle[campo]?.length > 50, `${proyecto.nombre}: falta ${campo}`);
    assert.equal(detalle.ejemplo.length, 2);
    assert.ok(detalle.ejemplo.every((s) => s.length > 20));
    assert.ok(detalle.flujo.length >= 2);
    assert.ok(detalle.decisiones.length >= 1);
    propositos.add(detalle.proposito);
    if (detalle.privado || detalle.vacio) {
      assert.equal(detalle.revision, null);
      assert.deepEqual(detalle.fuentes, []);
    } else {
      assert.match(detalle.revision, /^[a-f0-9]{40}$/);
      assert.ok(detalle.fuentes.length >= 3);
      for (const [ruta, etiqueta, tipo = 'blob'] of detalle.fuentes) {
        assert.ok(!ruta.startsWith('/') && !ruta.includes('..'));
        assert.ok(etiqueta.length > 5);
        assert.ok(['blob', 'tree'].includes(tipo));
      }
    }
  }
  assert.equal(propositos.size, proyectos.length, 'hay explicaciones genéricas repetidas');
});

test('forks y repositorios ajenos no heredan explicaciones de autoría propia', () => {
  const proyecto = publico('orquesta-ia');
  for (const otro of [
    { ...proyecto, fork: true },
    { ...proyecto, github: { ...proyecto.github, fork: true } },
    { ...proyecto, repo: 'https://github.com/otra-persona/orquesta-ia' },
    { ...proyecto, repo: 'https://github.com.ejemplo.org/SirHegel/orquesta-ia' },
    { ...proyecto, repo: 'javascript:alert(1)' },
    { ...proyecto, repo: 'https://github.com/SirHegel/orquesta-ia/tree/main' },
    { ...proyecto, repo: 'https://github.com/SirHegel/repositorio-sin-revisar' },
  ]) {
    assert.equal(explicacionDeProyecto(otro), null);
    assert.equal(explicacionProyecto(otro), '');
    assert.equal(proyectoConExplicacion(otro), otro);
  }
  for (const fork of REPOSITORIOS_GITHUB.forks) assert.equal(explicacionDeProyecto({ repo: fork.url }), null);
});

test('enriquecer conserva rutas, métricas, referencias e inventario sin mutar el catálogo', () => {
  const original = { ...publico('bloquitos'), cifras: 'métrica procedente del manifiesto', estado: 'estado comprobado', auditoria: { base: 'base medida', error: 'error medido' } };
  const antes = JSON.stringify(original);
  const resultado = proyectoConExplicacion(original);
  assert.equal(JSON.stringify(original), antes);
  for (const campo of ['slug', 'repo', 'github', 'cifras', 'estado']) assert.equal(resultado[campo], original[campo]);
  assert.equal(resultado.auditoria.base, original.auditoria.base);
  assert.equal(resultado.auditoria.error, original.auditoria.error);
  assert.notEqual(resultado.resumen, original.resumen);
});

test('las correcciones explican el código real donde el README inducía a error', () => {
  assert.match(proyectoConExplicacion(publico('CRUD')).resumen, /trabajadores/);
  assert.doesNotMatch(proyectoConExplicacion(publico('CRUD')).resumen, /hotel|reservas/);
  const multiplicadora = explicacionDeProyecto(publico('MULTIPLICADORA'));
  assert.match(multiplicadora.validacion, /cálculo está en PHP/);
  assert.match(multiplicadora.flujo[0][1], /impide envíos/);
  const designter = proyectoConExplicacion(publico('designter-financial-bot'));
  assert.match(designter.resumen, /reglas de texto/);
  assert.doesNotMatch(designter.resumen, /lenguaje natural|inteligente/);
  assert.match(explicacionDeProyecto(publico('proyecto')).validacion, /no una confirmación de recepción/);
  assert.deepEqual(proyectoConExplicacion(publico('orquesta-ia')).lenguajes, ['Python', 'JSONL', 'Shell']);
});

test('la explicación pública usa HTML progresivo y fuentes fijadas, sin ejecutar ejemplos', () => {
  const proyecto = publico('prueba-api-tareas');
  const html = explicacionProyecto({ ...proyecto, slug: 'prueba-"<script>alert(1)</script>' });
  assert.match(html, /<details class="proyecto-ingenieria/);
  assert.match(html, /<summary>Cómo está desarrollado y cómo se comprueba<\/summary>/);
  assert.match(html, /<dt>Qué recibe<\/dt>/);
  assert.match(html, /<dt>Qué entrega<\/dt>/);
  assert.match(html, /Ejemplo ilustrativo/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script\b|<iframe\b|\bonclick=|\sstyle=/);
  const enlaces = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(enlaces.length >= 4);
  assert.ok(enlaces.every((href) => href.includes(EXPLICACIONES_PROYECTOS['prueba-api-tareas'].revision)));
});

test('el repositorio vacío y el proyecto privado conservan sus límites de evidencia', () => {
  const vacio = explicacionProyecto(publico('Practice_Python'));
  assert.match(vacio, /Ejemplo propuesto/);
  assert.match(vacio, /todavía no tiene una revisión de código/);
  assert.doesNotMatch(vacio, /\/tree\/null|\/blob\/null/);
  const privado = explicacionProyecto(PROYECTOS.find((p) => !p.repo));
  assert.match(privado, /No se enlazan código ni datos comerciales privados/);
  assert.doesNotMatch(privado, /href=""|github\.com/);
});

/* One local 3D model, created only when visible. O(N) series preparation;
   O(log N) interpolation per frame. N is the scientific controller's series.
   PJAX disposes the old context before another model can be created. */
let initialized = false;
let refresh = null;

export function iniciarNeuroLaboratorio() {
  if (initialized) { refresh?.(); return; }
  initialized = true;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = null;
  let generation = 0;

  function dispose(loseContext = true) {
    if (!current) return;
    current.closed = true;
    cancelAnimationFrame(current.frame);
    current.abort.abort(); current.observer.disconnect(); current.resizeObserver.disconnect();
    current.motor?.dispose({ loseContext }); current = null;
  }
  function mount() {
    const canvas = document.getElementById('neuro-visor');
    if (current?.canvas === canvas) return;
    generation++; dispose();
    if (!canvas) return;
    const host = canvas.closest('[data-neuro-laboratorio]') || canvas.parentElement.parentElement;
    const item = { canvas, host, closed: false, failed: false, motor: null, loading: false, visible: false, frame: 0, time: 0, last: 0,
      yaw: 0, pitch: 0, zoom: 1, pointerX: 0, localPause: false, data: canvas.__neuroEstado || {}, abort: new AbortController() };
    current = item;
    const token = generation;
    const options = { signal: item.abort.signal };
    const status = host.querySelector('[data-neuro-render-status]');
    const stopped = () => item.localPause || reduced.matches || document.body.classList.contains('escena-pausada');
    const allowed = () => !item.closed && !item.failed && item.visible && !document.hidden && !stopped() && item.motor;
    const message = (text) => {
      if (status) status.textContent = text;
      const fallback = host.querySelector('.neuro-respaldo');
      if (fallback) fallback.hidden = canvas.dataset.neuroMotor !== 'respaldo';
    };

    function sample() {
      const data = item.data;
      const serie = Array.isArray(data.serie) ? data.serie : [];
      const duration = Number(data.duracionMs) || serie.at(-1)?.tMs || 1;
      const modelTime = ((item.time % 8) / 8) * duration;
      const result = { ...data, time: item.time, yaw: item.yaw, pitch: item.pitch, zoom: item.zoom, pointerX: item.pointerX, paused: stopped() };
      if (!serie.length) return result;
      let low = 0, high = serie.length - 1;
      while (low < high) { const middle = Math.ceil((low + high) / 2); if (serie[middle].tMs <= modelTime) low = middle; else high = middle - 1; }
      const a = serie[low], b = serie[Math.min(low + 1, serie.length - 1)];
      const t = b.tMs > a.tMs ? Math.max(0, Math.min(1, (modelTime - a.tMs) / (b.tMs - a.tMs))) : 0;
      const interpolate = (field) => Number(a[field] || 0) + (Number(b[field] || 0) - Number(a[field] || 0)) * t;
      const unit = (value) => Math.max(0, Math.min(1, value));
      if (canvas.dataset.modeloNeuro === 'sinapsis') {
        // Discrete releases retain their sample value between successive pulses.
        result.activity = unit(a.rPre); result.release = unit(a.liberacion);
      } else if (canvas.dataset.modeloNeuro === 'dopamina') {
        const concentration = interpolate('c');
        result.activity = unit(concentration / Math.max(1e-12, data.c0 || serie[0].c || 1));
        result.clearance = 1 - result.activity;
      } else {
        const e = interpolate('e'), i = interpolate('i');
        result.activity = unit(Math.abs(e) / item.scaleE); result.memory = result.activity;
        result.inhibition = unit(Math.abs(i) / item.scaleI); result.excitationSign = Math.sign(e);
      }
      canvas.dataset.tiempoModelo = modelTime.toFixed(2);
      const readout = host.querySelector('[data-neuro-tiempo]');
      if (readout) readout.textContent = `${modelTime.toFixed(0)} ms`;
      return result;
    }
    function draw() {
      if (item.closed || item.failed || !item.motor || !item.visible || document.hidden) return;
      try {
        item.motor.render(sample());
        canvas.dataset.frames = String(Number(canvas.dataset.frames || 0) + 1);
        canvas.dataset.neuroMotor = 'webgl';
      } catch (error) { item.failed = true; canvas.dataset.neuroMotor = 'respaldo'; message('Modelo 3D no disponible. El cálculo y los datos siguen disponibles.'); cancelAnimationFrame(item.frame); item.frame = 0; }
    }
    function resize() {
      if (!item.motor) return;
      const rect = canvas.getBoundingClientRect();
      item.motor.resize({ width: rect.width, height: rect.height });
      canvas.dataset.dpr = String(item.motor.stats.dpr); draw();
    }
    function tick(now) {
      item.frame = 0;
      // A media query can update matches before delivering its change event.
      // Reflect its controls as soon as this frame observes the stopped state.
      if (!allowed()) { state(); return; }
      item.time += Math.min(0.08, Math.max(0, (now - item.last) / 1000)); item.last = now;
      draw();
      if (allowed()) item.frame = requestAnimationFrame(tick);
    }
    function state() {
      cancelAnimationFrame(item.frame); item.frame = 0;
      const pause = host.querySelector('[data-neuro-vista="pausa"]');
      if (pause) {
        const globalPause = document.body.classList.contains('escena-pausada');
        pause.setAttribute('aria-pressed', String(stopped()));
        pause.disabled = reduced.matches || globalPause;
        pause.textContent = reduced.matches ? 'Movimiento reducido' : globalPause ? 'Sitio en pausa' : item.localPause ? 'Reanudar modelo' : 'Pausar modelo';
      }
      if (item.motor && !item.failed) { message(stopped() ? 'Modelo en pausa · parámetros activos' : 'Modelo 3D · tiempo ampliado'); draw(); }
      if (allowed()) { item.last = performance.now(); item.frame = requestAnimationFrame(tick); }
    }
    function dataChanged(data) {
      item.data = data || {};
      const serie = Array.isArray(item.data.serie) ? item.data.serie : [];
      item.scaleE = Math.max(1e-12, ...serie.map((point) => Math.abs(point.e || 0)));
      item.scaleI = Math.max(1e-12, ...serie.map((point) => Math.abs(point.i || 0)));
      item.time = 0; draw();
    }
    async function ensure() {
      if (item.motor || item.loading || item.closed) return;
      item.loading = true; canvas.dataset.neuroMotor = 'cargando'; message('Preparando geometría…');
      try {
        const { crearModeloNeuro } = await import('./neuro-motor.js');
        if (item.closed || generation !== token) return;
        const motor = await crearModeloNeuro(canvas, { tipo: canvas.dataset.modeloNeuro });
        if (item.closed || generation !== token) { motor.dispose(); return; }
        item.motor = motor; dataChanged(canvas.__neuroEstado || item.data); resize(); state();
      } catch { canvas.dataset.neuroMotor = 'respaldo'; message('Modelo 3D no disponible. El cálculo y los datos siguen disponibles.'); }
      finally { item.loading = false; }
    }
    item.observer = new IntersectionObserver(([entry]) => {
      item.visible = entry.isIntersecting;
      if (item.visible) ensure();
      state();
    }, { threshold: 0.02 });
    item.resizeObserver = new ResizeObserver(resize);
    item.observer.observe(canvas); item.resizeObserver.observe(canvas);
    dataChanged(item.data);
    addEventListener('neuro:estado', (event) => {
      if (event.detail?.tipo && event.detail.tipo !== canvas.dataset.modeloNeuro) return;
      dataChanged(event.detail || canvas.__neuroEstado);
    }, options);
    addEventListener('sitio:movimiento', state, options);
    document.addEventListener('visibilitychange', state, options);
    reduced.addEventListener('change', state, options);
    let drag = null;
    canvas.addEventListener('pointerdown', (event) => {
      drag = { x: event.clientX, y: event.clientY, yaw: item.yaw, pitch: item.pitch };
      canvas.setPointerCapture(event.pointerId);
    }, options);
    canvas.addEventListener('pointermove', (event) => {
      if (!drag) {
        if (!stopped()) { const rect = canvas.getBoundingClientRect(); item.pointerX = (event.clientX - rect.left) / Math.max(1, rect.width) * 2 - 1; }
        return;
      }
      item.yaw = drag.yaw + (event.clientX - drag.x) * 0.009;
      item.pitch = Math.max(-0.55, Math.min(0.65, drag.pitch + (event.clientY - drag.y) * 0.006));
      if (!allowed()) draw();
    }, options);
    const end = () => { drag = null; };
    canvas.addEventListener('pointerup', end, options); canvas.addEventListener('pointercancel', end, options);
    canvas.addEventListener('pointerleave', () => { if (!drag && !stopped()) item.pointerX = 0; }, options);
    canvas.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowLeft') item.yaw -= 0.15;
      if (event.key === 'ArrowRight') item.yaw += 0.15;
      if (event.key === 'ArrowUp') item.pitch = Math.max(-0.55, item.pitch - 0.08);
      if (event.key === 'ArrowDown') item.pitch = Math.min(0.65, item.pitch + 0.08);
      if (event.key === 'Home') { item.yaw = 0; item.pitch = 0; item.zoom = 1; }
      draw();
    }, options);
    host.addEventListener('click', (event) => {
      const action = event.target.closest('[data-neuro-vista]')?.dataset.neuroVista;
      if (action === 'reset') { item.yaw = 0; item.pitch = 0; item.zoom = 1; }
      if (action === 'pausa') item.localPause = !item.localPause;
      if (action === 'acercar') item.zoom = Math.min(1.6, item.zoom + 0.15);
      if (action === 'alejar') item.zoom = Math.max(0.7, item.zoom - 0.15);
      if (action) state();
    }, options);
    canvas.addEventListener('webglcontextlost', (event) => {
      if (item.closed) return;
      event.preventDefault(); item.failed = true; cancelAnimationFrame(item.frame); item.frame = 0;
      canvas.dataset.neuroMotor = 'respaldo'; message('Contexto 3D interrumpido. Cálculo disponible.');
    }, options);
    canvas.addEventListener('webglcontextrestored', () => { item.failed = false; resize(); state(); }, options);
  }
  refresh = mount;
  addEventListener('sitio:navegacion', mount);
  // A BFCache page keeps its canvas identity. Release resources while retaining
  // that context so pageshow can initialize the same canvas again.
  addEventListener('pagehide', (event) => { generation++; dispose(!event.persisted); });
  addEventListener('pageshow', mount);
  mount();
}

/* Una sala, una cámara y un contexto GPU durante toda la navegación.
   Control O(1) por cuadro; render O(V + P), V vértices y P píxeles.
   Calidad adaptativa con histéresis; no impone un límite de 30 fps.
   Pausa y pestaña oculta cancelan el único rAF del entorno. */
import { ajustarCalidadAutomatica } from './calidad-3d.js';

export function iniciarCinematografia() {
  const body = document.body;
  const canvas = document.getElementById('observatorio');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer: fine)');
  let motor = null, frame = 0, time = 0, last = 0, samples = [], failed = false;
  let pause = false, quality = 'auto', dpr = 1, pageActive = true;
  let targetX = 0, targetY = 0, x = 0, y = 0, entry = 0, leaving = false;
  let aperture = 0, apertureTarget = 0, lamp = 1, lampTarget = 1, science = 0, scienceTarget = 0;
  let hovered = null, lastPick = 0;
  const hint = document.createElement('div');
  hint.id = 'objeto-hint'; hint.setAttribute('aria-hidden','true');
  document.body.append(hint);
  try { pause = localStorage.getItem('jsar:escena-pausa') === '1'; } catch {}
  const paused = () => pause || reduced.matches;
  const running = () => !paused() && !document.hidden && pageActive && !failed && motor;
  body.dataset.escena = 'terciopelo';
  document.documentElement.classList.add('js-cine');
  const button = document.getElementById('pausar-escena');
  const status = document.getElementById('estado-render');

  function controls() {
    body.classList.toggle('escena-pausada', paused());
    body.classList.toggle('escena-oculta', document.hidden);
    for (const btn of [button, document.getElementById('pausar-umbral')]) {
      if (!btn) continue;
      btn.setAttribute('aria-pressed', String(paused()));
      btn.setAttribute('aria-label', paused() ? 'Reanudar movimiento del sitio' : 'Pausar movimiento del sitio');
      btn.disabled = reduced.matches;
      const icon = btn.firstElementChild || btn;
      icon.textContent = paused() ? '▷' : 'Ⅱ';
    }
    document.querySelectorAll('[data-accion-3d]').forEach(btn => {
      const action = btn.getAttribute('data-accion-3d');
      btn.disabled = !motor || failed;
      btn.setAttribute('aria-pressed', String(Boolean(action === 'telon' ? apertureTarget : action === 'luz' ? lampTarget : scienceTarget)));
    });
  }
  function draw() {
    if (!motor || failed || document.hidden) return;
    try {
      motor.render({time, pointerX:x, pointerY:y, scroll:Math.min(1, scrollY / Math.max(1,innerHeight * 2)), entry,
        paused:paused(), aperture, lamp, science:Math.min(1,science + (hovered === 'instrumento' ? .25 : 0))});
      if(body.dataset.motor !== 'webgl') body.dataset.motor = 'webgl';
      // Instrumentación de diagnóstico sin texto de rendimiento inventado.
      canvas.dataset.frames = String(Number(canvas.dataset.frames || 0) + 1);
    } catch (error) { fallback(error); }
  }
  function resize(reset = false) {
    if (!motor) return;
    if (reset) dpr = quality === 'ahorro' ? .85 : Math.min(devicePixelRatio || 1, quality === 'alta' ? 2 : 1.5);
    motor.resize({width:innerWidth, height:innerHeight, dpr, quality});
    dpr = motor.stats.dpr;
    canvas.dataset.dpr = String(dpr);
    draw();
  }
  function tick(now) {
    frame = 0;
    // La media query puede actualizar matches antes de entregar change.
    // Reflejar la parada aquí evita dejar controles y CSS activos al reducir.
    if (!running()) { state(); return; }
    const elapsed = now - last;
    const dt = Math.min(.06, Math.max(0, elapsed / 1000));
    last = now; time += dt;
    const smooth = 1 - Math.exp(-dt * 4);
    x += (targetX - x) * smooth; y += (targetY - y) * smooth;
    aperture += (apertureTarget - aperture) * smooth;
    lamp += (lampTarget - lamp) * smooth;
    science += (scienceTarget - science) * smooth;
    entry += ((leaving || !body.classList.contains('entrada-activa') ? 1 : 0) - entry) * smooth;
    draw();
    if (quality === 'auto' && Number.isFinite(elapsed) && elapsed > 0) {
      samples.push(elapsed);
      const adjustment = ajustarCalidadAutomatica(samples, {dpr, software:motor.stats.software, mobile:innerWidth < 760});
      if (adjustment) {
        if (adjustment.dpr < dpr) { dpr = adjustment.dpr; resize(); }
        canvas.dataset.frameMs = adjustment.frameMs.toFixed(2);
        samples = [];
      }
    }
    if (running()) frame = requestAnimationFrame(tick);
  }
  function state() {
    cancelAnimationFrame(frame); frame = 0;
    // A resumed tab starts a fresh timing window; hidden time is not a frame.
    samples = [];
    controls();
    dispatchEvent(new CustomEvent('sitio:movimiento', {detail:{pausado:paused() || document.hidden}}));
    if (paused()) { x = 0; y = 0; aperture = apertureTarget; lamp = lampTarget; science = scienceTarget; entry = body.classList.contains('entrada-activa') ? 0 : 1; }
    draw();
    if (running()) {last = performance.now(); frame = requestAnimationFrame(tick);}
  }
  function fallback(error) {
    failed = true; cancelAnimationFrame(frame); frame = 0;
    body.dataset.motor = 'respaldo';
    if (status) status.textContent = 'Vista de lectura';
    if (error) console.warn('Observatorio 3D no disponible:', error.message);
    controls();
  }
  function menu(open, focus=false) {
    document.querySelector('.barra')?.classList.toggle('menu-abierto',open);
    const btn = document.querySelector('.menu-mando');
    btn?.setAttribute('aria-expanded',String(open));
    if (btn?.lastElementChild) btn.lastElementChild.textContent = open ? '−' : '＋';
    if (focus) btn?.focus();
  }
  document.addEventListener('click',event=>{
    if (!(event.target instanceof Element)) return;
    const toggle=event.target.closest('.menu-mando');
    if (toggle) { menu(toggle.getAttribute('aria-expanded') !== 'true'); return; }
    if (!event.target.closest('.barra') || event.target.closest('nav.menu a')) menu(false);
    if (event.target.closest('#pausar-escena, #pausar-umbral')) {
      pause = !pause;
      try { localStorage.setItem('jsar:escena-pausa',pause?'1':'0'); } catch {}
      state();
    }
    const control=event.target.closest('[data-accion-3d]');
    if (!control && motor && !failed && event.target.closest('.observatorio-portada') && !event.target.closest('a, button, .portada-caja, .portada-superior')) {
      const hit=motor.pick(event.clientX,event.clientY);
      if(hit==='instrumento') scienceTarget=1-scienceTarget;
      if(hit==='lampara') lampTarget=1-lampTarget;
      if(paused()){science=scienceTarget;lamp=lampTarget;draw();}
      controls();
    }
    if (!control || control.disabled) return;
    if (control.getAttribute('data-accion-3d') === 'telon') apertureTarget = 1-apertureTarget;
    if (control.getAttribute('data-accion-3d') === 'luz') lampTarget = 1-lampTarget;
    if (control.getAttribute('data-accion-3d') === 'orbita') scienceTarget = 1-scienceTarget;
    if (paused()) {aperture=apertureTarget; lamp=lampTarget; science=scienceTarget; draw();}
    controls();
  });
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && !body.classList.contains('entrada-activa')) menu(false,true);});
  addEventListener('pointermove',e=>{
    if (!fine.matches || paused()) return;
    targetX = e.clientX/innerWidth*2-1; targetY=e.clientY/innerHeight*2-1;
    if (performance.now()-lastPick > 65 && motor && !failed) {
      lastPick=performance.now();
      hovered=e.target instanceof Element && e.target.closest('.observatorio-portada') && !e.target.closest('a,button,.portada-caja') ? motor.pick(e.clientX,e.clientY) : null;
      body.classList.toggle('objeto-apuntado',Boolean(hovered));
      hint.textContent=hovered==='instrumento'?'Alterar la órbita ↗':hovered==='lampara'?'Cambiar la luz ◉':'';
      hint.style.transform=`translate(${Math.min(innerWidth-165,e.clientX+18)}px,${Math.min(innerHeight-52,e.clientY+18)}px)`;
    }
  },{passive:true});
  document.addEventListener('pointerleave',()=>{targetX=0;targetY=0;hovered=null;body.classList.remove('objeto-apuntado');});
  document.getElementById('calidad-3d')?.addEventListener('change',e=>{quality=e.target.value;samples=[];resize(true);});
  addEventListener('resize',()=>resize(true),{passive:true});
  document.addEventListener('visibilitychange',state);
  reduced.addEventListener('change',state);
  addEventListener('pagehide',()=>{pageActive=false;cancelAnimationFrame(frame);frame=0;});
  addEventListener('pageshow',()=>{pageActive=true;state();});
  addEventListener('sitio:entrada-saliendo',()=>{leaving=true;});
  addEventListener('sitio:entrada-finalizada',()=>{leaving=true;state();});
  addEventListener('sitio:navegacion',()=>{ menu(false); body.dataset.escena='terciopelo';scienceTarget=location.pathname.startsWith('/ciencia/')?1:0; controls(); if(paused()){science=scienceTarget;draw();} });
  canvas?.addEventListener('webglcontextlost',e=>{e.preventDefault();fallback();});
  canvas?.addEventListener('webglcontextrestored',()=>{failed=false;if(status)status.textContent='Sala en vivo';state();});
  state();
  if (!canvas) return;
  import('./observatorio-motor.js').then(async ({crearObservatorio})=>{
    motor = await crearObservatorio(canvas);
    if (!motor) throw new Error('WebGL 2 no está disponible');
    entry=body.classList.contains('entrada-activa')?0:1;
    scienceTarget=location.pathname.startsWith('/ciencia/')?1:0;
    body.dataset.motor='webgl';
    if(status) status.textContent='Sala en vivo';
    resize(true);state();
  }).catch(fallback);
}

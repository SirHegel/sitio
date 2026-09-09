import { simularVesiculas, equilibrioVesicular, resolverIntervaloVesicular, resolverVesiculasRobusto,
  simularLimpieza, resolverLimpieza, concentracionLimpieza, acotarLimpieza, predecirLimpiezaAcotada,
  simularCircuito, resolverCircuitoRobusto } from './modelos-neuro.js';

let instalado=false, desmontar=()=>{};
const escapar=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const numero=(n,d=3)=>n===null||!Number.isFinite(n)?'Sin solución finita':Math.abs(n)>0&&Math.abs(n)<.0001?n.toExponential(2):n.toLocaleString('es-CO',{maximumFractionDigits:d});
const medida=(nombre,valor,nota)=>`<div class="neuro-medida"><span>${escapar(nombre)}</span><strong>${escapar(valor)}</strong><small>${escapar(nota)}</small></div>`;

/** O(N), espacio O(N). Las coordenadas sólo representan datos finitos; ejes visibles. */
function grafica({lineas,xTitulo='t [ms]',yTitulo,xMax,yMin=0,yMax,banda=[]}) {
 const W=600,H=286,L=70,R=18,T=35,B=48;
 const sx=x=>L+x/Math.max(xMax,1e-12)*(W-L-R),sy=y=>H-B-(y-yMin)/Math.max(yMax-yMin,1e-12)*(H-T-B);
 const camino=puntos=>puntos.filter(p=>p.every(Number.isFinite)).map(([x,y],i)=>`${i?'L':'M'}${sx(x).toFixed(2)},${sy(y).toFixed(2)}`).join(' ');
 const eje=Array.from({length:5},(_,i)=>{const y=yMin+(yMax-yMin)*i/4,x=xMax*i/4;return `<path class="neuro-chart-grid" d="M${L} ${sy(y)}H${W-R}"/><text class="neuro-chart-etiqueta" x="${L-9}" y="${sy(y)+4}" text-anchor="end">${escapar(numero(y,3))}</text><text class="neuro-chart-etiqueta" x="${sx(x)}" y="${H-B+20}" text-anchor="middle">${escapar(numero(x,1))}</text>`}).join('');
 const area=banda.length?`<path d="${camino(banda.map(p=>[p.x,p.min]))} ${camino([...banda].reverse().map(p=>[p.x,p.max])).replace(/^M/,'L')}Z" fill="#72abb22b"/>`:'';
 return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapar(yTitulo)} frente a ${escapar(xTitulo)}"><title>${escapar(yTitulo)} frente a ${escapar(xTitulo)}</title>${eje}${area}${lineas.map(l=>`<path class="neuro-chart-linea" stroke="${l.color}"${l.dash?' stroke-dasharray="5 5"':''} d="${camino(l.puntos)}"/>`).join('')}<text class="neuro-chart-etiqueta" x="${L}" y="16">${escapar(yTitulo)}</text><text class="neuro-chart-etiqueta" x="${W-R}" y="${H-5}" text-anchor="end">${escapar(xTitulo)}</text></svg><div class="neuro-leyenda">${lineas.map(l=>`<span><i style="background:${l.color}"></i>${escapar(l.nombre)}</span>`).join('')}${banda.length?'<span><i style="background:#72abb2"></i>Intervalo compatible</span>':''}</div>`;
}

/** O(P), P vértices; región de parámetros expresada con ambos ejes y unidades. */
function regionGrafica(region) {
 if(region.vacio)return '<p>Las observaciones y los rangos admitidos son incompatibles: región vacía.</p>';
 const [minK,maxK]=region.rangoKm,[minV,maxV]=region.rangoVmax;
 const padK=Math.max(.005,(maxK-minK)*.2),padV=Math.max(.00001,(maxV-minV)*.2);
 const x0=Math.max(0,minK-padK),x1=maxK+padK,y0=Math.max(0,minV-padV),y1=maxV+padV;
 const sx=x=>76+(x-x0)/(x1-x0)*496,sy=y=>233-(y-y0)/(y1-y0)*192;
 return `<svg viewBox="0 0 600 286" role="img" aria-label="Región de K en micromolar y V en micromolar por milisegundo"><title>Región compatible de parámetros</title>${Array.from({length:4},(_,i)=>{const k=x0+(x1-x0)*i/3,v=y0+(y1-y0)*i/3;return `<path class="neuro-chart-grid" d="M76 ${sy(v)}H572"/><text class="neuro-chart-etiqueta" x="70" y="${sy(v)+4}" text-anchor="end">${numero(v,5)}</text><text class="neuro-chart-etiqueta" x="${sx(k)}" y="255" text-anchor="middle">${numero(k,2)}</text>`}).join('')}<polygon points="${region.vertices.map(p=>`${sx(p.km)},${sy(p.vmax)}`).join(' ')}" fill="#af716244" stroke="#edb196" stroke-width="2" vector-effect="non-scaling-stroke"/><text class="neuro-chart-etiqueta" x="76" y="18">V [μM/ms]</text><text class="neuro-chart-etiqueta" x="572" y="280" text-anchor="end">K [μM]</text></svg>`;
}

/** Montaje O(N+P·N), espacio O(N+P). Un formulario vivo; listeners cancelados al navegar. */
function montar() {
 desmontar();
 const portada=document.querySelector('.neuro-indice #neuro-visor');
 if(portada){
  const datos=simularCircuito({w:1.2,g:1,h:.8,tauEMs:20,tauIMs:10,duracionMs:300,muestras:160});
  portada.__neuroEstado={tipo:'memoria',...datos,duracionMs:300};
  dispatchEvent(new CustomEvent('neuro:estado',{detail:portada.__neuroEstado}));
 }
 const raiz=document.querySelector('[data-neuro-estudio]');if(!raiz)return;
 const form=raiz.querySelector('[data-neuro-form]'),canvas=raiz.querySelector('#neuro-visor');
 const tipo=raiz.dataset.neuroEstudio,abort=new AbortController();let frame=0,estado=null;
 const opciones={signal:abort.signal},resolver=raiz.querySelector('[data-neuro-resolver]');
 const resultados=raiz.querySelector('[data-neuro-resultados]'),conclusion=raiz.querySelector('[data-neuro-conclusion]');
 const vistaGrafica=raiz.querySelector('[data-neuro-grafica]');
 const controles=[...form.querySelectorAll('input')];
 raiz.querySelectorAll('input,button').forEach(e=>{if(!e.hasAttribute('data-neuro-vista'))e.disabled=false});

 function actualizar() {
  frame=0;
  try {
   const p=Object.fromEntries(controles.map(e=>[e.name,Number(e.value)]));
   controles.forEach(e=>{raiz.querySelector(`[data-neuro-valor="${e.name}"]`).textContent=`${numero(Number(e.value),4)} ${e.dataset.unidad}`.trim()});
   controles.forEach(e=>{e.closest('label').querySelector('small').textContent=`${numero(Number(e.min),4)} — ${numero(Number(e.max),4)} ${e.dataset.unidad}`.trim()});
   const error=p.incertidumbre/100;let datos,solucion,accion,cifras,texto,lineas,yTitulo,yMin=0,yMax,banda=[];
   if(tipo==='sinapsis') {
    datos=simularVesiculas({...p,pulsos:24});
    const nominal=resolverIntervaloVesicular(p);
    solucion=resolverVesiculasRobusto({uMin:p.u*(1-error),uMax:Math.min(1,p.u*(1+error)),tauMinMs:p.tauMs*(1-error),tauMaxMs:p.tauMs*(1+error),objetivo:p.objetivo});
    const peorNominalVisible=nominal.finito?equilibrioVesicular({u:p.u*(1-error),tauMs:p.tauMs*(1+error),deltaMs:nominal.deltaMinMs}).liberacionEstacionaria:null;
    accion=solucion.finito?{campo:'deltaMs',valor:solucion.deltaMinMs}:null;
    cifras=medida('Liberación sostenida actual',numero(datos.liberacionEstacionaria),'Fracción de la reserva total por impulso')+medida('Intervalo mínimo nominal',nominal.finito?`${numero(nominal.deltaMinMs,1)} ms`:'No alcanzable','Parámetros centrales, sin margen de incertidumbre')+medida('Intervalo con incertidumbre',solucion.finito?`${numero(solucion.deltaMinMs,1)} ms`:'No alcanzable','Caso restrictivo: u mínimo y τ máximo');
    texto=solucion.finito?`Para sostener ${numero(p.objetivo)} de la reserva por impulso, el intervalo calculado es ${numero(solucion.deltaMinMs,1)} ms. Con el intervalo nominal mostrado, el peor caso sólo sostiene ${numero(peorNominalVisible)}. La garantía se refiere al estado estacionario y a una reserva inicial completa. La incertidumbre afecta a u y τ; el intervalo Δ es exacto.`:`El objetivo ${numero(p.objetivo)} no admite intervalo finito en toda la caja de incertidumbre. Reduce el objetivo o revisa los parámetros; esperar un número arbitrario no resuelve esa incompatibilidad.`;
    lineas=[{nombre:'Liberación por impulso',color:'#ffab86',puntos:datos.serie.map(s=>[s.tMs,s.liberacion])},{nombre:'Objetivo',color:'#a8b6ab',dash:true,puntos:[[0,p.objetivo],[datos.serie.at(-1).tMs,p.objetivo]]}];
    yMax=Math.max(p.u,p.objetivo)*1.15;yTitulo='Liberación [fracción]';
   } else if(tipo==='dopamina') {
    const duracionMs=Math.max(600,p.plazoMs*1.5);
    datos=simularLimpieza({...p,duracionMs,muestras:120});solucion=resolverLimpieza(p);
    accion=solucion.finito?{campo:'vmax',valor:solucion.vmaxMin}:null;
    const mediciones=[.12,.3,.55,.8].map(f=>{const tMs=duracionMs*f,c=concentracionLimpieza({...p,tMs}),amplitud=p.c0*error;return {tMs,min:Math.max(0,c-amplitud),max:Math.min(p.c0,c+amplitud)}});
    const vmaxLimite=Math.max(.02,p.vmax*1.2);
    const region=acotarLimpieza({c0:p.c0,mediciones,kmMin:.01,kmMax:1,vmaxMin:.00001,vmaxMax:vmaxLimite});
    datos.mediciones=mediciones;datos.region=region;
    banda=region.vacio?[]:datos.serie.filter((_,i)=>i%2===0).map(s=>({x:s.tMs,...predecirLimpiezaAcotada({c0:p.c0,vertices:region.vertices,tMs:s.tMs})}));
    raiz.querySelector('[data-neuro-region]').innerHTML=regionGrafica(region);
    cifras=medida('Tiempo hasta el objetivo',`${numero(datos.tiempoObjetivoMs,1)} ms`,'Solución integrada, con los parámetros actuales')+medida('Capacidad mínima para el plazo',`${numero(solucion.vmaxMin,5)} μM/ms`,'Inversión nominal: conserva K y C₀ elegidos')+medida('K compatible con las lecturas',region.vacio?'Región vacía':`${numero(region.rangoKm[0],3)}–${numero(region.rangoKm[1],3)}`,'μM · cuatro lecturas sintéticas con error acotado');
    texto=`El modelo alcanza ${numero(p.objetivo)} μM en ${numero(datos.tiempoObjetivoMs,1)} ms. Para lograrlo antes de ${numero(p.plazoMs,0)} ms requiere V ≥ ${numero(solucion.vmaxMin,5)} μM/ms, manteniendo K. ${region.vacio?'Las lecturas y los rangos admitidos son incompatibles: no existe una banda de predicción.':`Las cuatro lecturas admiten una región de ${region.vertices.length} vértices; la banda representa sus predicciones.`} Cada lectura se centra en la curva exacta y admite ±${numero(p.c0*error)} μM (±${numero(p.incertidumbre,0)} % de C₀), sin añadir ruido aleatorio. C₀ se supone exacta. Caja de exploración: K ∈ [0,01; 1] μM y V ∈ [0,00001; ${numero(vmaxLimite,5)}] μM/ms; su máximo se amplía si lo exige el valor elegido.`;
    lineas=[{nombre:'Concentración del modelo',color:'#ffab86',puntos:datos.serie.map(s=>[s.tMs,s.c])},{nombre:'Objetivo',color:'#a8b6ab',dash:true,puntos:[[0,p.objetivo],[duracionMs,p.objetivo]]}];yMax=p.c0*1.07;yTitulo='C [μM]';
   } else {
    datos=simularCircuito({...p,duracionMs:300,muestras:160});
    solucion=resolverCircuitoRobusto({wMin:p.w*(1-error),wMax:p.w*(1+error),hMin:p.h*(1-error),hMax:p.h*(1+error),tauEMinMs:p.tauEMs*(1-error),tauEMaxMs:p.tauEMs*(1+error),tauIMinMs:p.tauIMs*(1-error),tauIMaxMs:p.tauIMs*(1+error),margen:.2});
    accion=solucion.finito?{campo:'g',valor:solucion.gMin}:null;
    cifras=medida('Estado del circuito central',datos.estable?'Estable':'No estable',datos.estable?'Las dos partes reales son negativas':'La perturbación no tiene decaimiento asintótico garantizado')+medida('Autovalor más lento',numero(datos.maxReal,5),'Parte real en ms⁻¹ · un valor positivo indica crecimiento')+medida('Inhibición para toda la caja',solucion.finito?numero(solucion.gMin):'No factible','g adimensional · margen 1 − w + gh ≥ 0,2');
    texto=solucion.finito?`La solución g = ${numero(solucion.gMin)} mantiene traza negativa y margen de determinante positivo para los parámetros de toda la caja declarada. La frontera nominal de realimentación es w < ${numero(datos.limiteW)}; acercarse a ella prolonga algunas perturbaciones y reduce la tolerancia a cambios.`:`${solucion.motivo} La caja de incertidumbre admite parámetros cuyo freno no puede corregirse cambiando únicamente g. Deben cambiar los tiempos relativos o la realimentación excitatoria.`;
    if(datos.truncada)texto+=' La respuesta supera el límite numérico de representación; la curva termina allí y no se presenta como estable.';
    lineas=[{nombre:'Desviación excitatoria E',color:'#ffab86',puntos:datos.serie.map(s=>[s.tMs,s.e])},{nombre:'Desviación inhibitoria I',color:'#88bbc7',puntos:datos.serie.map(s=>[s.tMs,s.i])}];
    const valores=datos.serie.flatMap(s=>[s.e,s.i]);yMin=Math.min(0,...valores);yMax=Math.max(1,...valores)*1.08;yTitulo='Desviación [adimensional]';
   }
   resultados.innerHTML=cifras;conclusion.textContent=texto;conclusion.dataset.estado=solucion.finito?'ok':'aviso';
   vistaGrafica.innerHTML=grafica({lineas,yTitulo,xMax:datos.serie.at(-1).tMs,yMin,yMax,banda});
   resolver.disabled=!accion;
   estado={tipo,parametros:p,...datos,solucion,accion,duracionMs:datos.serie.at(-1).tMs,c0:p.c0,activity:.7,release:datos.liberacionEstacionaria??.3,clearance:.5,memory:datos.estable?1:0,inhibition:p.g??.5};
   canvas.__neuroEstado=estado;dispatchEvent(new CustomEvent('neuro:estado',{detail:estado}));
  } catch(error) {
   estado=null;resolver.disabled=true;conclusion.textContent=`No se pudo calcular este estado: ${error.message}`;conclusion.dataset.estado='aviso';
  }
 }
 form.addEventListener('input',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(actualizar)},opciones);
 form.addEventListener('reset',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(actualizar)},opciones);
 form.addEventListener('submit',e=>e.preventDefault(),opciones);
 resolver.addEventListener('click',()=>{
  if(!estado?.accion)return;
  const {campo,valor}=estado.accion,input=form.elements.namedItem(campo);
  // El resultado puede quedar fuera de la ventana inicial del explorador.
  // Ampliar el rango conserva la solución, sin recortarla silenciosamente.
  input.max=String(Math.max(Number(input.max),valor*1.2));input.min=String(Math.min(Number(input.min),valor));
  input.step='any';input.value=String(valor);actualizar();
 },opciones);
 raiz.querySelector('[data-neuro-descargar]').addEventListener('click',()=>{
  if(!estado)return;
  const columnas=Object.keys(estado.serie[0]);
  const csv=['# Estudio: '+tipo,'# Datos sintéticos; tiempo ms; C μM; V μM/ms; E/I desviaciones','# Parámetros: '+JSON.stringify(estado.parametros),'# Solución: '+JSON.stringify(estado.solucion),columnas.join(','),...estado.serie.map(f=>columnas.map(c=>f[c]).join(','))].join('\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`estudio-${tipo}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 },opciones);
 actualizar();desmontar=()=>{cancelAnimationFrame(frame);abort.abort();estado=null};
}

export function iniciarEstudiosNeuro() {
 if(instalado)return;instalado=true;montar();addEventListener('sitio:navegacion',montar);addEventListener('pagehide',()=>desmontar());addEventListener('pageshow',e=>{if(e.persisted)montar()});
}

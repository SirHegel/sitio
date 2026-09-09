/* Diálogo accesible sobre el mismo canvas persistente de la página.
   O(1) tiempo y espacio; ningún segundo contexto GPU ni carga de fotografías. */
const LLAVE='jsar:entrada-v2';
export function entradaPendiente(){
  if(!document.getElementById('puerta') || location.hash) return false;
  if(new URLSearchParams(location.search).get('entrada')==='1') return true;
  try{return sessionStorage.getItem(LLAVE)!=='1';}catch{return true;}
}
export function iniciarEntrada(sonido){
  const door=document.getElementById('puerta');
  if(!door)return;
  if(!entradaPendiente() || typeof door.showModal!=='function'){door.remove();return;}
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let closing=false, timer=0;
  function finish(){
    clearTimeout(timer);
    door.close();door.remove();
    document.body.classList.remove('entrada-activa');
    document.getElementById('principal')?.focus({preventScroll:true});
    dispatchEvent(new CustomEvent('sitio:entrada-finalizada'));
    reduced.removeEventListener('change',motion);
    document.removeEventListener('visibilitychange',visibility);
  }
  function choose(music){
    if(closing)return;closing=true;
    if(music)void sonido.tocar().catch(()=>{});else sonido.silenciar();
    try{sessionStorage.setItem(LLAVE,'1');sessionStorage.setItem('jsar:entrado','1');}catch{}
    const url=new URL(location.href);
    if(url.searchParams.get('entrada')==='1'){url.searchParams.delete('entrada');history.replaceState(history.state,'',url);}
    dispatchEvent(new CustomEvent('sitio:entrada-saliendo'));
    if(reduced.matches || document.body.classList.contains('escena-pausada') || document.hidden){finish();return;}
    door.classList.add('umbral-saliendo');
    door.querySelectorAll('button').forEach(btn=>{btn.disabled=true;});
    timer=setTimeout(finish,1100);
  }
  function motion(){if(closing && reduced.matches)finish();}
  function visibility(){if(closing && document.hidden)finish();}
  door.querySelector('#entrar-con-musica').addEventListener('click',()=>choose(true));
  door.querySelector('#entrar-en-silencio').addEventListener('click',()=>choose(false));
  door.addEventListener('cancel',e=>{e.preventDefault();choose(false);});
  door.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    const buttons=[...door.querySelectorAll('button:not(:disabled)')];
    const first=buttons[0],last=buttons.at(-1);
    if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
  });
  reduced.addEventListener('change',motion);
  document.addEventListener('visibilitychange',visibility);
  document.body.classList.add('entrada-activa');door.showModal();
}

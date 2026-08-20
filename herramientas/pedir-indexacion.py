# -*- coding: utf-8 -*-
"""Pide a Google que indexe páginas del sitio, usando la sesión viva de Firefox.

Google no acepta IndexNow y hace años que ignora el «ping» al sitemap: la única
vía directa es la inspección de URLs de Search Console. Limita las solicitudes a
una decena al día — cuando contesta que la cuota está superada no es un fallo,
es el límite; se reintenta al día siguiente.

    ~/.local/share/li-agent/venv/bin/python herramientas/pedir-indexacion.py / /academico/
"""
import sys, time, urllib.parse

sys.path.insert(0, "/home/sirhegel/.local/share/li-agent")
import licore
from playwright.sync_api import sync_playwright

UA = "Mozilla/5.0 (X11; Linux x86_64; rv:153.0) Gecko/20100101 Firefox/153.0"
BASE = "https://jhonstevenalvarezruiz.vercel.app"
RECURSO = urllib.parse.quote(BASE + "/", safe="")
RUTAS = sys.argv[1:] or ["/"]


def cookies():
    """Las cookies de Google del Firefox real. Se copian, no se tocan."""
    vistos, out = set(), []
    for dominio in ("%google.com%", "%.google%"):
        for c in licore.cookies(dominio):
            clave = (c["host"], c["name"], c["path"])
            if clave in vistos:
                continue
            vistos.add(clave)
            out.append({"name": c["name"], "value": c["value"], "domain": c["host"],
                        "path": c["path"], "secure": c["secure"], "httpOnly": c["httpOnly"]})
    return out


def texto(pg):
    return pg.evaluate("() => document.body.innerText.replace(/\\n+/g,' | ')")


with sync_playwright() as pw:
    navegador = pw.firefox.launch(headless=True)
    ctx = navegador.new_context(user_agent=UA, locale="es-ES",
                                timezone_id="America/Bogota",
                                viewport={"width": 1440, "height": 1050})
    ctx.add_cookies(cookies())
    pg = ctx.new_page()
    pg.goto("https://search.google.com/search-console?resource_id=" + RECURSO,
            wait_until="domcontentloaded", timeout=60000)
    time.sleep(12)

    for ruta in RUTAS:
        objetivo = BASE + ruta
        caja = pg.query_selector('input[aria-label*="nspecc"]') or pg.query_selector("input[type=text]")
        if not caja:
            print("no encuentro la caja de inspección"); break
        caja.scroll_into_view_if_needed()
        caja.focus()
        pg.keyboard.press("Control+a")
        pg.keyboard.press("Delete")
        pg.keyboard.type(objetivo, delay=12)
        pg.keyboard.press("Enter")
        time.sleep(24)              # la consulta al índice tarda

        t = texto(pg)
        estado = ("EN GOOGLE" if "está en Google" in t and "no está" not in t
                  else "NO INDEXADA" if "no está en Google" in t else "?")
        pedido = pg.evaluate("""() => {
          const b = [...document.querySelectorAll('button,[role=button],a')]
            .find(x => /SOLICITAR INDEXACI/i.test((x.innerText||'').trim()));
          if (!b) return 'sin botón';
          b.click(); return 'pulsado';
        }""")
        print(f"{ruta:44} {estado:12} {pedido}", flush=True)

        if pedido == "pulsado":
            time.sleep(30)          # Google hace una prueba en directo antes de aceptar
            r = texto(pg)
            for clave in ("Indexación solicitada", "añadida a la cola", "cuota", "superado"):
                if clave in r:
                    i = r.find(clave)
                    print("     →", r[max(0, i - 60):i + 150], flush=True)
                    break
            else:
                print("     → sin confirmación legible", flush=True)
            pg.keyboard.press("Escape")
            time.sleep(3)

    navegador.close()

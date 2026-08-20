# -*- coding: utf-8 -*-
"""Genera la tarjeta que se ve cuando alguien comparte el sitio (1200x630).
Misma paleta y misma imagen que el sitio: horizonte, brasa, filete."""

from PIL import Image, ImageDraw, ImageFilter, ImageFont
from pathlib import Path
import math, random

AN, AL = 1200, 630
NOCHE   = (10, 8, 6)
AZUL    = (8, 11, 17)
AMBAR   = (232, 164, 76)
AMBAR_A = (255, 206, 138)
VERDE   = (63, 191, 135)
CREMA   = (252, 248, 240)
TOPO    = (142, 130, 114)
ROJO    = (212, 64, 44)

SERIF      = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
SERIF_FINO = "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"
SANS       = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def mezclar(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def lienzo():
    img = Image.new("RGB", (AN, AL), NOCHE)
    px = img.load()
    # Cielo: azul noche arriba, negro cálido abajo.
    for y in range(AL):
        px_fila = mezclar(AZUL, NOCHE, min(1.0, y / (AL * 0.72)))
        for x in range(AN):
            px[x, y] = px_fila
    return img


def _sumar(a, b):
    """Suma dos capas canal a canal, saturando en 255."""
    from PIL import ImageChops
    return ImageChops.add(a, b)


def brasa(img):
    """El resplandor del horizonte. Se dibuja en su propia capa y se suma, para
    que el degradado no se vea bandeado."""
    capa = Image.new("RGB", (AN, AL), (0, 0, 0))
    d = ImageDraw.Draw(capa)
    cx, cy = AN * 0.5, AL * 1.20
    rmax = AL * 1.0
    pasos = 90
    for i in range(pasos, 0, -1):
        t = i / pasos
        r = rmax * t
        color = mezclar(ROJO, AMBAR, 1 - t)
        f = (1 - t) ** 2.3
        d.ellipse([cx - r * 1.5, cy - r, cx + r * 1.5, cy + r],
                  fill=tuple(round(c * f * 0.72) for c in color))
    capa = capa.filter(ImageFilter.GaussianBlur(46))
    return _sumar(img, capa)


def reticula(img):
    """Retícula en fuga hacia el punto de horizonte."""
    capa = Image.new("RGB", (AN, AL), (0, 0, 0))
    d = ImageDraw.Draw(capa)
    hy = AL * 0.60
    fx = AN * 0.5
    for i in range(-14, 15):
        x = fx + i * (AN * 0.16)
        d.line([(fx, hy), (x, AL + 40)], fill=(30, 21, 12), width=1)
    p = 0.0
    for i in range(16):
        t = i / 16
        y = hy + (t ** 2.6) * (AL - hy + 50)
        if y > AL:
            break
        v = round(34 * (1 - t * 0.8))
        d.line([(0, y), (AN, y)], fill=(v, round(v * 0.7), round(v * 0.4)), width=1)
    capa = capa.filter(ImageFilter.GaussianBlur(0.6))
    return _sumar(img, capa)


def brasas(img, semilla=7):
    r = random.Random(semilla)
    capa = Image.new("RGB", (AN, AL), (0, 0, 0))
    d = ImageDraw.Draw(capa)
    for _ in range(120):
        x = r.uniform(0, AN)
        y = r.uniform(AL * 0.12, AL)
        rad = r.uniform(0.8, 2.4)
        a = r.uniform(0.10, 0.55) * (1 - (y / AL) * 0.35)
        c = tuple(round(v * a) for v in AMBAR_A)
        d.ellipse([x - rad, y - rad, x + rad, y + rad], fill=c)
    capa = capa.filter(ImageFilter.GaussianBlur(0.9))
    return _sumar(img, capa)


def ajustar(d, texto, fuente_ruta, ancho_max, tam_inicial):
    """Baja el cuerpo hasta que la línea entra en el ancho disponible."""
    tam = tam_inicial
    while tam > 20:
        f = ImageFont.truetype(fuente_ruta, tam)
        if d.textlength(texto, font=f) <= ancho_max:
            return f
        tam -= 2
    return ImageFont.truetype(fuente_ruta, tam)


def scrim(img, caja, opacidad=0.62):
    """La plancha traslúcida del sistema de marca, aquí en mapa de bits: ningún
    texto se apoya directamente sobre la capa en movimiento."""
    x0, y0, x1, y1 = caja
    recorte = img.crop(caja)
    plancha = Image.new("RGB", recorte.size, (12, 9, 7))
    img.paste(Image.blend(recorte, plancha, opacidad), (x0, y0))
    return img


def retrato(img, caja):
    """Pega el retrato con filete, del mismo grosor y color que el resto."""
    ruta = Path(__file__).resolve().parent.parent / "activos" / "retrato.jpg"
    if not ruta.exists():
        return img
    x, y, lado = caja
    foto = Image.open(ruta).convert("RGB").resize((lado, lado), Image.LANCZOS)
    img.paste(foto, (x, y))
    d = ImageDraw.Draw(img)
    d.rectangle([x, y, x + lado - 1, y + lado - 1], outline=(92, 78, 62), width=1)
    return img


def componer():
    img = lienzo()
    img = reticula(img)
    img = brasa(img)
    img = brasas(img)

    M = 84                      # margen
    LADO = 372                  # lado del retrato
    ancho = AN - M * 2 - LADO - 64

    # El pie descansa sobre su scrim.
    img = retrato(img, (AN - M - LADO, (AL - LADO) // 2, LADO))
    img = scrim(img, (0, AL - 96, AN, AL), 0.70)

    d = ImageDraw.Draw(img)

    d.line([(M, 54), (AN - M, 54)], fill=(58, 41, 24), width=1)

    f_micro = ImageFont.truetype(SANS, 19)
    d.text((M, 86), "N E I V A   ·   H U I L A   ·   C O L O M B I A",
           font=f_micro, fill=AMBAR)

    y = 172
    for linea in ("Jhon Steven", "Alvarez Ruiz"):
        f = ajustar(d, linea, SERIF, ancho, 88)
        d.text((M, y), linea, font=f, fill=CREMA)
        y += f.size + 12

    y += 34
    d.line([(M, y), (M + 190, y)], fill=AMBAR, width=2)

    f_titular = ImageFont.truetype(SERIF_FINO, 31)
    d.text((M, y + 26), "Economista y analista de datos", font=f_titular, fill=AMBAR)

    f_sub = ImageFont.truetype(SERIF_FINO, 21)
    d.text((M, y + 76), "Análisis y Desarrollo de Software",
           font=f_sub, fill=TOPO)

    f_pie = ImageFont.truetype(SANS, 19)
    d.text((M, AL - 58), "github.com/SirHegel     ·     jhonstevenalvarezruiz.vercel.app",
           font=f_pie, fill=(178, 164, 146))
    d.ellipse([AN - M - 12, AL - 54, AN - M, AL - 42], fill=VERDE)

    destino = Path(__file__).resolve().parent.parent / "activos" / "portada.png"
    img.save(destino, "PNG", optimize=True)
    print("escrito:", destino, img.size)


if __name__ == "__main__":
    componer()

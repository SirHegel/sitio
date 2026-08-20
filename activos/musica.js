/* ============================================================================
   Preludio n.º 1 en Do mayor, BWV 846 — J. S. Bach (dominio público)
   Sintetizado nota a nota con Web Audio. Sin archivos, sin red, sin
   dependencias: la pieza es datos y un envolvente, no un mp3.

   Las 35 armonías están cotejadas entre dos reducciones del original.
   La figura de Bach es constante: cinco voces por compás, arpegiadas en el
   patrón v1 v2 v3 v4 v5 v3 v4 v5, y el medio compás se repite.
   ========================================================================= */

const COMPASES = [
  "C3 E3 G3 C4 E4",     //  1  Do mayor
  "C3 D3 A3 D4 F4",     //  2  Rem7/Do
  "B2 D3 G3 D4 F4",     //  3  Sol7/Si
  "C3 E3 G3 C4 E4",     //  4  Do
  "C3 E3 A3 E4 A4",     //  5  Lam/Do
  "C3 D3 F#3 A3 D4",    //  6  Re7/Do   — primera alteración: fa sostenido
  "B2 D3 G3 D4 G4",     //  7  Sol/Si
  "B2 C3 E3 G3 C4",     //  8  Domaj7/Si
  "A2 C3 E3 G3 C4",     //  9  Lam7
  "D2 A2 D3 F#3 C4",    // 10  Re7
  "G2 B2 D3 G3 B3",     // 11  Sol
  "G2 Bb2 E3 G3 C#4",   // 12  Do#dim7/Sol
  "F2 A2 D3 A3 D4",     // 13  Rem/Fa
  "F2 Ab2 D3 F3 B3",    // 14  Sidim7/Fa
  "E2 G2 C3 G3 C4",     // 15  Do/Mi
  "E2 F2 A2 C3 F3",     // 16  Fa/Mi
  "D2 F2 A2 C3 F3",     // 17  Rem7
  "G2 D3 G3 B3 F4",     // 18  Sol7
  "C2 E3 G3 C4 E4",     // 19  Do        — empieza el pedal de tónica
  "C2 G3 Bb3 C4 E4",    // 20  Do7
  "C2 F3 A3 C4 E4",     // 21  Famaj7/Do
  "C2 F#3 A3 C4 Eb4",   // 22  Fa#dim7/Do
  "C2 F3 Ab3 B3 D4",    // 23  Labdim7/Do
  "C2 F3 G3 B3 D4",     // 24  Sol7/Do
  "G2 E3 G3 C4 E4",     // 25  Do/Sol    — el pedal pasa a dominante
  "G2 D3 G3 C4 F4",     // 26  Sol7sus4
  "G2 D3 G3 B3 F4",     // 27  Sol7
  "G2 Eb3 A3 C4 F#4",   // 28  Ladim7/Sol
  "G2 E3 G3 C4 G4",     // 29  Do/Sol
  "G2 D3 G3 C4 F4",     // 30  Sol7sus4
  "G2 D3 G3 B3 F4",     // 31  Sol7
  "C2 C3 G3 Bb3 E4",    // 32  Do7       — vuelve el pedal de tónica
  "C2 C3 F3 A3 C4",     // 33  Fa/Do
  "C2 C3 G3 B3 F4",     // 34  Sol7/Do
  "C2 C3 E3 G3 C4",     // 35  Do        — acorde final, tenido
];

export const PATRON = [0, 1, 2, 3, 4, 2, 3, 4];  // medio compás; se repite igual
const PPM = 62;                            // negras por minuto: andante sereno
const CLASES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

export function aFrecuencia(nombre) {
  const m = /^([A-G])(b|#)?(-?\d)$/.exec(nombre);
  if (!m) throw new Error("nota ilegible: " + nombre);
  const semi = CLASES[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  const midi = (Number(m[3]) + 1) * 12 + semi;   // Do central = 60
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export const VOCES = COMPASES.map((c) => c.split(" ").map(aFrecuencia));

/* --------------------------------------------------------- reverberación */
/* Impulso generado: ruido con caída exponencial. Una sala pequeña de madera,
   no una catedral. */
function impulso(ctx, segundos = 2.6, caida = 2.4) {
  const n = Math.floor(ctx.sampleRate * segundos);
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let canal = 0; canal < 2; canal++) {
    const datos = buf.getChannelData(canal);
    for (let i = 0; i < n; i++) {
      datos[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, caida);
    }
  }
  return buf;
}

export class Preludio {
  constructor() {
    this.ctx = null;
    this.sonando = false;
    this.compas = 0;
    this.paso = 0;
    this.proximo = 0;
    this.reloj = null;
    this.dur16 = 60 / PPM / 4;
  }

  /* Solo se construye tras un gesto del usuario: la política de reproducción
     automática de los navegadores lo exige, y con razón. */
  preparar() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = (this.ctx = new Ctx());

    this.maestro = ctx.createGain();
    this.maestro.gain.value = 0;
    this.maestro.connect(ctx.destination);

    // Un filtro suave: quita el filo del oscilador y deja el cuerpo.
    this.filtro = ctx.createBiquadFilter();
    this.filtro.type = "lowpass";
    this.filtro.frequency.value = 2700;
    this.filtro.Q.value = 0.4;
    this.filtro.connect(this.maestro);

    this.seco = ctx.createGain();
    this.seco.gain.value = 0.78;
    this.seco.connect(this.filtro);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = impulso(ctx);
    this.humedo = ctx.createGain();
    this.humedo.gain.value = 0.34;
    this.reverb.connect(this.humedo);
    this.humedo.connect(this.filtro);
  }

  /* Una nota: dos osciladores ligeramente desafinados y un armónico débil.
     El ataque es corto y la caída exponencial — pulsado, no soplado. */
  nota(frecuencia, cuando, duracion, volumen) {
    const ctx = this.ctx;
    const salida = ctx.createGain();
    salida.gain.setValueAtTime(0.0001, cuando);
    salida.gain.exponentialRampToValueAtTime(volumen, cuando + 0.012);
    salida.gain.exponentialRampToValueAtTime(0.0001, cuando + duracion);
    salida.connect(this.seco);
    salida.connect(this.reverb);

    const cuerpo = [
      { tipo: "triangle", desafine: 0, ganancia: 1.0 },
      { tipo: "sine", desafine: -4, ganancia: 0.55 },
      { tipo: "sine", desafine: 0, ganancia: 0.16, octava: 2 },
    ];

    for (const voz of cuerpo) {
      const osc = ctx.createOscillator();
      osc.type = voz.tipo;
      osc.frequency.value = frecuencia * (voz.octava || 1);
      osc.detune.value = voz.desafine;
      const g = ctx.createGain();
      g.gain.value = voz.ganancia;
      osc.connect(g).connect(salida);
      osc.start(cuando);
      osc.stop(cuando + duracion + 0.05);
    }
  }

  planificar() {
    const ctx = this.ctx;
    const HORIZONTE = 0.2;

    while (this.proximo < ctx.currentTime + HORIZONTE) {
      const voces = VOCES[this.compas];
      const ultimo = this.compas === VOCES.length - 1;

      if (ultimo) {
        // El compás final no se arpegia: se deja caer entero y se sostiene.
        if (this.paso === 0) {
          voces.forEach((f, i) => this.nota(f, this.proximo, 6.5, 0.09 - i * 0.008));
        }
      } else {
        const voz = PATRON[this.paso % 8];
        const f = voces[voz];
        // Las voces graves suenan más largas y algo más fuertes: sostienen
        // la armonía mientras las agudas dibujan la figura.
        const grave = voz <= 1;
        const duracion = grave ? this.dur16 * 9 : this.dur16 * 5.5;
        const volumen = grave ? 0.085 : 0.062;
        this.nota(f, this.proximo, duracion, volumen);
      }

      this.proximo += this.dur16;
      this.paso++;
      if (this.paso >= 16) {
        this.paso = 0;
        this.compas++;
        if (this.compas >= VOCES.length) this.compas = 0;
      }
    }
  }

  async tocar() {
    this.preparar();
    if (this.ctx.state === "suspended") await this.ctx.resume();
    if (this.sonando) return;
    this.sonando = true;
    this.proximo = this.ctx.currentTime + 0.12;
    this.maestro.gain.cancelScheduledValues(this.ctx.currentTime);
    this.maestro.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.maestro.gain.exponentialRampToValueAtTime(0.17, this.ctx.currentTime + 3.0);
    this.reloj = setInterval(() => this.planificar(), 40);
    this.planificar();
  }

  callar() {
    if (!this.ctx || !this.sonando) return;
    this.sonando = false;
    clearInterval(this.reloj);
    const t = this.ctx.currentTime;
    this.maestro.gain.cancelScheduledValues(t);
    this.maestro.gain.setValueAtTime(Math.max(this.maestro.gain.value, 0.0001), t);
    this.maestro.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
  }

  alternar() {
    if (this.sonando) this.callar();
    else this.tocar();
    return this.sonando;
  }
}

// Ficha editorial separada del inventario GitHub y del perfil usado por la hoja de vida.
// Evidencia fijada a la revisión publicada y comprobada de Neiva Abierta 0.4.
export const NEIVA_REVISION_EVIDENCIA = "5fd5188fb125309eae3f0b76af3e4755948d07d6";
const codigo = "https://github.com/SirHegel/neiva-abierta";
const evidencia = `${codigo}/blob/${NEIVA_REVISION_EVIDENCIA}`;

export const NEIVA_ABIERTA = {
  slug: "neiva-abierta",
  nombre: "Neiva Abierta",
  resumen: "Exploración de Neiva con un personaje sin nombre, conducción y paradas del centro. El inspector distingue la geometría cartográfica de las alturas estimadas.",
  repo: codigo,
  demo: "https://neiva-abierta.vercel.app/",
  estado: "Versión 0.4 · En desarrollo",
  lenguajes: ["JavaScript", "Three.js", "Cartografía abierta", "Unreal C++"],
  cifras: "22 cubiertas abiertas revisadas · Dimensiones físicas sin certificar",
  porQue: `El recorrido comienza junto al Parque Santander. Puedes acercarte a sus edificios,
    conducir y elegir una parada para observar el lugar con sus referencias. El pequeño estudio
    ficticio permite contactar mis servicios de desarrollo. La ciudad conserva huellas de mapas
    abiertos; el inspector muestra de dónde salen y señala las alturas que el juego estima.
    Una ventana dibujada sigue siendo una decisión del modelo, aunque la dirección esté en el mapa.`,
  detalles: [
    ["Movimiento y conducción", "Caminar incorpora aceleración y frenado. El carro reduce la velocidad antes de conectar la reversa y limita el giro al ganar velocidad. La simulación usa un paso fijo; estas reglas no describen un automóvil medido."],
    ["Recorrido con observación", "Elegir una parada activa una guía. La visita se registra al acercarse a pie y abrir su ficha, con referencias sobre el lugar. La distancia de la guía es en línea recta; no calcula una ruta libre de obstáculos."],
    ["Inspector de edificios", "Muestra área y dimensiones de la huella cartográfica, identificador y procedencia. Separa la altura estimada de una etiqueta de altura en OSM; ninguna equivale aquí a una medición de campo. Incluye acceso al mapa oficial para revisar el lugar."],
    ["Cubiertas abiertas", "La capa de correcciones conserva 22 techos etiquetados en OSM, incluidos 14 de gasolineras. Las paredes genéricas se retiran y la colisión queda en los soportes estimados, dejando paso bajo las cubiertas."],
    ["Ediciones y entrega", "La edición del navegador usa Three.js/WebGL y controles táctiles. El repositorio incluye el proyecto fuente de Unreal; su compilación y ejecución siguen pendientes de verificación. Vercel sirve la edición web."],
  ],
  auditoria: {
    queHice: "Integré datos abiertos, movimiento del personaje y conducción en una escena de Neiva. Añadí fichas de observación y un inspector de procedencia. La revisión cartográfica conserva los registros originales y aplica aparte las correcciones de cubiertas y de un contorno dañado por redondeo.",
    contiene: "Una edición web jugable, el proyecto fuente Unreal y una revisión documentada del centro. El archivo cartográfico contiene 35.875 huellas de edificios: 878 de OSM y 34.997 de detección automática vía Overture. Las fachadas genéricas y las alturas ausentes son interpretaciones; el terreno del juego es plano.",
    verificacion: `La <a href="${evidencia}/public/data/neiva-corrections.json" rel="noopener" target="_blank">capa de correcciones</a> conserva IDs, fuentes y el hash del mapa base. Seis <a href="${evidencia}/tests/cartographic-corrections.test.mjs" rel="noopener" target="_blank">pruebas de la capa</a> comprueban soportes dentro de las huellas y paso por once accesos antes bloqueados. Las reglas de movimiento tienen <a href="${evidencia}/docs/JUGABILIDAD.md" rel="noopener" target="_blank">modelo y comprobaciones documentados</a>. La <a href="${evidencia}/docs/FIDELIDAD.md" rel="noopener" target="_blank">auditoría de fidelidad</a> distingue errores confirmados de candidatos sin prueba independiente. La <a href="${evidencia}/docs/RENDIMIENTO.md" rel="noopener" target="_blank">medición en el Intel UHD probado</a> publica muestras y condiciones; no predice el rendimiento de otros equipos.`,
    formula: "C = cubiertas de la fuente representadas abiertas / cubiertas etiquetadas en la fuente",
    variables: "C es una proporción entre 0 y 1. La unidad es una huella OSM con building=roof; la revisión contiene 22. Se conserva cada identificador.",
    base: "Antes de aplicar la corrección: 0/22. Después de la comprobación de la capa: 22/22 = 1. La cuenta mide la interpretación de esa etiqueta; no certifica la ciudad completa.",
    umbral: "Umbral de la comprobación: C = 1; ninguna de las 22 cubiertas debe conservar una colisión de edificio cerrado.",
    error: "σ = desconocida para las dimensiones físicas: no hay levantamiento de campo. Las posiciones y el tamaño de los soportes son estimados. Las pruebas geométricas no verifican el estado actual de cada inmueble.",
    sanidad: "Con cero cubiertas el cociente no se calcula. Una cubierta cerrada hace fallar la cuenta. Las pruebas comprueban un paso por debajo del techo y una colisión en cada soporte, sin cambiar las alturas del archivo base.",
    limites: "Las 34.997 huellas ML carecen de altura en el snapshot usado: el juego les asigna 5,8 m estimados. Tampoco se certifican los 25 valores escritos como height en OSM. No se ha recorrido cada barrio ni modelado todos los interiores. TODO(dato): levantamiento métrico con fecha y precisión, compilación de Unreal y medición en otros computadores y celulares físicos.",
    costo: "Aplicar la capa recorre las huellas una vez: O(B + V) tiempo y espacio, donde B es el número de edificios y V los vértices revisados. Las reglas elementales de caminar y conducir cuestan O(1) por paso, aparte de las colisiones. TODO(dato): horas humanas, costo en pesos y rendimiento en otros computadores y celulares físicos.",
  },
};

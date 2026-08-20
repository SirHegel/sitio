// Contenido del sitio. Fuente única: nada se escribe dos veces.
// Los datos personales están contrastados con LinkedIn, certificados y el CV.

export const SITIO = "https://jhonstevenalvarezruiz.vercel.app";

// Clave de IndexNow: permite avisar a Bing y Yandex de cada publicación sin
// esperar a que pasen a rastrear. Se sirve como archivo en la raíz.
export const CLAVE_INDEXNOW = "1b705064e23f6ee21867b0f36fca75ed";

// Verificación de Google Search Console. Se sirven los dos métodos —archivo y
// etiqueta— porque si uno se pierde en una migración, el otro sostiene la
// propiedad. Perder la verificación borra el histórico de la consola.
export const GOOGLE_ARCHIVO = "googlebf4a2dfeb19e4c06.html";
export const GOOGLE_ETIQUETA = "ugLMeHvGKMMu1wF1UIdCfu00dVrrZvlXGcAVX2HRVtw";

export const PERSONA = {
  nombre: "Jhon Steven Alvarez Ruiz",
  // Variantes con las que también se le busca. Van en alternateName del JSON-LD
  // para que Google unifique las tres consultas en una sola entidad.
  alias: [
    "Jhon Steven Álvarez Ruiz",
    "Jhon Alvarez Ruiz",
    "Jhon Steven Alvarez",
    "Jhon Alvarez",
    "SirHegel",
  ],
  titular: "Economista y analista de datos",
  subtitular: "Tecnólogo en Análisis y Desarrollo de Software · Arquitectura de sistemas multiagente",
  ciudad: "Neiva",
  region: "Huila",
  pais: "Colombia",
  email: "alvarezruizj289@gmail.com",
  linkedin: "https://www.linkedin.com/in/jhonstevenalvarezruiz/",
  github: "https://github.com/SirHegel",
  humanizar: "https://www.humanizar.tech/",
  // sameAs: la lista que le dice a Google "estos perfiles son la misma persona".
  perfiles() {
    return [this.linkedin, this.github, this.humanizar];
  },
  sabeDe: [
    "Análisis de datos",
    "Economía política",
    "Econometría",
    "Python",
    "SQL",
    "Power BI",
    "Automatización de procesos",
    "Sistemas multiagente",
    "Auditoría financiera",
    "Inteligencia de negocios",
  ],
};

export const EPIGRAFE = {
  texto: "Die Eule der Minerva beginnt erst mit der einbrechenden Dämmerung ihren Flug.",
  fuente: "Hegel, prefacio a los Principios de la filosofía del derecho",
};

export const PRESENTACION = [
  `Soy <b>Jhon Steven Alvarez Ruiz</b>, economista y analista de datos en Neiva, Huila.
   Trabajo con tres materiales que la convención académica mantiene separados sin buena razón:
   la crítica de la economía política, la arquitectura de sistemas multiagente y la lógica que
   permite decir cuándo un conjunto de partes constituye un todo y cuándo sigue siendo un montón.`,
  `No son tres campos. Son un solo problema abordado con tres instrumentos.`,
];

export const METRICAS = [
  { valor: 8352635, sufijo: "", etiqueta: "tokens enrutados", nota: "medición real sobre 104 ejecuciones" },
  { valor: 5, sufijo: "", etiqueta: "repositorios en producción", nota: "auditados, con CI bloqueante" },
  { valor: 61, sufijo: "%", etiqueta: "líneas de prueba por línea de código", nota: "en el repositorio con mayor disciplina" },
  { valor: 90, sufijo: "%", etiqueta: "reducción de tiempo administrativo", nota: "automatización financiera en Designter" },
];

export const EXPERIENCIA = [
  {
    cargo: "Consultor Especializado en Rediseño Web y Soporte Técnico",
    empresa: "Polidinámica",
    lugar: "México · Remoto",
    desde: "2026-01",
    fechas: "Enero 2026 — Actualidad",
    puntos: [
      "Lideré la reestructuración integral de la plataforma digital de la compañía, alineando arquitectura de información y experiencia de usuario con la estrategia comercial.",
      "Desarrollé desde cero un panel administrativo con sistema de login seguro, que permitió gestión autónoma de contenidos sin intervención técnica externa.",
      "Integré un bot conversacional de ventas para automatizar la atención, captar prospectos y acortar el embudo de conversión.",
      "Ejecuté un estudio SEO intensivo y optimicé el rendimiento del sitio para posicionamiento orgánico y tiempos de carga.",
    ],
  },
  {
    cargo: "Director Ejecutivo",
    empresa: "Designter S.A.S",
    lugar: "Neiva, Colombia · Remoto",
    desde: "2025-10",
    fechas: "Octubre 2025 — Actualidad",
    puntos: [
      "Dirijo la operación y el desarrollo de aplicativos web y ecosistemas digitales para infoproductores.",
      "Desarrollé un ecosistema de automatización financiera en Python con Google Sheets API que redujo un 90% el tiempo de registro administrativo.",
      "Diseñé un tablero de Business Intelligence que categoriza automáticamente ingresos personales y corporativos y emite alertas de salud financiera.",
      "Audito y optimizo embudos de venta con análisis de datos para sostener la rentabilidad de cada página comercial.",
    ],
  },
  {
    cargo: "Ejecutivo de Ventas",
    empresa: "Siigo",
    lugar: "Colombia · Remoto",
    desde: "2026-06",
    fechas: "Junio 2026 — Agosto 2026",
    puntos: [
      "Comercialicé software contable y administrativo a pymes, con foco en diagnóstico financiero del cliente.",
      "Apliqué venta consultiva sobre indicadores económicos del prospecto para dimensionar la solución.",
    ],
  },
  {
    cargo: "Auditor y Analista de Datos Financieros",
    empresa: "Translegal Group Colombia S.A.S",
    lugar: "Cartagena, Colombia · Remoto",
    desde: "2024-09",
    fechas: "Septiembre 2024 — Agosto 2025",
    puntos: [
      "Diseñé e implementé modelos de análisis financiero orientados a optimización de recursos y flujos de capital en pymes.",
      "Ejecuté auditoría interna y control de datos garantizando precisión, integridad y transparencia de la información.",
      "Construí y administré bases de datos estructuradas para gestión de clientes y desempeño comercial.",
      "Elaboré reportes e indicadores clave de desempeño (KPI) con SQL, Python y Power BI que soportaron decisiones estratégicas.",
      "Integré análisis cuantitativo y cualitativo en estudios de mercado para planificación comercial.",
    ],
  },
  {
    cargo: "Auditor y Analista de Datos en Ventas",
    empresa: "Fundación para el Desarrollo Sostenible y la Participación Ciudadana (FUNDESPAC)",
    lugar: "Cali, Colombia · Híbrido",
    desde: "2024-01",
    fechas: "Enero 2024 — Agosto 2025",
    puntos: [
      "Implementé modelos de control y auditoría interna que mejoraron un 25% la trazabilidad de las operaciones financieras.",
      "Analicé tendencias de mercado y comportamiento del cliente para fortalecer la estrategia de ventas.",
    ],
  },
];

export const EDUCACION = [
  {
    titulo: "Tecnólogo en Análisis y Desarrollo de Software",
    institucion: "Servicio Nacional de Aprendizaje (SENA)",
    sitio: "https://www.sena.edu.co/",
    fechas: "Diciembre 2025 — Marzo 2028 (en curso)",
    desde: "2025-12",
    hasta: "2028-03",
    nota: "Análisis y Desarrollo de Software (ADSO). Ciclo completo: análisis de requisitos, diseño de bases de datos, desarrollo, pruebas y despliegue.",
  },
  {
    titulo: "Pregrado en Economía",
    institucion: "Universidad Nacional Abierta y a Distancia (UNAD)",
    sitio: "https://www.unad.edu.co/",
    fechas: "2023 — Enero 2027 (en curso)",
    desde: "2023-01",
    hasta: "2027-01",
    nota: "Monitor académico de Historia del Pensamiento Económico (2023-2) y de Macroeconomía I. Énfasis en econometría y estadística aplicada.",
  },
  {
    titulo: "Bachiller Académico",
    institucion: "I.E. Humberto Tafur Charry",
    sitio: "",
    fechas: "Neiva, 2022",
    desde: "2022-01",
    hasta: "2022-12",
    nota: "",
  },
];

export const INVESTIGACION = {
  titulo: "Semillero de Investigación",
  institucion: "Universidad Surcolombiana (USCO)",
  sitio: "https://www.usco.edu.co/",
  fechas: "Junio 2025 — Actualidad",
  nota: `Miembro activo. Línea de trabajo: <b>distribución de la tierra en Colombia</b>.
         Coordinación de grupos de estudio y discusión metodológica sobre las fuentes
         catastrales y su tratamiento estadístico.`,
};

export const LINEAS = [
  {
    titulo: "Crítica de la economía política",
    cuerpo: `Trabajo la teoría económica desde la tradición que se niega a tomar el equilibrio como
      punto de partida, porque el equilibrio no es un hecho: es un supuesto que decide de antemano
      lo que el modelo va a poder ver. De la Escuela de Oviedo tomo el aparato categorial —la
      economía política no se ordena por magnitudes sino por categorías— y de Juan Íñigo Carrera,
      la exigencia sobre el método: la crítica no consiste en oponer un modelo a otro, sino en
      reproducir en el pensamiento el movimiento real de la forma criticada.`,
  },
  {
    titulo: "Sistemas multiagente y planos de control",
    cuerpo: `Un agente no es una empresa. La afirmación no es retórica ni cuantitativa: es categorial.
      Sumar agentes no produce una empresa, como sumar monedas no produce capital. Lo que constituye
      una empresa es una forma determinada de organización —división del trabajo, atribución de
      responsabilidad, gobierno de la capacidad, contabilidad del gasto— y esa forma no está
      contenida en ninguna de sus partes. De ahí que un plano de control no describa la
      organización: la ejerce, y por eso puede auditarse.`,
  },
  {
    titulo: "Lógica de las totalidades",
    cuerpo: `La pregunta de cuándo un conjunto de partes constituye un todo y cuándo permanece
      montón atraviesa las dos líneas anteriores. Es la misma operación que Gustavo Bueno desmonta
      al mostrar cómo se hipostasía lo que solo existe como relación, y la que Stephen Houlgate
      defiende al exigir un comienzo sin presupuestos, cuyas categorías no se importen desde fuera
      sino que se generen en el propio desarrollo.`,
  },
];

export const CERTIFICACIONES = [
  { nombre: "IBM SkillsBuild Data Analytics", emisor: "IBM", fecha: "Octubre 2025", anio: "2025-10" },
  { nombre: "Data Preparation for Analysis · Data Collection and Analysis", emisor: "IBM", fecha: "Octubre 2025", anio: "2025-10" },
  { nombre: "Bootcamp de Programación, Nivel Explorador (164 horas)", emisor: "MinTIC de Colombia y CUN", fecha: "Diciembre 2025", anio: "2025-12" },
  { nombre: "Diplomado en Auditoría de Sistemas de Gestión ISO 19011:2018", emisor: "Politécnico de Colombia", fecha: "Septiembre 2025", anio: "2025-09" },
  { nombre: "Administración y Recuperación de Cartera de Créditos", emisor: "SENA", fecha: "Diciembre 2025", anio: "2025-12" },
  { nombre: "Análisis Financiero · Cálculo e Interpretación de Indicadores Financieros", emisor: "SENA", fecha: "Noviembre 2025", anio: "2025-11" },
  { nombre: "Venta Consultiva de Productos Financieros", emisor: "SENA", fecha: "Noviembre 2025", anio: "2025-11" },
  { nombre: "Ética, seguridad y buenas prácticas en el uso de IA", emisor: "UBITS", fecha: "Junio 2026", anio: "2026-06" },
  { nombre: "Iniciación al Desarrollo con IA", emisor: "BIG school", fecha: "Marzo 2026", anio: "2026-03" },
];

export const IDIOMAS = "Español (nativo) · Inglés (intermedio)";

export const PROYECTOS = [
  {
    slug: "orquesta-ia",
    nombre: "Orquesta IA",
    resumen: "Orquestador local multicuenta que reparte trabajo entre 8 cuentas de IA de 4 proveedores, con contabilidad de cuotas y traspaso de contexto ante fallo.",
    repo: "https://github.com/SirHegel/orquesta-ia",
    demo: "",
    lenguajes: ["Python", "SQLite", "systemd"],
    cifras: "3.037 líneas de código · 769 de prueba",
    porQue: `El problema no es llamar a un modelo: es decidir cuál, con qué cuota restante, y qué
      hacer cuando el que estaba trabajando se queda sin ventana a mitad de tarea. Orquesta IA
      contabiliza el gasto por ventana de cuota, detecta el límite antes de chocarse con él y
      traspasa el contexto al siguiente ejecutor sin perder el hilo.`,
    detalles: [
      ["Enrutado por tipo de tarea", "Cada tipo de trabajo tiene un perfil de modelo asignado, no un modelo fijo. El perfil se resuelve en tiempo de ejecución contra la cuota disponible."],
      ["Contabilidad por ventana", "El gasto se imputa a la ventana de cuota vigente de cada cuenta, no al total del día. Sin eso, la detección de límite llega tarde."],
      ["Auditoría cruzada", "Un modelo revisa la salida de otro antes de darla por buena. La verificación no es opcional en el camino feliz."],
      ["Medición real", "8.352.635 tokens enrutados en 104 ejecuciones, 82% completadas. La cifra sale del registro, no de una estimación."],
    ],
  },
  {
    slug: "automatizacion-evidencias-adso",
    nombre: "Automatización de evidencias ADSO",
    resumen: "Motor de 1.133 líneas que regenera, valida y audita entregables académicos, con auditoría de privacidad sobre cada parte extraída de cada archivo.",
    repo: "https://github.com/SirHegel/automatizacion-evidencias-adso",
    demo: "",
    lenguajes: ["Python", "GitHub Actions"],
    cifras: "8.405 líneas de código · 341 de prueba · CI bloqueante",
    porQue: `Un entregable no está bien porque se vea bien. Este motor descomprime los documentos
      de ofimática y lee su XML, exporta los PDF y los verifica, y corre una auditoría de privacidad
      sobre cada parte extraída de cada archivo. Cuando encuentra un riesgo, la integración continua
      bloquea el push. La verificación no es un informe: es una condición de entrega.`,
    detalles: [
      ["Verificación por XML", "Los documentos se abren como lo que son —un zip con XML dentro— en lugar de confiar en la vista previa."],
      ["Auditoría de privacidad", "Cada parte extraída se revisa en busca de datos que no deberían viajar en un entregable."],
      ["CI bloqueante", "El fallo no avisa: impide. Un aviso que se puede ignorar no es un control."],
    ],
  },
  {
    slug: "colmat-x-automation",
    nombre: "Colmat X Automation",
    resumen: "Cola editorial auditada sobre la API oficial de X, donde la aprobación queda vinculada al hash del texto revisado.",
    repo: "https://github.com/SirHegel/colmat-x-automation",
    demo: "",
    lenguajes: ["Python", "OAuth 1.0a", "SQLite", "Jinja"],
    cifras: "2.112 líneas de código · 1.294 de prueba · 0,61 líneas de prueba por línea de código",
    porQue: `La disciplina de prueba más alta del conjunto. Estado transaccional, OAuth 1.0a y una
      doble salvaguarda contra la publicación accidental: aprobar un texto aprueba <i>ese</i> texto,
      porque la aprobación se ata al hash de lo revisado. Si el contenido cambia después de la
      revisión, la aprobación deja de valer.`,
    detalles: [
      ["Aprobación vinculada al hash", "Se aprueba un contenido concreto, no un identificador de fila que alguien puede editar después."],
      ["Estado transaccional", "La reserva ocurre en base de datos antes de la llamada de red, no después."],
      ["Doble salvaguarda", "Dos condiciones independientes deben cumplirse para publicar."],
    ],
  },
  {
    slug: "sincategorematico-bot",
    nombre: "Sincategoremático Bot",
    resumen: "Sistema de publicación con aprobación humana obligatoria por Telegram, a prueba de duplicados por construcción.",
    repo: "https://github.com/SirHegel/sincategorematico-bot",
    demo: "",
    lenguajes: ["Python", "SQLite", "systemd"],
    cifras: "1.133 líneas de código · 134 de prueba",
    porQue: `Tres superficies sobre un mismo núcleo: bot de Telegram, tablero HTTP local y
      aplicación de escritorio. Protocolo de reclamación de propiedad con SHA-256 y caducidad;
      el token vive con permisos <code>0600</code> fuera del repositorio. Reserva en base de datos
      antes de enviar y no reintenta de forma automática: un reintento ciego es un duplicado
      esperando ocurrir.`,
    detalles: [
      ["Tres superficies, un núcleo", "La lógica no se duplica por interfaz. Cambiar una regla la cambia en las tres."],
      ["Reclamación con caducidad", "La propiedad de una tarea expira. Un proceso muerto no se queda con el trabajo."],
      ["Higiene de secretos", "El token nunca entra al repositorio y vive con permisos restringidos."],
    ],
  },
  {
    slug: "bloquitos",
    nombre: "Bloquitos",
    resumen: "Juego de bloques que caen con niveles infinitos, sin una sola dependencia externa, instalable como aplicación y jugable sin conexión.",
    repo: "https://github.com/SirHegel/bloquitos",
    demo: "https://sirhegel.github.io/bloquitos/",
    lenguajes: ["JavaScript", "HTML", "CSS"],
    cifras: "3.011 líneas de código · 740 de prueba · 60 pruebas",
    porQue: `La superficie de entrega más amplia del conjunto: navegador, aplicación instalable,
      ejecutable de escritorio y base de datos local, sin una sola dependencia externa. La política
      de seguridad de contenido apunta entera a <code>'self'</code>: el juego no puede pedir un
      script, un estilo ni una tipografía a ningún servidor. Como no tiene dependencias, esa
      política no le quita nada y cierra la puerta a la inyección de código de terceros.`,
    detalles: [
      ["Cero dependencias", "No hay cadena de suministro que auditar porque no hay cadena de suministro."],
      ["CSP total a 'self'", "La política no es aspiracional: el juego funciona completo bajo ella."],
      ["Sin conexión", "Instalable como aplicación y jugable con la red caída."],
    ],
  },
  {
    slug: "designter-financial-bot",
    nombre: "Asistente Financiero Automatizado",
    resumen: "Bot de Telegram con procesamiento de lenguaje natural que categoriza flujo de caja en tiempo real vía Google Sheets API.",
    repo: "https://github.com/SirHegel/designter-financial-bot",
    demo: "",
    lenguajes: ["Python", "Google Sheets API"],
    cifras: "Redujo un 90% el tiempo de registro contable",
    porQue: `Escribir un gasto en lenguaje natural y que quede categorizado, imputado y visible en
      el tablero antes de terminar la frase. El cuello de botella de la contabilidad de una pyme
      no es el análisis: es el registro. Atacado el registro, el análisis se vuelve posible.`,
    detalles: [
      ["Categorización en lenguaje natural", "El usuario no aprende una sintaxis: escribe como habla."],
      ["Separación personal / corporativa", "Dos contabilidades sobre un mismo flujo de entrada."],
      ["Alertas de salud financiera", "El tablero no espera a que alguien lo consulte."],
    ],
  },
];

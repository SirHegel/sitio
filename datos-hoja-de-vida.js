/* Contenido específico de la hoja de vida.
   La experiencia, educación y certificaciones siguen viviendo en datos.js;
   aquí solo está la capa profesional extensa que consumen la página y el PDF. */

import { REPOSITORIOS_GITHUB } from "./datos-github.js";

export const ARCHIVO_HOJA_DE_VIDA = "/activos/hoja-de-vida-jhon-steven-alvarez-ruiz.pdf";

const NOMBRES_PROYECTO = new Map([
  ["automatizacion-evidencias-adso", "Automatización de evidencias ADSO"],
  ["orquesta-ia", "Orquesta IA"],
  ["colmat-x-automation", "Colmat X Automation"],
  ["sincategorematico-bot", "Sincategoremático Bot"],
  ["bloquitos", "Bloquitos"],
  ["gh-achievement-audit", "GitHub Achievement Audit"],
]);

const PROYECTOS_EVIDENCIA = REPOSITORIOS_GITHUB.metricas.repositorios.map((item) => ({
  nombre: NOMBRES_PROYECTO.get(item.nombre) || item.nombre,
  repositorio: item.nombre,
  url: item.url,
  revision: item.revision,
  fuente: item.fuente,
  prueba: item.prueba,
  commits: item.commits,
  pipelines: item.pipelines,
}));

export const EVIDENCIA_TECNICA = {
  corte: new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeZone: "America/Bogota" })
    .format(new Date(REPOSITORIOS_GITHUB.actualizadoEn)),
  fuente: REPOSITORIOS_GITHUB.metricas.fuente,
  metodo: REPOSITORIOS_GITHUB.metricas.metodo,
  proyectos: PROYECTOS_EVIDENCIA,
  totales: PROYECTOS_EVIDENCIA.reduce(
    (total, proyecto) => ({
      fuente: total.fuente + proyecto.fuente,
      prueba: total.prueba + proyecto.prueba,
      commits: total.commits + proyecto.commits,
      pipelines: total.pipelines + proyecto.pipelines,
    }),
    { fuente: 0, prueba: 0, commits: 0, pipelines: 0 },
  ),
};

export const HOJA_DE_VIDA = {
  actualizado: "Agosto de 2026",
  titular: "Arquitectura de automatización y sistemas multiagente · Análisis de datos y economía aplicada",
  disponibilidad: "Neiva, Huila, Colombia · Disponible para trabajo remoto",
  resumen: [
    `Desarrollador de automatización y analista de datos con experiencia en construcción de
     sistemas automatizados, productos web, auditoría financiera, Business Intelligence y venta
     consultiva de software. Integro ingeniería y negocio: convierto procesos dispersos en flujos
     medibles, con persistencia, controles humanos, trazabilidad y criterios verificables de cierre.`,
    `Co-creador de CAUCE V3 junto con Steven Vallejo Ortiz: una arquitectura multi-harness que
     organiza equipos especializados bajo un plano de control común, mantiene contexto entre
     procesos y aísla responsabilidades para que los ejecutores no se pisen. El núcleo privado
     incorpora la conexión con OpenClaw, Hermes y Claude Code descrita para este perfil; la
     presentación pública y sus capacidades verificables viven en humanizar.tech.`,
    `Mi práctica combina Python, JavaScript/TypeScript, SQL, PHP y automatización de infraestructura
     con MySQL, SQLite, IndexedDB, PostgreSQL en un prototipo activo y capas operativas basadas en
     APIs. También trabajo econometría, análisis financiero y Power BI para conectar la arquitectura
     técnica con decisiones reales de producto y operación.`,
  ],
  diferenciales: [
    "Diseño de sistemas multiagente y multi-harness con jerarquías explícitas, delegación tipada y continuidad de contexto.",
    "Automatización de procesos completos: captura, validación, persistencia, decisión, aprobación humana, entrega y auditoría.",
    "Capacidad de traducir necesidades comerciales y financieras a modelos de datos, indicadores y software operativo.",
    "Seguridad por construcción: aislamiento de cuentas, bloqueo por repositorio, secretos fuera de Git, aprobación ligada al contenido y CI bloqueante.",
    "Experiencia dirigiendo operación, desarrollando producto y trabajando con clientes, no solo escribiendo código aislado.",
  ],
  cauce: {
    nombre: "CAUCE V3",
    url: "https://humanizar.tech/",
    repositorioPublico: "https://github.com/stevenvo780/cauce-v3-humanizar-tech",
    socio: "Steven Vallejo Ortiz",
    socioUrl: "https://www.stevenvallejo.com/es",
    descripcion: `Sistema de orquestación organizacional que convierte harnesses y agentes dispersos
      en equipos gobernados, auditables y capaces de sostener trabajos multietapa con relevo durable.`,
    puntos: [
      "Plano de control único para coordinar de dos a N equipos especializados e incorporar nuevos harnesses o subsistemas bajo contratos comunes.",
      "En el núcleo privado, capa de interoperabilidad para OpenClaw, Hermes, Claude Code y otros harnesses compatibles; la presentación pública documenta cuatro motores bajo contrato.",
      "Continuidad de contexto entre motores: encargo, sesiones previas, artefactos, archivos cambiados y estado real del repositorio acompañan cada relevo.",
      "Enrutamiento durable con reservas que expiran, redistribución automática y cola de operaciones fallidas con mensaje completo.",
      "Protocolos tipados que separan respuesta, delegación, notificación y artefactos para impedir colisiones de responsabilidad.",
      "Aislamiento por cliente y por almacenamiento; puertas humanas para despliegue, secretos, eliminación y gasto.",
    ],
  },
  competencias: [
    {
      nombre: "Lenguajes y desarrollo",
      items: "Python, JavaScript, Node.js, TypeScript, React, Next.js, SQL, PHP, HTML5, CSS3, Bash, Jinja y YAML.",
    },
    {
      nombre: "Bases de datos y capas de información",
      items: "MySQL/MariaDB/InnoDB, SQLite, IndexedDB, Google Sheets API y PostgreSQL en prototipo activo; modelos relacionales, transacciones, migraciones y ledgers JSON/JSONL.",
    },
    {
      nombre: "IA, agentes y automatización",
      items: "Arquitectura multiagente, multi-harness, plano de control, enrutamiento por capacidad, continuidad de contexto, gestión de cuotas, Claude Code, Codex, Antigravity, MiniMax, Telegram Bot API e integración privada con OpenClaw y Hermes.",
    },
    {
      nombre: "Plataforma, calidad y seguridad",
      items: "Linux, Git, GitHub Actions, Vercel, systemd, cron, Playwright, APIs REST, OAuth 1.0a/OAuth 2.0, pruebas automatizadas, CI/CD, escaneo de secretos, CSP y diseño idempotente.",
    },
    {
      nombre: "Datos, economía y producto",
      items: "Power BI, Excel, Business Intelligence, KPI, econometría, estadística aplicada, análisis financiero, auditoría, SEO, UX/UI, CRM y venta consultiva.",
    },
  ],
  proyectos: [
    {
      nombre: "Orquesta IA",
      url: "https://github.com/SirHegel/orquesta-ia",
      tecnologias: "Python · orquestación multi-cuenta · Linux",
      descripcion: `Antecedente público de CAUCE. Enruta tareas entre Claude Code, GPT/Codex,
        Antigravity y MiniMax según capacidad, potencia y cuota; aísla cuentas, impide escrituras
        concurrentes sobre el mismo repositorio, conserva contexto ante fallo y ejecuta verificación
        y escaneo de secretos antes de publicar.`,
    },
    {
      nombre: "Automatización de evidencias ADSO",
      url: "https://github.com/SirHegel/automatizacion-evidencias-adso",
      tecnologias: "Python · XML de Office · PDF · GitHub Actions",
      descripcion: `Motor que regenera, valida y audita entregables. Descomprime documentos de
        ofimática, inspecciona su XML, exporta y verifica PDF y bloquea la integración continua si
        detecta un riesgo de privacidad o una inconsistencia.`,
    },
    {
      nombre: "Colmat X Automation",
      url: "https://github.com/SirHegel/colmat-x-automation",
      tecnologias: "Python · SQLite · OAuth 1.0a · Jinja",
      descripcion: `Cola editorial transaccional sobre la API oficial de X. Vincula la aprobación
        al hash del contenido revisado, invalida autorizaciones obsoletas y exige tres puertas
        independientes antes de una publicación real.`,
    },
    {
      nombre: "Sincategoremático Bot",
      url: "https://github.com/SirHegel/sincategorematico-bot",
      tecnologias: "Python · SQLite · Telegram · systemd",
      descripcion: `Núcleo único expuesto por bot, tablero HTTP local y aplicación de escritorio.
        Mitiga duplicados mediante reserva previa, bloquea reintentos ciegos, exige aprobación humana
        y protege tokens fuera del repositorio con permisos restringidos.`,
    },
    {
      nombre: "Asistente Financiero Automatizado",
      url: "https://github.com/SirHegel/designter-financial-bot",
      tecnologias: "Python · Google Sheets API · Telegram",
      descripcion: `Interpreta movimientos en lenguaje natural, separa contabilidad personal y
        corporativa, actualiza el tablero y emite alertas para reducir el registro manual y mejorar
        la trazabilidad administrativa de Designter.`,
    },
    {
      nombre: "Aycomer",
      url: "",
      visibilidad: "Proyecto privado",
      tecnologias: "PHP · MySQL/InnoDB · SQL · seguridad web",
      descripcion: `Plataforma transaccional con roles, auditoría, inventario, pedidos, sesiones,
        recuperación de cuenta y modelo de consentimiento. Usa consultas preparadas, transacciones,
        controles de concurrencia y secretos fuera del árbol público.`,
    },
  ],
};

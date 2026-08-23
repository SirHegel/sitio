// Archivo generado por herramientas/sincronizar-github.js.
// No editar a mano: el workflow lo reemplaza solo cuando GitHub cambia.
export const REPOSITORIOS_GITHUB = {
  "propietario": "SirHegel",
  "perfil": "https://github.com/SirHegel",
  "actualizadoEn": "2026-08-23T19:40:01.000Z",
  "total": 20,
  "repositorios": [
    {
      "slug": "automatizacion-evidencias-adso",
      "nombre": "automatizacion-evidencias-adso",
      "descripcion": "Automatización reproducible para resolver, generar, validar y auditar evidencias de Análisis y Desarrollo de Software",
      "url": "https://github.com/SirHegel/automatizacion-evidencias-adso",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [
        {
          "nombre": "Python",
          "bytes": 304774
        },
        {
          "nombre": "JavaScript",
          "bytes": 37361
        },
        {
          "nombre": "Papyrus",
          "bytes": 16853
        }
      ],
      "temas": [
        "automation",
        "ci",
        "ooxml",
        "pdf",
        "privacy-audit",
        "python",
        "reproducible-builds"
      ],
      "licencia": null,
      "ramaPredeterminada": "main",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2026-08-15T17:38:37.000Z",
      "actualizadoEn": "2026-08-20T22:24:02.000Z",
      "publicadoEn": "2026-08-17T16:37:12.000Z",
      "extractoReadme": "Automatización de evidencias SENA — Análisis y Desarrollo de Software\n\nSistema reproducible para organizar, resolver, generar y validar talleres del programa de\nAnálisis y Desarrollo de Software.\n\nCada evidencia es autocontenida: el instrumento original, la explicación de cómo se resolvió y los archivos finales permanecen dentro de la misma carpeta.\nEstructura\n\nLas carpetas siguen siempre el mismo orden:\n01enunciado: documento original que define la evidencia.\n02solucion: guiones, fuentes, recursos y código utilizado para resolverla.\n03entrega: productos públicos sin datos personales, destinados a GitHub.\n04entregapersonalizada.local: únicamente los documentos identificados que se usan\npara entregar o grabar la evidencia; Git los ignora por contener datos sensibles.\nINFORMERESOLUCION.md: relación entre la rúbrica y la solución realizada.\n\nLa carpeta automatizacion contiene el resolutor…"
    },
    {
      "slug": "before-you-contribute",
      "nombre": "before-you-contribute",
      "descripcion": "Two checks to run before contributing: does the project accept AI-assisted work, and is the issue actually free?",
      "url": "https://github.com/SirHegel/before-you-contribute",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [
        {
          "nombre": "Shell",
          "bytes": 6224
        }
      ],
      "temas": [
        "ai-policy",
        "code-contribution",
        "contributing",
        "developer-tools",
        "github-cli",
        "maintainers",
        "open-source",
        "oss",
        "shell"
      ],
      "licencia": {
        "spdx": "MIT",
        "nombre": "MIT License"
      },
      "ramaPredeterminada": "master",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2026-08-20T21:41:04.000Z",
      "actualizadoEn": "2026-08-20T22:24:03.000Z",
      "publicadoEn": "2026-08-20T21:42:11.000Z",
      "extractoReadme": "before-you-contribute\n\nTwo shell scripts that answer the two questions worth asking before you write a line of\ncode for someone else's project:\nDoes this project accept AI-assisted contributions, and on what terms?\nIs anyone already working on this issue?\n\nBoth are one command, both read GitHub rather than guessing, and both exist because\ngetting either one wrong wastes a maintainer's afternoon.\n\nai-policy — where the rules actually live\n\nProjects publish their position on AI-assisted contributions in four different places,\nand the one people check is usually not the one that matters.\n\nPallets' prohibition is not in the Click repository. It is in pallets/.github, the\norganisation-wide defaults repo, and on the project website. Reading\npallets/click/CONTRIBUTING and finding nothing tells you nothing.\n\nSo the script reads, in order:\n/.github — CONTRIBUTING.md, AIPOLICY.md,…"
    },
    {
      "slug": "betplaycito-nelson",
      "nombre": "betplaycito-nelson",
      "descripcion": "Dashboard local y persistente de tendencias estadísticas de fútbol con SQLite.",
      "url": "https://github.com/SirHegel/betplaycito-nelson",
      "homepage": "",
      "lenguajes": [
        {
          "nombre": "Python",
          "bytes": 117178
        },
        {
          "nombre": "CSS",
          "bytes": 70186
        },
        {
          "nombre": "JavaScript",
          "bytes": 64003
        },
        {
          "nombre": "HTML",
          "bytes": 27417
        },
        {
          "nombre": "Shell",
          "bytes": 12006
        },
        {
          "nombre": "Inno Setup",
          "bytes": 1875
        }
      ],
      "temas": [
        "dashboard",
        "football",
        "futbol",
        "offline-first",
        "python",
        "sqlite"
      ],
      "licencia": {
        "spdx": "MIT",
        "nombre": "MIT License"
      },
      "ramaPredeterminada": "main",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2026-08-21T21:33:46.000Z",
      "actualizadoEn": "2026-08-21T22:10:03.000Z",
      "publicadoEn": "2026-08-21T22:09:41.000Z",
      "extractoReadme": "BetPlaycito Nelson\n\nDashboard local y persistente para registrar tendencias históricas de fútbol, comparar equipos y visualizar porcentajes en gráficos circulares. Funciona en Windows, macOS y Ubuntu; no necesita una cuenta en la nube ni envía los datos a servicios externos.\n[!IMPORTANT]\nLos porcentajes resumen únicamente los registros ingresados. No garantizan resultados futuros ni constituyen asesoría de apuestas.\nDescargar e instalar\n\nLa versión más reciente está en GitHub Releases.\n\n· Sistema · Archivo recomendado · Uso ·\n\n· Windows 10/11 x64 · BetPlaycito-Nelson--Windows-x64-Setup.exe · Abrir, aceptar el permiso de instalación y seguir el asistente. ·\n· Windows x64 portable · BetPlaycito-Nelson--Windows-x64-portable.exe · Un solo archivo; doble clic sin instalar. ·\n· Mac con Apple Silicon · BetPlaycito-Nelson--macOS-arm64.dmg · Abrir la imagen y arrastrar la app a Aplicaciones. ·\n·…"
    },
    {
      "slug": "bloquitos",
      "nombre": "bloquitos",
      "descripcion": "Juego de bloques que caen con niveles infinitos, joyas de caramelo y modo sin conexión. Sin dependencias, instalable como aplicación.",
      "url": "https://github.com/SirHegel/bloquitos",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [
        {
          "nombre": "JavaScript",
          "bytes": 248674
        },
        {
          "nombre": "CSS",
          "bytes": 21879
        },
        {
          "nombre": "HTML",
          "bytes": 11990
        },
        {
          "nombre": "Shell",
          "bytes": 2557
        }
      ],
      "temas": [
        "canvas",
        "game",
        "javascript",
        "juego",
        "kids-game",
        "offline-first",
        "pwa",
        "sin-dependencias",
        "tetromino",
        "vanilla-js"
      ],
      "licencia": {
        "spdx": "MIT",
        "nombre": "MIT License"
      },
      "ramaPredeterminada": "main",
      "estrellas": 1,
      "forks": 0,
      "creadoEn": "2026-08-19T21:51:37.000Z",
      "actualizadoEn": "2026-08-20T22:24:03.000Z",
      "publicadoEn": "2026-08-20T22:03:28.000Z",
      "extractoReadme": "Bloquitos\n\nJuego de bloques que caen, con niveles infinitos y piezas que parecen joyas de\ncaramelo. Guarda tu historial de partidas, tus récords y tus logros en una base\nde datos local, funciona sin conexión, y se puede jugar de tres formas: abriendo\nun archivo, en la web, o como aplicación instalada.\n\nPensado para que lo juegue un niño sin frustrarse, pero con la mecánica completa\nque espera alguien que lleva años jugando a este género.\n\n▶ Jugar ahora: sirhegel.github.io/bloquitos\n\nLa misma versión se publica además en Vercel, que añade las cabeceras de\nseguridad reales y una dirección de vista previa por cada rama. Cómo publicarlo\nestá en DESPLIEGUE.md.\nCómo se instala\n\nDepende de cómo quieras jugarlo. Ninguna de las tres opciones necesita instalar\ndependencias: el juego no tiene ni una.\n\n1. En la web — no se instala nada. Abre el enlace de arriba y ya está.\n\nSi lo quieres como…"
    },
    {
      "slug": "CALCULADORA-PHP",
      "nombre": "CALCULADORA-PHP",
      "descripcion": "Arithmetic calculator with an HTML form and PHP operations on the server.",
      "url": "https://github.com/SirHegel/CALCULADORA-PHP",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [
        {
          "nombre": "HTML",
          "bytes": 4367
        },
        {
          "nombre": "PHP",
          "bytes": 3588
        }
      ],
      "temas": [
        "calculator",
        "html",
        "php"
      ],
      "licencia": null,
      "ramaPredeterminada": "main",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2025-10-18T04:00:42.000Z",
      "actualizadoEn": "2026-08-20T22:24:04.000Z",
      "publicadoEn": "2026-08-20T07:32:59.000Z",
      "extractoReadme": "Calculator — PHP\n\nAn arithmetic calculator that submits an HTML form to the server and returns the\nresult. The whole point is that nothing is computed in the browser: the form\nposts, PHP does the work, the page comes back with the answer.\nFiles\n\n· File · Role ·\n\n· index.html · The form: two numbers and an operation. ·\n· operaciones.php · Reads the POST, validates, computes, reports. ·\n· suma.php · Addition on its own, kept as the simplest case. ·\nRunning it\n\nServe the directory with any PHP-capable server:\n\nThen open\nWhat it handles\n\nInput is coerced with floatval, so a non-numeric field becomes 0 rather than\nan error. Division checks for a zero divisor before dividing and returns a\nmessage instead of a warning. State survives the round trip through the session,\nwhich is why sessionstart() is the first call in operaciones.php."
    },
    {
      "slug": "colmat-x-automation",
      "nombre": "colmat-x-automation",
      "descripcion": "Automatización segura de publicaciones en X para Colmat",
      "url": "https://github.com/SirHegel/colmat-x-automation",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [
        {
          "nombre": "Python",
          "bytes": 116849
        },
        {
          "nombre": "Jinja",
          "bytes": 219
        }
      ],
      "temas": [
        "automation",
        "oauth1",
        "python",
        "testing",
        "transactional",
        "twitter-api"
      ],
      "licencia": null,
      "ramaPredeterminada": "main",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2026-08-16T02:05:49.000Z",
      "actualizadoEn": "2026-08-20T22:24:05.000Z",
      "publicadoEn": "2026-08-16T02:06:37.000Z",
      "extractoReadme": "Colmat X Automation\n\nProyecto en Python para preparar, aprobar, programar y publicar contenido de la escuela de\npensamiento Colmat en X. Está pensado para una sola cuenta institucional y usa únicamente\nla API oficial.\n\nEl proyecto nace en modo seguro: el contenido de ejemplo entra como borrador, las URL están\nbloqueadas y una ejecución normal solo simula. Para publicar de verdad deben coincidir tres\ncondiciones: el snapshot fue aprobado por CLI, COLMATLIVEENABLED=true y el operador usa\n--live.\nAlcance de esta primera versión\nPublicaciones originales de texto, programadas en YAML.\nPlantillas Jinja reutilizables y vista previa del texto final.\nAprobación humana auditada y ligada al hash exacto del texto y la hora revisados.\nEstimación conservadora de longitud ponderada y controles preventivos de URL, cashtags y\nduplicados exactos.\nCola SQLite con auditoría, límite diario y protección…"
    },
    {
      "slug": "CRUD",
      "nombre": "CRUD",
      "descripcion": "CRUD exercise in PHP: create, read, update and delete against a database.",
      "url": "https://github.com/SirHegel/CRUD",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [
        {
          "nombre": "PHP",
          "bytes": 6266
        },
        {
          "nombre": "CSS",
          "bytes": 3367
        }
      ],
      "temas": [
        "crud",
        "mysql",
        "php"
      ],
      "licencia": null,
      "ramaPredeterminada": "main",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2025-10-20T23:21:42.000Z",
      "actualizadoEn": "2026-08-20T22:24:06.000Z",
      "publicadoEn": "2026-08-20T07:32:58.000Z",
      "extractoReadme": "CRUD — hotel reservations\n\nA minimal create-read-update-delete application in plain PHP against MySQL. No\nframework, no ORM: the point of the exercise is to see the four operations and\nthe SQL underneath them without anything in the way.\nFiles\n\n· File · Role ·\n\n· db.php · Connection. Everything else includes it. ·\n· index.php · List of reservations. ·\n· create.php · Insert form and handler. ·\n· read.php · Single-record view. ·\n· delete.php · Removal. ·\n· styles.css · Layout. ·\nRunning it\n\nAny PHP environment with MySQL works — XAMPP, MAMP, or php -S alongside a\nlocal MySQL server.\nCreate a database named hotelreservas.\nPoint db.php at it. The file ships with localhost / root / empty\npassword, which are the defaults a fresh XAMPP install gives you. Change\nthem before this runs anywhere but your own machine — an empty root\npassword is fine on localhost and nowhere else.\nServe the directory…"
    },
    {
      "slug": "designter-financial-bot",
      "nombre": "designter-financial-bot",
      "descripcion": "Asistente inteligente de Telegram para la gestión financiera automatizada de Designter, integrado con Google Sheets API.",
      "url": "https://github.com/SirHegel/designter-financial-bot",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [
        {
          "nombre": "Python",
          "bytes": 4154
        }
      ],
      "temas": [
        "automation",
        "finance",
        "google-sheets",
        "python",
        "telegram-bot"
      ],
      "licencia": {
        "spdx": "MIT",
        "nombre": "MIT License"
      },
      "ramaPredeterminada": "main",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2026-03-25T08:58:50.000Z",
      "actualizadoEn": "2026-08-20T22:24:07.000Z",
      "publicadoEn": "2026-03-25T09:09:41.000Z",
      "extractoReadme": "🚀 Designter Financial Bot (Python + Google Sheets API)\n\nEste proyecto es un asistente inteligente de Telegram diseñado para automatizar la gestión financiera de mi agencia, Designter. Permite separar ingresos personales de empresariales mediante procesamiento de lenguaje natural.\n📊 ¿Qué resuelve este Bot?\nComo estudiante de Economía y Desarrollador, identifiqué la necesidad de tener un control de caja inmediato sin depender de hojas de cálculo manuales.\nCategorización Inteligente: Identifica montos y etiquetas (Jhon vs Designter) usando RegEx.\nAlertas de Salud Financiera: Notificaciones automáticas cuando los gastos alcanzan el 30%, 50%, 80% o 100% de los ingresos.\nIntegridad de Datos: Conexión directa con Google Sheets API para almacenamiento en la nube.\nGestión Mensual: Creación dinámica de pestañas por mes (ej. 03-2026).\n🛠️ Tecnologías\nLenguaje: Python 3.x\nAPIs: Telegram Bot API,…"
    },
    {
      "slug": "MULTIPLICADORA",
      "nombre": "MULTIPLICADORA",
      "descripcion": "Multiplication table generator in HTML, CSS, JavaScript and PHP.",
      "url": "https://github.com/SirHegel/MULTIPLICADORA",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [
        {
          "nombre": "CSS",
          "bytes": 2414
        },
        {
          "nombre": "PHP",
          "bytes": 2083
        },
        {
          "nombre": "HTML",
          "bytes": 1346
        },
        {
          "nombre": "JavaScript",
          "bytes": 839
        }
      ],
      "temas": [
        "css",
        "html",
        "javascript",
        "php"
      ],
      "licencia": null,
      "ramaPredeterminada": "main",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2025-10-18T07:48:00.000Z",
      "actualizadoEn": "2026-08-20T22:24:08.000Z",
      "publicadoEn": "2026-08-20T07:33:01.000Z",
      "extractoReadme": "Multiplication tables\n\nGenerates a multiplication table for a chosen number. Built twice on purpose:\nonce in the browser with JavaScript, once on the server with PHP, so the two\napproaches sit side by side.\nFiles\n\n· File · Role ·\n\n· index.html · Entry form. ·\n· script.js · Client-side generation, no round trip. ·\n· tablas.php · Server-side generation, renders the table in the response. ·\n· styles.css · Layout, responsive down to phone widths. ·\nRunning it\n\nThe JavaScript version needs nothing — open index.html. The PHP version needs\na server:\n\nWhy both\n\nThe two files produce the same table by different routes. The JavaScript one\nnever contacts the server, so it is instant but the logic is visible to anyone\nwho opens the console. The PHP one costs a request but the computation stays on\nthe server. Neither is better in the abstract; the exercise is seeing where the\nwork happens."
    },
    {
      "slug": "nacar-piscinas-juan",
      "nombre": "nacar-piscinas-juan",
      "descripcion": "Sitio NÁCAR para sistemas minerales de piscinas, con CMS y primer arranque seguro",
      "url": "https://github.com/SirHegel/nacar-piscinas-juan",
      "homepage": "https://nacar-piscinas-juan.vercel.app/",
      "lenguajes": [
        {
          "nombre": "TypeScript",
          "bytes": 132637
        },
        {
          "nombre": "CSS",
          "bytes": 82188
        },
        {
          "nombre": "JavaScript",
          "bytes": 5865
        }
      ],
      "temas": [],
      "licencia": null,
      "ramaPredeterminada": "main",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2026-08-22T17:38:15.000Z",
      "actualizadoEn": "2026-08-22T21:44:48.000Z",
      "publicadoEn": "2026-08-22T21:44:23.000Z",
      "extractoReadme": "NÁCAR — Sistemas minerales por Juan\n\nLanding premium para presentar y vender proyectos de tratamiento mineral con magnesio para piscinas. Incluye sitio público, formulario de diagnóstico, CMS privado y bandeja de prospectos.\nPrimer arranque seguro\n\nEl repositorio se entrega sin usuario, contraseña, hash, secreto de sesión, token de almacenamiento ni datos de prospectos. Tampoco existe una cuenta predeterminada.\n\nnpm run setup solicita en una terminal privada el usuario y una contraseña de al menos 14 caracteres elegidos por el nuevo propietario. La contraseña no se escribe en ningún archivo: se guarda solamente un hash scrypt con sal aleatoria. El comando también genera un secreto de sesión y deja .env.local con permisos 600.\n\nDespués hay que configurar un almacenamiento privado de Vercel Blob y agregar su token como BLOBREADWRITETOKEN en .env.local. Se puede vincular un proyecto propio…"
    },
    {
      "slug": "orquesta-ia",
      "nombre": "orquesta-ia",
      "descripcion": "Local multi-account AI orchestrator: task routing, quota accounting per window, limit detection and cross-auditing between models.",
      "url": "https://github.com/SirHegel/orquesta-ia",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [
        {
          "nombre": "Python",
          "bytes": 352997
        },
        {
          "nombre": "HTML",
          "bytes": 33403
        },
        {
          "nombre": "Shell",
          "bytes": 15979
        }
      ],
      "temas": [
        "ai-orchestration",
        "cli",
        "llm",
        "multi-agent",
        "python",
        "quota-management",
        "self-hosted"
      ],
      "licencia": {
        "spdx": "MIT",
        "nombre": "MIT License"
      },
      "ramaPredeterminada": "main",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2026-08-18T08:58:32.000Z",
      "actualizadoEn": "2026-08-20T22:24:09.000Z",
      "publicadoEn": "2026-08-20T06:36:43.000Z",
      "extractoReadme": "Orquesta IA\n\nOrquestador local de varias cuentas de IA (Claude, GPT/Codex, Antigravity y MiniMax) desde una\nsola terminal o un panel web. Primero filtra por capacidad del motor, luego usa la\nmáxima potencia configurada y reparte entre cuentas equivalentes según su cupo y uso.\nTambién lleva la contabilidad de tokens y permite auditorías cruzadas.\nQué hace\nMulti-cuenta real. Cada cuenta vive en su propio directorio aislado\n(CLAUDECONFIGDIR, CODEXHOME), así que varias cuentas del mismo proveedor\nconviven sin pisarse.\nCapacidades antes que puntajes. Claude y Codex compiten en las tareas de texto;\nAntigravity/Nano Banana queda reservado para imagen. Los pesos de especialidad\nsolo ayudan a repartir un proyecto y nunca convierten un motor visual en chat.\nPotencia parametrizada. power define la potencia efectiva por perfil o tarea.\nA igual potencia, decide el rendimiento medido, la cuota…"
    },
    {
      "slug": "Practice_Python",
      "nombre": "Practice_Python",
      "descripcion": "In this repository I will be uploading my python internship and I will focus on data analysis.",
      "url": "https://github.com/SirHegel/Practice_Python",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [],
      "temas": [
        "data-analysis",
        "learning",
        "python"
      ],
      "licencia": null,
      "ramaPredeterminada": "main",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2025-05-28T08:36:53.000Z",
      "actualizadoEn": "2026-08-20T22:24:10.000Z",
      "publicadoEn": "2025-05-28T08:36:53.000Z",
      "extractoReadme": ""
    },
    {
      "slug": "proyecto",
      "nombre": "proyecto",
      "descripcion": "proyecto talento tech",
      "url": "https://github.com/SirHegel/proyecto",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [
        {
          "nombre": "CSS",
          "bytes": 46940
        },
        {
          "nombre": "HTML",
          "bytes": 34752
        },
        {
          "nombre": "JavaScript",
          "bytes": 9439
        }
      ],
      "temas": [
        "css",
        "html",
        "web"
      ],
      "licencia": {
        "spdx": "MIT",
        "nombre": "MIT License"
      },
      "ramaPredeterminada": "main",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2025-10-15T01:48:53.000Z",
      "actualizadoEn": "2026-08-20T22:24:11.000Z",
      "publicadoEn": "2026-08-18T08:16:46.000Z",
      "extractoReadme": ""
    },
    {
      "slug": "prueba-api-tareas",
      "nombre": "prueba-api-tareas",
      "descripcion": "Task REST API in FastAPI with a written contract, 27 tests and verified curl examples.",
      "url": "https://github.com/SirHegel/prueba-api-tareas",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [
        {
          "nombre": "Python",
          "bytes": 16401
        }
      ],
      "temas": [
        "fastapi",
        "pytest",
        "python",
        "rest-api"
      ],
      "licencia": null,
      "ramaPredeterminada": "main",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2026-08-18T19:05:42.000Z",
      "actualizadoEn": "2026-08-20T22:24:11.000Z",
      "publicadoEn": "2026-08-18T19:06:11.000Z",
      "extractoReadme": "API Tareas\n\nAPI REST ligera para gestionar tareas (to-do), construida con FastAPI y SQLite. Permite crear, listar, filtrar, completar y borrar tareas a través de endpoints JSON.\n\nRequisitos\nPython 3.11 o superior\npip (incluido con Python)\n\nInstalación\n\nArrancar el servidor\n\nCualquiera de las dos formas es válida:\n\nEl servidor escucha en\n\n📖 Documentación interactiva (Swagger UI):\n\nEndpoints\n\n· Método · Ruta · Descripción · Código de respuesta ·\n\n· POST · /tareas · Crear una tarea · 201 Created ·\n· GET · /tareas · Listar todas las tareas · 200 OK ·\n· GET · /tareas?completada=true · Filtrar por estado de completitud · 200 OK ·\n· PATCH · /tareas/{id}/completar · Marcar una tarea como completada · 200 OK ·\n· DELETE · /tareas/{id} · Borrar una tarea · 204 No Content ·\n· GET · /salud · Sonda de vida del servicio · 200 OK ·\nLas respuestas de error 404 devuelven {\"detalle\": \"Tarea no…"
    },
    {
      "slug": "prueba-bot-clima",
      "nombre": "prueba-bot-clima",
      "descripcion": "Telegram weather bot. Credentials read from environment variables only, never committed.",
      "url": "https://github.com/SirHegel/prueba-bot-clima",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [
        {
          "nombre": "Python",
          "bytes": 6020
        }
      ],
      "temas": [
        "api",
        "python",
        "telegram-bot",
        "weather"
      ],
      "licencia": null,
      "ramaPredeterminada": "main",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2026-08-18T19:05:42.000Z",
      "actualizadoEn": "2026-08-20T22:24:12.000Z",
      "publicadoEn": "2026-08-18T19:06:04.000Z",
      "extractoReadme": "Bot Clima Telegram\n\nBot de Telegram escrito en Python que consulta el clima actual de una ciudad mediante la API de OpenWeatherMap. Puedes enviar el nombre de una ciudad como texto o utilizar el comando /clima.\nRequisitos\nPython 3.10 o superior.\nUna cuenta de Telegram.\nUna cuenta de OpenWeatherMap.\nCredenciales\nToken de Telegram con BotFather\nAbre Telegram y busca el bot oficial @BotFather.\nInicia la conversación y envía /newbot.\nIndica el nombre visible y un nombre de usuario para el bot. El nombre de usuario debe terminar en bot.\nCopia el token que entrega BotFather y úsalo como valor de TELEGRAMBOTTOKEN.\n\nNo publiques el token ni lo incluyas en el control de versiones. Si se filtra, utiliza /revoke en BotFather para reemplazarlo.\nAPI key de OpenWeatherMap\nCrea una cuenta en OpenWeatherMap.\nAbre la sección My API keys de tu perfil.\nGenera una API key o copia la clave predeterminada.…"
    },
    {
      "slug": "prueba-notas-cli",
      "nombre": "prueba-notas-cli",
      "descripcion": "Note-taking command line tool in Python, with tests.",
      "url": "https://github.com/SirHegel/prueba-notas-cli",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [
        {
          "nombre": "Python",
          "bytes": 12032
        }
      ],
      "temas": [
        "cli",
        "notes",
        "pytest",
        "python"
      ],
      "licencia": null,
      "ramaPredeterminada": "main",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2026-08-18T19:05:37.000Z",
      "actualizadoEn": "2026-08-20T22:24:13.000Z",
      "publicadoEn": "2026-08-18T19:05:58.000Z",
      "extractoReadme": "notas-cli\n\nnotas-cli es una herramienta de línea de comandos escrita en Python para guardar, listar, buscar y borrar notas rápidas. Las notas se conservan localmente en un archivo JSON, incluyen un identificador incremental, etiquetas opcionales y la fecha de creación en UTC.\nInstalación\nPython 3.9 o posterior.\n\nNo hay dependencias externas para usar la herramienta. Descarga o copia esta\ncarpeta, entra en ella y comprueba la instalación con:\n\npytest solo es necesario para ejecutar los tests; se puede instalar con\npython3 -m pip install pytest.\nArchivo de datos\n\nPor defecto, las notas se guardan en:\n\nEl directorio y el archivo se crean automáticamente al guardar la primera nota. La ubicación se puede cambiar con la opción global --archivo, que debe escribirse antes del comando:\n\nTambién se puede definir la variable de entorno NOTASCLIFILE:\n\nSi se usan ambos mecanismos, --archivo tiene…"
    },
    {
      "slug": "prueba-web-saldantia",
      "nombre": "prueba-web-saldantia",
      "descripcion": "Static site for Saldantia, audited for accessibility, colour contrast and responsive layout.",
      "url": "https://github.com/SirHegel/prueba-web-saldantia",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [
        {
          "nombre": "CSS",
          "bytes": 63360
        },
        {
          "nombre": "HTML",
          "bytes": 26602
        },
        {
          "nombre": "JavaScript",
          "bytes": 21848
        }
      ],
      "temas": [
        "accessibility",
        "css",
        "html",
        "responsive-design"
      ],
      "licencia": null,
      "ramaPredeterminada": "main",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2026-08-18T19:05:42.000Z",
      "actualizadoEn": "2026-08-20T22:24:14.000Z",
      "publicadoEn": "2026-08-20T07:33:03.000Z",
      "extractoReadme": "Saldantia — site\n\nStatic marketing site. No framework, no build step, no dependencies: HTML, four\nstylesheets and one script.\nStructure\n\n· Path · Role ·\n\n· index.html · The whole page. ·\n· css/base.css · Design tokens, reset, utilities. ·\n· css/hero.css · Opening section. ·\n· css/servicios.css · Services grid. ·\n· css/secciones.css · Remaining blocks. ·\n· js/scroll.js · Reveal-on-scroll and navigation state. ·\nRunning it\n\nOpen index.html, or serve the directory:\n\nQuality audit\n\nAUDITORIACALIDAD.md records a full pass over the\nsite: every class in the markup accounted for, render verified at 1024, 768 and\n480 px with no horizontal overflow, all seven form controls given a valid\nlabel[for], decorative SVGs hidden from the accessibility tree, and normal\ntext held at 4.5:1 contrast or better against every surface it sits on.\n\nTwo colour changes came out of it: --text-faint was lightened,…"
    },
    {
      "slug": "sincategorematico-bot",
      "nombre": "sincategorematico-bot",
      "descripcion": "Bot local seguro y de bajo consumo para automatización de contenido por Telegram",
      "url": "https://github.com/SirHegel/sincategorematico-bot",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [
        {
          "nombre": "Python",
          "bytes": 360860
        },
        {
          "nombre": "JavaScript",
          "bytes": 9102
        },
        {
          "nombre": "CSS",
          "bytes": 8212
        },
        {
          "nombre": "Shell",
          "bytes": 6856
        },
        {
          "nombre": "HTML",
          "bytes": 4547
        }
      ],
      "temas": [
        "dashboard",
        "python",
        "security",
        "self-hosted",
        "telegram-bot",
        "tkinter"
      ],
      "licencia": null,
      "ramaPredeterminada": "main",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2026-08-18T08:20:32.000Z",
      "actualizadoEn": "2026-08-20T22:24:15.000Z",
      "publicadoEn": "2026-08-20T07:55:44.000Z",
      "extractoReadme": "Sincategoremático Bot\n\nBot local para descubrir noticias, redactar borradores con una CLI de IA,\naprobarlos por Telegram y publicarlos en LinkedIn con límites y horarios. Incluye\nun motor editorial independiente, un panel web ligado a 127.0.0.1 y una\naplicación de escritorio. El estado y todas las credenciales viven fuera del\nrepositorio.\nPrincipios de seguridad\nUna instalación nueva queda pausada y en simulación. No publica en\nLinkedIn hasta que el propietario vincule una cuenta y active expresamente el\nmodo real.\nAntes de enviar, el motor reserva el borrador en la base de datos. Si la\nrespuesta de LinkedIn se pierde o el proceso se interrumpe, queda como\nuncertain y no se reintenta automáticamente: esto evita publicaciones\nduplicadas.\nTelegram acepta comandos de un único propietario vinculado mediante un código\nlocal temporal.\nLa redacción recibe un entorno mínimo; no hereda los tokens…"
    },
    {
      "slug": "SirHegel",
      "nombre": "SirHegel",
      "descripcion": "Economista, analista de datos y filósofo. Teoría heterodoxa, sistemas de IA y la pregunta de cómo un sistema llega a producirse a sí mismo.",
      "url": "https://github.com/SirHegel/SirHegel",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [
        {
          "nombre": "Shell",
          "bytes": 6323
        }
      ],
      "temas": [
        "design-system",
        "profile",
        "svg-animation"
      ],
      "licencia": null,
      "ramaPredeterminada": "main",
      "estrellas": 1,
      "forks": 0,
      "creadoEn": "2026-08-20T04:38:32.000Z",
      "actualizadoEn": "2026-08-20T23:19:41.000Z",
      "publicadoEn": "2026-08-20T23:18:47.000Z",
      "extractoReadme": "Jhon Steven Alvarez Ruiz\n\nEconomist and data analyst · Neiva, Huila, Colombia\n\njhonstevenalvarezruiz.vercel.app\n · \nLinkedIn\n · \nhumanizar.tech\n · \nLive demo\n · \nType system\n\nEconomist and data analyst. Together with Steven Vallejo Ortiz\nI build the system that turns scattered AI agents into a company that actually operates.\n\nI work with three materials that academic convention keeps apart for no good reason:\nthe critique of political economy, the architecture of multi-agent systems, and the\nlogic that lets you say when a set of parts constitutes a whole and when it remains a\nheap. These are not three fields. They are one problem approached with three\ninstruments.\n\nCAUCE V3\n\nhumanizar.tech — development companies, built from agents\n\nAn agent is not a company. The claim is neither rhetorical nor quantitative: it is\ncategorial. Adding agents no more produces a company than adding coins…"
    },
    {
      "slug": "sitio",
      "nombre": "sitio",
      "descripcion": "Sitio canónico de Jhon Steven Alvarez Ruiz — economista y analista de datos. Estático, generado, sin dependencias.",
      "url": "https://github.com/SirHegel/sitio",
      "homepage": "https://jhonstevenalvarezruiz.vercel.app/",
      "lenguajes": [
        {
          "nombre": "JavaScript",
          "bytes": 245202
        },
        {
          "nombre": "CSS",
          "bytes": 42239
        },
        {
          "nombre": "Python",
          "bytes": 9549
        },
        {
          "nombre": "Shell",
          "bytes": 1436
        }
      ],
      "temas": [],
      "licencia": null,
      "ramaPredeterminada": "master",
      "estrellas": 0,
      "forks": 0,
      "creadoEn": "2026-08-20T23:00:55.000Z",
      "actualizadoEn": "2026-08-23T19:38:03.000Z",
      "publicadoEn": "2026-08-23T19:40:01.000Z",
      "extractoReadme": "Sitio de Jhon Steven Alvarez Ruiz\n\nSitio personal, blog y portafolio de Jhon Steven Alvarez Ruiz — economista,\nanalista de datos y desarrollador en Neiva, Colombia. El HTML público se genera\nsin dependencias; las funciones privadas de Vercel permiten publicar escritos y\nconsultar una auditoría anónima desde /admin/.\n\nArquitectura\n\n· Pieza · Responsabilidad ·\n\n· datos.js · Perfil, experiencia y proyectos seleccionados. ·\n· datos-github.js · Snapshot seguro de todos los repositorios públicos propios. ·\n· datos-actividad.js · Totales anónimos de tokens, llamadas, tareas y proveedores. ·\n· escritos/.md · Fuente editorial del blog. ·\n· plantilla.js · Cabecera, navegación, SEO y JSON-LD comunes. ·\n· construir.js · Blog, proyectos, actividad, feed, sitemap y HTML estático. ·\n· api/ y lib/ · Autenticación, CMS y auditoría en funciones de Vercel. ·\n· activos/animacion.js · Movimiento, audio…"
    }
  ]
};

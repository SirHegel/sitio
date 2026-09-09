import { REPOSITORIOS_GITHUB } from './datos.js';
import { esc } from './plantilla.js';

// Lectura editorial del código y la documentación públicos, 8 de septiembre de 2026.
// Las revisiones se fijan aquí: sincronizar GitHub no cambia la evidencia ya leída.
// Los ejemplos son ilustrativos; las métricas continúan en el inventario medido.
export const EXPLICACIONES_PROYECTOS = Object.freeze({
  'polidinamica-inteligencia-leads': {
    resumen: 'Diseño en desarrollo de un asistente para ordenar oportunidades comerciales y explicar cuáles conviene revisar primero.',
    proposito: 'Ayudar a quien vende a conservar el contexto de cada contacto y decidir el siguiente paso. Un lead es una oportunidad comercial: interesa conocer su necesidad y la evidencia que justifica atenderla.',
    ejemplo: ['Una empresa ficticia solicita una cotización y comunica su necesidad.', 'El diseño propone una ficha con señales de interés, prioridad explicada y siguiente acción para revisión humana.'],
    flujo: [['Capturar', 'Reunir la solicitud y su procedencia en una ficha.'], ['Cualificar', 'Aplicar criterios comerciales explícitos a las señales disponibles.'], ['Revisar', 'Presentar el orden sugerido y sus motivos a la persona responsable.']],
    decisiones: [['Base propia', 'Conservar el historial evita depender de conversaciones dispersas. El motor de base de datos todavía no está identificado públicamente.'], ['Automatización e IA', 'Son parte del diseño declarado; faltan código público y evaluación para precisar qué tareas ejecuta cada componente.']],
    alcance: 'Definí el propósito comercial y un diseño de captura, cualificación y seguimiento. La ficha describe trabajo en desarrollo con código y datos privados; el alcance implementado no tiene comprobación pública.',
    validacion: 'La evidencia disponible es esta descripción del diseño. Falta una demostración anonimizada que siga una solicitud completa y permita revisar sus resultados.',
    limites: 'Pendientes: contrato de datos, reglas ejecutables y evaluación de prioridades frente a decisiones humanas. No se publican conversiones, ahorro de tiempo ni resultados comerciales sin medición.',
    revision: null, fuentes: [], privado: true,
  },
  'orquesta-ia': {
    lenguajes: ['Python', 'JSONL', 'Shell'],
    resumen: 'Coordinador local de cuentas de IA que elige un motor compatible, registra su consumo y conserva el contexto cuando una ejecución falla.',
    proposito: 'Permitir que un desarrollador encargue una tarea a varias herramientas de IA sin administrar manualmente cada cuenta y cada cambio de sesión.',
    ejemplo: ['Un encargo de revisión de código y varias cuentas configuradas localmente.', 'Una ejecución asignada a una cuenta compatible, un registro de consumo y, si falla, un traspaso con el estado del trabajo.'],
    flujo: [['Elegir', 'Filtrar motores por capacidad y ordenar cuentas según potencia configurada, cuota y uso.'], ['Ejecutar', 'Aislar la configuración de cada cuenta y coordinar las escrituras mediante un bloqueo del repositorio.'], ['Comprobar', 'Ejecutar comandos de verificación permitidos y conservar contexto para continuar o reparar.']],
    decisiones: [['Python y procesos locales', 'Integran las herramientas de terminal y permiten controlar su entorno, salida y cierre.'], ['Archivos de estado y JSONL', 'El registro de uso se añade a un ledger consultable. El código publicado usa este registro; una base SQLite no es requisito acreditado de esta revisión.']],
    alcance: 'El trabajo publicado reúne selección de cuentas, adaptadores de ejecución, contabilidad, interfaz local y comprobación de cambios. El código y las regresiones permiten revisar esas piezas por separado.',
    validacion: 'Las pruebas del repositorio ejercitan cuotas, bloqueos, rutas, procesos y publicación. Su presencia documenta casos comprobables; esta ficha no vuelve a ejecutar proveedores ni acredita un ahorro frente a trabajar manualmente.',
    limites: 'La continuidad depende de la configuración y de los servicios externos. La potencia es un parámetro del sistema; su valor no demuestra por sí mismo la calidad de una respuesta.',
    revision: 'be4d50a0316ba6b74a0bcb0b4ceb037742af1ee6', fuentes: [['README.md', 'Funcionamiento y configuración'], ['orqlib.py', 'Selección y contabilidad'], ['orqrun.py', 'Ejecución y continuidad'], ['tests/test_routing_limits_regressions.py', 'Regresiones de cuotas']],
  },
  'automatizacion-evidencias-adso': {
    resumen: 'Herramientas para regenerar entregables de formación en software, relacionarlos con su rúbrica y revisar archivos antes de publicarlos.',
    proposito: 'Hacer que una entrega académica se pueda reconstruir a partir de sus fuentes. La carpeta conserva el enunciado, la solución y el producto que se entrega.',
    ejemplo: ['Un taller sobre algoritmos, su rúbrica y los archivos fuente de la solución.', 'Una entrega regenerada, un informe que explica la resolución y comprobaciones de integridad y privacidad.'],
    flujo: [['Organizar', 'Separar enunciado, fuentes y entregas en carpetas con una estructura común.'], ['Generar', 'Ejecutar los programas de cada evidencia para producir sus documentos o paquetes.'], ['Auditar', 'Comprobar los productos y detener la validación si aparecen datos personales no autorizados.']],
    decisiones: [['Python', 'Automatiza la generación y la inspección de documentos; cada taller conserva las dependencias que necesita.'], ['Git y GitHub Actions', 'Vinculan fuentes y entregas a una revisión y ejecutan comprobaciones en CI, el servicio que revisa cambios automáticamente.']],
    alcance: 'El repositorio publica fuentes de talleres, generadores, entregables saneados y un resolutor común. Los informes explican la correspondencia con cada instrumento de evaluación.',
    validacion: 'La carpeta automatizacion y el workflow permiten examinar cómo se regeneran y revisan archivos. Una comprobación automática no sustituye la evaluación del docente ni la grabación personal exigida por una rúbrica.',
    limites: 'Los talleres tienen estados diferentes. Permanecen actividades personales pendientes; los documentos identificados se conservan fuera del material público.',
    revision: '752983b5727efdb545cb0dc2c753db2172d63bfd', fuentes: [['README.md', 'Estructura y estado de las evidencias'], ['automatizacion', 'Resolutor y validación', 'tree'], ['talleres', 'Fuentes e informes por taller', 'tree']],
  },
  'colmat-x-automation': {
    resumen: 'Sistema editorial para preparar publicaciones de Colmat, revisar el contenido exacto y enviarlo mediante la API oficial de X.',
    proposito: 'Separar la redacción de una publicación de la decisión de publicarla. La cola conserva quién revisó el contenido y qué versión se autorizó.',
    ejemplo: ['Un borrador institucional, una fecha y una revisión humana en el modo human_review.', 'Un contenido aprobado asociado a su huella, listo para una ejecución autorizada; modificarlo obliga a revisar la nueva versión.'],
    flujo: [['Preparar', 'Generar o cargar borradores y aplicar las reglas editoriales.'], ['Autorizar', 'Comprobar roles y vincular la decisión al contenido y horario revisados.'], ['Publicar', 'Reservar la operación, llamar a la API y registrar el resultado o su incertidumbre.']],
    decisiones: [['Python, FastAPI y Jinja', 'Separan la lógica editorial, el panel y las plantillas de contenido.'], ['SQLite o PostgreSQL', 'Persisten cola, agenda y decisiones; SQLAlchemy permite trabajar con el almacenamiento correspondiente al despliegue.'], ['Huella del contenido', 'Una huella identifica la versión aprobada y permite detectar cambios posteriores.']],
    alcance: 'El trabajo publicado integra roles, cola, revisión por Telegram, generación asistida y trabajadores de publicación. El modo directo documentado utiliza identidades de servicio y activaciones explícitas; no debe confundirse con la revisión humana.',
    validacion: 'Hay pruebas de roles, cambios de contenido, almacenamiento y trabajadores. El modo de simulación permite revisar el recorrido sin enviar una publicación real.',
    limites: 'El funcionamiento real depende de permisos y disponibilidad de las API. Los resultados ambiguos requieren conciliación; una llamada sin respuesta no demuestra que la publicación haya fallado.',
    revision: 'a8acd3834889a6210e6f7f68bdddf0282db3a1d4', fuentes: [['README.md', 'Modos de operación y alcance'], ['src/colmat_x/domain.py', 'Estados y reglas del dominio'], ['src/colmat_x/publication_worker.py', 'Trabajador de publicación'], ['tests/test_publication_worker.py', 'Pruebas de publicación']],
  },
  'sincategorematico-bot': {
    resumen: 'Asistente editorial local que prepara noticias, solicita aprobación por Telegram y gestiona su publicación en LinkedIn.',
    proposito: 'Convertir una noticia candidata en un borrador revisable y conservar el control humano sobre lo que sale con el nombre de una persona.',
    ejemplo: ['Una noticia descubierta por el motor editorial y un borrador preparado por la herramienta de IA.', 'Una solicitud de revisión en Telegram; una aprobación y una configuración de publicación válidas permiten continuar hacia LinkedIn.'],
    flujo: [['Redactar', 'Descubrir material y ejecutar el redactor con un entorno que excluye los secretos del bot.'], ['Decidir', 'Presentar el borrador al propietario vinculado y registrar su decisión.'], ['Enviar', 'Reservar el borrador antes de la llamada y dejarlo pendiente de conciliación si el resultado es incierto.']],
    decisiones: [['Python y SQLite', 'Mantienen el motor y un historial local de borradores, decisiones y estados.'], ['systemd', 'Ejecuta servicios separados con límites de recursos y permisos de escritura definidos.'], ['Panel local', 'La interfaz web se limita a la dirección local; Tkinter ofrece otra entrada al mismo sistema.']],
    alcance: 'El repositorio contiene motor editorial, integración con Telegram y LinkedIn, almacenamiento y paneles. Las pruebas permiten inspeccionar la reserva previa y el tratamiento de envíos inciertos.',
    validacion: 'La instalación empieza pausada y en simulación. Las regresiones de publicación comprueban estados que necesitan revisión antes de repetir un envío.',
    limites: 'Se necesita Linux con systemd y cuentas configuradas para las integraciones. El redactor puede equivocarse en el contenido; la aprobación sigue siendo una decisión editorial.',
    revision: 'a2f2d884a03b77660efba53696f4361031e0a235', fuentes: [['README.md', 'Recorrido y requisitos'], ['src/sincategorematico_bot/engine.py', 'Motor editorial'], ['src/sincategorematico_bot/storage.py', 'Persistencia'], ['tests/test_publish_safety.py', 'Regresiones del envío']],
  },
  'bloquitos': {
    resumen: 'Juego de bloques con teclado y controles táctiles, progreso local y una versión web que puede funcionar sin conexión.',
    proposito: 'Ofrecer una partida inmediata y conservar récords en el dispositivo. El mismo núcleo del juego sirve a la página web y al empaquetado de escritorio.',
    ejemplo: ['Una pieza activa y una pulsación para moverla o girarla.', 'El motor acepta el movimiento si cabe, actualiza el tablero y elimina las filas completas al fijar la pieza.'],
    flujo: [['Recibir', 'Traducir teclado o gestos a acciones de juego.'], ['Simular', 'Resolver colisiones, caída, filas y puntuación en módulos separados del dibujo.'], ['Mostrar y guardar', 'Dibujar el tablero en canvas y conservar el progreso en el almacenamiento local.']],
    decisiones: [['JavaScript y canvas', 'Mantienen el núcleo web sin dependencias de ejecución y separan las reglas del dibujo.'], ['Service worker', 'Guarda los recursos necesarios para el uso sin conexión después de su instalación en un origen compatible.'], ['Electron opcional', 'Empaqueta el juego para escritorio; sus dependencias pertenecen a esa distribución.']],
    alcance: 'El trabajo publicado incluye reglas de piezas y tablero, controles, dibujo, audio, persistencia y empaquetado. El código de las reglas puede revisarse sin abrir una ventana de juego.',
    validacion: 'Las pruebas del motor y la base local cubren comportamientos del juego y de sus datos. Las verificaciones de despliegue revisan el paquete distribuido.',
    limites: 'El progreso depende del almacenamiento del navegador y puede perderse al borrarlo; hay exportación e importación. Los instaladores y el juego web tienen requisitos de distribución diferentes.',
    revision: '8484638e98d3587f2ab1f4d37167863a98841f42', fuentes: [['README.md', 'Uso y estructura'], ['js/juego.js', 'Reglas de juego'], ['js/tablero.js', 'Tablero y colisiones'], ['pruebas/motor.test.mjs', 'Pruebas del motor']],
  },
  'designter-financial-bot': {
    cifras: 'Registro por reglas de texto · consulta del balance mensual',
    resumen: 'Bot de Telegram que interpreta importes mediante reglas de texto y registra ingresos o gastos en una hoja mensual de Google Sheets.',
    proposito: 'Registrar un movimiento financiero desde una conversación autorizada y consultar después el balance del mes sin transcribirlo a mano en una hoja.',
    ejemplo: ['Mensaje ficticio: «gasto 25000 materiales», enviado por un chat y una persona autorizados.', 'Una fila con fecha, categoría GASTO, texto e importe −25000 en la pestaña mensual. El ejemplo describe la regla; no es una transacción real.'],
    flujo: [['Autorizar', 'Comprobar conjuntamente los identificadores de chat y persona.'], ['Interpretar', 'Extraer el primer grupo numérico y clasificar por palabras como gasto o designter.'], ['Registrar', 'Añadir la fila mediante la API de Sheets y consultar los movimientos del mes.']],
    decisiones: [['Python y pyTelegramBotAPI', 'Conectan los mensajes con funciones de registro y consulta.'], ['gspread y Google Sheets', 'Usan una hoja compartida como almacenamiento que la persona puede inspeccionar.'], ['Reglas explícitas', 'La clasificación publicada utiliza expresiones regulares y palabras; su comportamiento se puede leer directamente en bot.py.']],
    alcance: 'El código publicado conecta autorización, interpretación de mensajes, hojas mensuales y confirmación de borrado. Las pruebas sustituyen Telegram y Sheets por clientes simulados.',
    validacion: 'Las pruebas revisan acceso, escritura como valores RAW, resumen y confirmaciones de borrado. La interpretación del ejemplo se contrastó con process_text; no se enviaron mensajes ni se modificaron hojas.',
    limites: 'El parser toma el primer grupo de dígitos y elimina puntos: mensajes con varios importes o formatos decimales necesitan revisión. Es un registro auxiliar; faltan pruebas de conciliación y una evaluación de errores con mensajes reales anonimizados.',
    revision: 'fd1e29cf1aea4e92e4f13e2b95a01c32d0570d58', fuentes: [['README.md', 'Configuración y alcance'], ['bot.py', 'Interpretación y escritura'], ['settings.py', 'Configuración y acceso'], ['tests/test_bot.py', 'Pruebas con clientes simulados']],
  },
  'betplaycito-nelson': {
    nombre: 'BetPlaycito Nelson — estadísticas locales',
    resumen: 'Aplicación local para registrar observaciones de fútbol, comparar equipos y consultar proporciones con su tamaño de muestra.',
    proposito: 'Organizar los datos que una persona introduce y permitirle saber de qué registros sale cada porcentaje.',
    ejemplo: ['Ejemplo ficticio: diez observaciones, seis con una condición y cuatro sin ella.', 'Una proporción de 6/10 = 60 %, acompañada del tamaño de muestra. Describe ese registro; no estima la probabilidad del próximo partido.'],
    flujo: [['Registrar', 'Introducir cantidades o partidos y guardar movimientos en el historial.'], ['Agregar', 'Sumar observaciones según el contexto y los equipos seleccionados.'], ['Consultar', 'Mostrar gráficos y exportar datos; una corrección añade un movimiento inverso.']],
    decisiones: [['Python y una interfaz web local', 'Separan las operaciones del servidor de la representación en el navegador.'], ['SQLite', 'Guarda cambios y respaldos en el computador; el historial permite seguir las correcciones.']],
    alcance: 'El trabajo publicado reúne servidor local, interfaz de estadísticas, persistencia, exportaciones y scripts de empaquetado. Los documentos describen el modelo de datos y su uso.',
    validacion: 'El repositorio conserva pruebas de seguridad y configuración de compilación. Las proporciones se pueden contrastar con los movimientos exportados y su denominador.',
    limites: 'Los registros son introducidos por el usuario y pueden contener sesgos. No hay validación predictiva documentada: esta herramienta no demuestra una ventaja para apostar.',
    revision: '1fc45c1553a7f462673b7efe62608db89d92e05b', fuentes: [['README.md', 'Uso y significado de las cifras'], ['docs/ARQUITECTURA.md', 'Arquitectura local'], ['docs/MODELO-DE-DATOS.md', 'Modelo de datos'], ['tests/test_security.py', 'Pruebas de seguridad']],
  },
  'calculadora-php': {
    nombre: 'Calculadora PHP',
    resumen: 'Ejercicio de formularios y lógica de servidor: enviar dos números, elegir una operación y recibir una página con el resultado.',
    proposito: 'Aprender el recorrido de una petición web: el navegador recoge datos y PHP calcula la respuesta en el servidor.',
    ejemplo: ['Los valores 12 y 3, con la operación división.', 'Una página HTML con el resultado 4. Con divisor cero, aparece un mensaje explicativo.'],
    flujo: [['Formulario', 'index.html recoge números y operación.'], ['Servidor', 'operaciones.php convierte entradas y selecciona la operación.'], ['Respuesta', 'PHP genera la página del resultado.']],
    decisiones: [['HTML y PHP', 'Permiten observar el envío POST y su respuesta sin un framework intermedio.']],
    alcance: 'El repositorio publica el formulario, el controlador aritmético y un ejemplo separado de suma.',
    validacion: 'Se leyó operaciones.php: comprueba el divisor cero antes de dividir. No hay archivos de prueba automatizada en el inventario.',
    limites: 'floatval transforma entradas no numéricas en cero. Además, la multiplicación conserva el rótulo «Suma» en esta revisión. Falta validar estrictamente las entradas y cubrir operaciones con pruebas.',
    revision: '6eb5e2b13c663056ebf65a304e233d3fae1b93c9', fuentes: [['README.md', 'Objetivo del ejercicio'], ['operaciones.php', 'Cálculo y casos límite'], ['index.html', 'Formulario']],
  },
  'crud': {
    nombre: 'CRUD PHP — registros de trabajadores',
    resumen: 'Ejercicio de altas, consultas, cambios y borrado de registros de trabajadores mediante formularios PHP y MySQL.',
    proposito: 'Practicar las cuatro operaciones básicas sobre datos persistentes. CRUD abrevia crear, leer, actualizar y eliminar.',
    ejemplo: ['Datos ficticios de un trabajador, introducidos en el formulario.', 'Un registro en la tabla trabajadores que se puede consultar, modificar o borrar desde la interfaz.'],
    flujo: [['Recibir', 'El formulario entrega campos al archivo PHP de la operación.'], ['Persistir', 'La conexión compartida permite ejecutar instrucciones SQL sobre trabajadores.'], ['Consultar', 'El listado recupera el estado guardado en MySQL.']],
    decisiones: [['PHP y MySQL', 'Hacen visible la relación entre un formulario y una instrucción SQL, sin una capa ORM.']],
    alcance: 'El código publica conexión, formularios y operaciones sobre trabajadores. Esa tabla determina el alcance de esta explicación, aunque el README mencione reservas hoteleras.',
    validacion: 'Se contrastaron create.php y update.php. El inventario no contiene pruebas automatizadas ni un esquema de base versionado.',
    limites: 'update.php intercala campos de entrada en SQL. Requiere consultas parametrizadas, validación y controles de acceso antes de usar datos reales. Es un ejercicio de aprendizaje.',
    revision: '100912f3ccdd6755d55715cbab875b932f3c5cdb', fuentes: [['create.php', 'Alta real de trabajadores'], ['update.php', 'Actualización y límite detectado'], ['index.php', 'Interfaz y listado']],
  },
  'gh-achievement-audit': {
    nombre: 'Auditoría de logros públicos de GitHub',
    resumen: 'Extensión de terminal que reúne evidencia pública de un perfil GitHub y distingue insignias visibles de recuentos de actividad.',
    proposito: 'Permitir revisar qué muestra GitHub sobre una cuenta y de dónde sale cada dato, evitando inferir insignias a partir de reglas no oficiales.',
    ejemplo: ['El nombre de una cuenta pública de GitHub.', 'Un informe de insignias visibles y actividad pública, con enlaces de evidencia o un error si la auditoría queda incompleta.'],
    flujo: [['Consultar', 'Leer el perfil público y conexiones de la API mediante GitHub CLI.'], ['Contrastar', 'Recorrer todas las páginas y comprobar que el perfil y los detalles coinciden.'], ['Informar', 'Separar señales de actividad e insignias, y validar el contrato del informe.']],
    decisiones: [['Python y GitHub CLI', 'Reutilizan la autenticación de gh y organizan consultas de solo lectura.'], ['JSON Schema', 'Define la forma del informe para que otros programas puedan comprobarla.']],
    alcance: 'El repositorio publica la extensión, su contrato y pruebas de paginación, exclusión de actividad privada y cambios en las respuestas públicas.',
    validacion: 'La suite usa casos de perfiles vacíos, cursores repetidos y discrepancias. El comando debe terminar sin un informe parcial cuando faltan condiciones para completarlo.',
    limites: 'La ausencia de una insignia visible no prueba ausencia de actividad. Un cambio de HTML o API puede exigir actualizar el lector; los totales se refieren al momento de la consulta.',
    revision: '8c9da850a2ffa4c5eb2015039e6f73c57cd2e51c', fuentes: [['README.md', 'Alcance de la auditoría'], ['achievement_audit/cli.py', 'Consultas y comprobaciones'], ['schema/report-v1.schema.json', 'Contrato de salida'], ['tests/test_cli.py', 'Casos de prueba']],
  },
  'gh-before-you-contribute': {
    nombre: 'Before You Contribute — revisión previa de contribuciones',
    resumen: 'Extensión de GitHub CLI y Action que revisa políticas sobre asistencia de IA y señales de que una incidencia ya tiene trabajo en curso.',
    proposito: 'Ayudar a decidir dónde contribuir antes de invertir tiempo en una propuesta que el proyecto no acepta o que otra persona ya está resolviendo.',
    ejemplo: ['Un repositorio y, opcionalmente, el número de una incidencia.', 'Un informe READY, REVIEW o BLOCKED con documentos, fragmentos y señales que justifican el estado.'],
    flujo: [['Leer políticas', 'Consultar documentos del repositorio y de la organización.'], ['Revisar actividad', 'Buscar asignaciones, declaraciones de trabajo y propuestas enlazadas.'], ['Explicar', 'Separar señales decisivas de indicios que necesitan revisión humana.']],
    decisiones: [['Shell, Python y gh', 'Ofrecen un comando de terminal y acceso a información de GitHub sin crear actividad.'], ['Contrato JSON', 'Permite usar el resultado en una Action sin interpretar un bloque de texto libre.']],
    alcance: 'El trabajo publicado reúne lectores de políticas, revisión de incidencias, salida estructurada y una integración con GitHub Actions.',
    validacion: 'El repositorio documenta pruebas y un esquema para informes. Los errores de entrada o API se distinguen de una prohibición hallada en la política.',
    limites: 'El informe conserva enlaces que requieren lectura manual. Una política ausente no equivale a permiso y una coincidencia de búsqueda no demuestra que alguien haya reservado el trabajo.',
    revision: 'ddcd353086904e6a56196c69e0eeca7f2ce5c5bc', fuentes: [['README.md', 'Reglas y señales'], ['gh-before-you-contribute', 'Comando principal'], ['schema/audit-v1.schema.json', 'Contrato del informe'], ['tests', 'Pruebas versionadas', 'tree']],
  },
  'hegelflow': {
    nombre: 'HegelFlow — gestión del trabajo',
    resumen: 'Aplicación de equipos con tareas, tableros Kanban, sprints y permisos, respaldada por PostgreSQL.',
    proposito: 'Hacer visible quién tiene una tarea, en qué estado está y qué trabajo cabe en un periodo. Un sprint agrupa trabajo para un ciclo; el tablero muestra su avance.',
    ejemplo: ['Una tarea con responsable y fecha, movida de pendiente a en curso.', 'El estado queda guardado, el tablero se actualiza y el cambio entra en el historial de actividad.'],
    flujo: [['Interactuar', 'La interfaz muestra tableros, tareas, filtros y reportes.'], ['Autorizar', 'El servidor valida la sesión, el rol y el acceso al tablero.'], ['Guardar', 'Los servicios ejecutan cambios transaccionales en PostgreSQL y la interfaz consulta las novedades.']],
    decisiones: [['Next.js, React y TypeScript', 'Comparten aplicación y servidor, con tipos para describir datos de la interfaz.'], ['PostgreSQL y migraciones SQL', 'Conservan relaciones entre tareas, personas y tableros, y versionan los cambios de estructura.'], ['Zod y sesiones revocables', 'Validan entradas y permiten controlar el acceso desde el servidor.']],
    alcance: 'El repositorio publica autenticación, tableros, backlog, sprints, calendario, reportes y servicios de dominio. El documento de alcance diferencia funciones utilizables de estructuras todavía incompletas.',
    validacion: 'El proyecto declara comprobación de tipos, Vitest, análisis estático y auditorías de secretos. Las capturas documentadas usan datos ficticios de un escenario local.',
    limites: 'La existencia de una tabla no acredita una función terminada: comentarios, adjuntos y automatizaciones tienen partes pendientes. Faltan aquí mediciones de uso concurrente y rendimiento en producción.',
    revision: 'a6585ed16ae67fd4158d08874c2445a5741b0a96', fuentes: [['README.md', 'Funciones y alcance implementado'], ['src', 'Interfaz y servicios', 'tree'], ['db', 'Esquema y migraciones', 'tree'], ['package.json', 'Herramientas de desarrollo y validación']],
  },
  'multiplicadora': {
    nombre: 'Tablas de multiplicar con PHP',
    resumen: 'Ejercicio que valida un número en el formulario y genera su tabla de multiplicar en el servidor.',
    proposito: 'Aprender a combinar una validación de interfaz con un bucle que produce una respuesta HTML.',
    ejemplo: ['El entero positivo 7 enviado desde el formulario.', 'Una tabla con los productos de 7 por los enteros de 1 a 10.'],
    flujo: [['Validar', 'script.js impide envíos vacíos o no positivos en el navegador.'], ['Calcular', 'tablas.php convierte a entero y recorre los multiplicadores.'], ['Presentar', 'El servidor devuelve filas de una tabla HTML.']],
    decisiones: [['JavaScript y PHP', 'JavaScript ayuda a corregir el formulario; PHP vuelve a comprobar el valor y realiza el cálculo.']],
    alcance: 'El código publicado reúne formulario, validación cliente, bucle del servidor y estilos.',
    validacion: 'Se leyeron script.js y tablas.php. El cálculo está en PHP; el script de navegador no genera una segunda tabla, pese a lo que indica el README.',
    limites: 'intval convierte la entrada a entero. Falta definir el tratamiento de decimales y números grandes, y añadir pruebas automatizadas de frontera.',
    revision: 'af2f6fa2595fa1a733df4e0b49dd6ae65f8f16a3', fuentes: [['script.js', 'Validación en el navegador'], ['tablas.php', 'Bucle y respuesta del servidor'], ['index.html', 'Formulario']],
  },
  'nacar-piscinas-juan': {
    nombre: 'NÁCAR — sitio y gestión de solicitudes',
    resumen: 'Sitio de servicios para piscinas con formulario de diagnóstico, editor privado de contenidos y bandeja de solicitudes.',
    proposito: 'Dar a una empresa una presentación pública y un lugar privado donde revisar los contactos que llegan desde ella. CMS significa editor de contenidos del sitio.',
    ejemplo: ['Una solicitud ficticia de diagnóstico enviada desde el formulario.', 'Una referencia de recepción y un registro en la bandeja privada, donde el responsable puede agregar notas y cambiar su estado.'],
    flujo: [['Consultar', 'La página pública presenta contenidos configurados en el editor.'], ['Recibir', 'El servidor valida la solicitud y evita duplicados de un mismo reintento.'], ['Gestionar', 'La sesión del administrador permite revisar solicitudes y publicar cambios de contenido.']],
    decisiones: [['Next.js y TypeScript', 'Reúnen página pública, formularios y panel con contratos de datos compartidos.'], ['Vercel Blob privado', 'Persiste contenidos y solicitudes como JSON fuera del repositorio.'], ['Alta inicial por terminal', 'Crea el acceso de cada instalación sin incluir una cuenta predeterminada en el código.']],
    alcance: 'El repositorio publica sitio, CMS, recepción de solicitudes, configuración inicial y pruebas. Las credenciales y los prospectos quedan fuera del árbol público.',
    validacion: 'Las pruebas y scripts versionados permiten revisar arranque, acceso y recepción. El README distingue almacenamiento de una solicitud de la configuración comercial de WhatsApp y correo.',
    limites: 'Requiere almacenamiento y secretos válidos para habilitar el panel. La limitación local de intentos necesita complemento del proveedor cuando hay varias instancias del servidor.',
    revision: '15975530e44bc1075e6e364ce5d397ea7cf83b8b', fuentes: [['README.md', 'Instalación y flujo de solicitudes'], ['app', 'Rutas públicas y privadas', 'tree'], ['lib', 'Lógica y almacenamiento', 'tree'], ['pruebas', 'Validaciones del proyecto', 'tree']],
  },
  'neiva-abierta': {
    resumen: 'Juego de exploración de una interpretación de Neiva, con ciudad construida a partir de datos abiertos y una alfa nativa en Unreal Engine.',
    proposito: 'Transformar cartografía en un lugar recorrible a pie o en coche. El desarrollo conecta procesamiento geográfico, construcción de geometría y lógica de juego.',
    ejemplo: ['Huellas de edificios, calles y alturas estimadas de fuentes abiertas.', 'Una ciudad interpretada en la que un personaje puede caminar, conversar con peatones y conducir.'],
    flujo: [['Preparar datos', 'Conservar procedencia y limitaciones de calles, edificios y alturas.'], ['Construir', 'Generar e importar la representación urbana en el proyecto Unreal.'], ['Jugar y verificar', 'Resolver controles, colisiones e interacción; comprobar el paquete descargado y su ejecución.']],
    decisiones: [['Python y datos abiertos', 'Preparan el material geográfico y mantienen su trazabilidad.'], ['Unreal Engine y C++', 'Integran ciudad, personaje, vehículo y lógica de interacción en la aplicación nativa.'], ['Antecedente Three.js', 'El prototipo web conserva una ruta de desarrollo previa con requisitos y pruebas diferentes.']],
    alcance: 'El trabajo publicado reúne preparación cartográfica, fuentes del juego, documentación y evidencias de distribución. Esta ficha mantiene separado el paquete Unreal del prototipo web anterior.',
    validacion: 'La página del juego enlaza el recibo del paquete Linux: procedencia, tamaño, huella y ejecución. El vídeo de jugabilidad muestra ese alcance; la frecuencia del archivo no mide los cuadros por segundo del motor.',
    limites: 'La ciudad utiliza alturas estimadas y fachadas interpretadas. La precisión física y los requisitos mínimos en otros equipos permanecen pendientes; las pruebas web no acreditan una compilación nativa.',
    revision: '21d2db70bdf861c77e6a88359142954cd1dc935b', fuentes: [['README.md', 'Distribuciones y estado'], ['docs/FIDELIDAD.md', 'Fuentes y límites geográficos'], ['unreal', 'Proyecto nativo', 'tree'], ['scripts', 'Preparación y comprobaciones', 'tree']],
  },
  'practice_python': {
    nombre: 'Practice Python — aprendizaje pendiente de publicar',
    resumen: 'Repositorio reservado para prácticas de Python y análisis de datos; el inventario público todavía está vacío.',
    proposito: 'La descripción anuncia un espacio de aprendizaje de Python orientado a datos. El árbol público no contiene todavía ejercicios que permitan explicar una implementación.',
    ejemplo: ['Propuesta de siguiente ejercicio: una tabla ficticia de ventas con valores ausentes.', 'Resultado propuesto: lectura, limpieza y un resumen verificable. Es una idea de práctica; no se atribuye al repositorio actual.'],
    flujo: [['Estado comprobado', 'El inventario marca el repositorio como vacío.'], ['Siguiente entrega', 'Publicar un ejercicio, sus datos de ejemplo y un comando para reproducirlo.']],
    decisiones: [['Python previsto', 'Es el lenguaje anunciado en la descripción. No hay dependencias ni decisiones de arquitectura comprobables.']],
    alcance: 'Está creado el repositorio y declarado el objetivo de aprendizaje. La implementación y su autoría técnica permanecen pendientes de evidencia.',
    validacion: 'Inventario público vacío: no existe una revisión de código, un caso ejecutable o una prueba que se pueda enlazar.',
    limites: 'No se presenta como aplicación terminada ni como experiencia de análisis demostrada. La próxima evidencia debe incluir entradas, salida esperada y comprobación.',
    revision: null, fuentes: [], vacio: true,
  },
  'proyecto': {
    nombre: 'Designter — sitio de servicios de contenido',
    resumen: 'Frontend de presentación comercial con selección de planes, formulario validado y preparación voluntaria de una solicitud por WhatsApp.',
    proposito: 'Ayudar a una persona a comparar servicios y enviar una consulta contextualizada. El repositorio conserva el nombre genérico proyecto, pero el código corresponde al sitio Designter.',
    ejemplo: ['Un visitante elige un plan y completa una solicitud ficticia de diagnóstico.', 'El navegador prepara un mensaje de WhatsApp con la información revisada; la persona decide enviarlo en esa aplicación.'],
    flujo: [['Explorar', 'El menú y las secciones presentan servicios, referencias y planes.'], ['Preparar', 'La selección de un plan actualiza el formulario y la validación marca campos incompletos.'], ['Continuar', 'El script codifica el mensaje y abre el enlace de WhatsApp tras la acción del visitante.']],
    decisiones: [['HTML, CSS y JavaScript', 'Construyen una página estática que no necesita un servidor de aplicación propio.'], ['IntersectionObserver', 'Activa apariciones al entrar en pantalla y conserva una alternativa para movimiento reducido.'], ['Formulario en el navegador', 'Prepara el mensaje; el código inspeccionado no almacena solicitudes en una base de datos.']],
    alcance: 'El código publicado incluye navegación adaptable, validación accesible, selección de planes, galería ampliable y preparación de mensajes.',
    validacion: 'Se contrastaron index.html y script.js: la salida del formulario es una URL de WhatsApp, no una confirmación de recepción en un backend.',
    limites: 'La apertura de WhatsApp depende del navegador y del dispositivo. Falta una suite automatizada en el inventario; las imágenes del portafolio están rotuladas como referencias visuales.',
    revision: '1360d0b0d7298620a8eed657d61ea049ba31470f', fuentes: [['index.html', 'Interfaz y formulario'], ['script.js', 'Validación e interacción'], ['styles.css', 'Diseño adaptable']],
  },
  'prueba-api-tareas': {
    nombre: 'API de tareas con FastAPI',
    resumen: 'Servicio que recibe y devuelve JSON para crear, consultar, completar y borrar tareas guardadas en SQLite.',
    proposito: 'Construir la parte de una aplicación que otros programas consultan por HTTP. La API define qué enviar, qué devuelve cada ruta y cómo comunica un error.',
    ejemplo: ['POST /tareas con {"titulo":"Revisar documentación"}.', 'Respuesta 201 con la tarea creada. Completar un identificador inexistente produce el error documentado; completar uno existente permite filtrar su nuevo estado.'],
    flujo: [['Validar', 'FastAPI recibe la petición y contrasta el cuerpo con los esquemas.'], ['Operar', 'La capa repositorio ejecuta la operación de datos.'], ['Responder', 'El servicio devuelve JSON con el estado HTTP definido en el contrato.']],
    decisiones: [['FastAPI y esquemas', 'Describen entradas y salidas y generan documentación interactiva.'], ['SQLite y repositorio separado', 'Persisten las tareas y permiten probar operaciones sin depender de la interfaz HTTP.']],
    alcance: 'El repositorio publica rutas, contratos de datos, persistencia y pruebas de API y repositorio.',
    validacion: 'Los tests usan una base temporal. CONTRATO.md e INFORME.md documentan respuestas y comprobaciones reproducibles.',
    limites: 'La revisión no implementa autenticación ni separación por usuario. Falta medir concurrencia y definir acceso antes de exponer datos personales.',
    revision: '61328309706d6e55799770c45f2b2203d01a1f78', fuentes: [['CONTRATO.md', 'Contrato HTTP'], ['app.py', 'Rutas y respuestas'], ['repositorio.py', 'Persistencia'], ['test_api.py', 'Pruebas de API']],
  },
  'prueba-bot-clima': {
    nombre: 'Bot de clima para Telegram',
    resumen: 'Bot que consulta el tiempo actual de una ciudad en OpenWeatherMap y devuelve los datos por Telegram.',
    proposito: 'Practicar la integración entre un canal de conversación y un servicio externo, manteniendo separadas la consulta y la configuración.',
    ejemplo: ['El comando /clima Neiva, CO.', 'Una respuesta con temperatura, sensación térmica y otros campos que devuelva el servicio. No se inventa aquí una lectura meteorológica actual.'],
    flujo: [['Recibir ciudad', 'Telegram entrega el comando o el texto al bot.'], ['Consultar', 'weather.py solicita la observación con idioma y unidades configurados.'], ['Responder', 'Se normalizan los datos o se comunica que la ciudad o el servicio no respondieron correctamente.']],
    decisiones: [['Python y requests', 'Hacen explícitos la solicitud HTTP, su tiempo de espera y el manejo de errores.'], ['Variables de entorno', 'Separan credenciales y configuración del código publicado.']],
    alcance: 'El repositorio publica manejadores de Telegram, cliente de clima y configuración separada.',
    validacion: 'Se leyó weather.py: distingue ciudad ausente, fallo de red y respuesta inválida. El inventario no contiene pruebas automatizadas.',
    limites: 'Depende de la disponibilidad y cuota de OpenWeatherMap. Los nombres ambiguos necesitan país; no ofrece un pronóstico propio.',
    revision: 'af24ed0f39423e3dd23d709b944cb35b87519fa3', fuentes: [['README.md', 'Comandos y configuración'], ['weather.py', 'Consulta y errores'], ['bot.py', 'Interfaz de Telegram']],
  },
  'prueba-notas-cli': {
    nombre: 'Notas CLI — libreta en la terminal',
    resumen: 'Herramienta de Python para guardar, listar, buscar y borrar notas en un archivo JSON local.',
    proposito: 'Conservar apuntes sin salir de la terminal y poder reutilizar su salida en otros programas.',
    ejemplo: ['Una nota ficticia con el texto «Revisar documentación» y la etiqueta trabajo.', 'Un registro con identificador y fecha; una búsqueda parcial en texto o etiquetas permite recuperarlo.'],
    flujo: [['Interpretar', 'argparse selecciona el comando y el archivo.'], ['Operar', 'El programa carga las notas y aplica la operación.'], ['Guardar', 'Escribe JSON o presenta el resultado en formato legible.']],
    decisiones: [['Biblioteca estándar de Python', 'Evita dependencias de ejecución para una herramienta pequeña.'], ['JSON y normalización Unicode', 'Permiten inspeccionar los datos y buscar sin distinguir tildes o mayúsculas.']],
    alcance: 'El código publicado reúne comandos, persistencia y pruebas en archivos independientes.',
    validacion: 'test_notas.py conserva casos reproducibles. La lectura del código confirma un error explícito ante JSON corrupto.',
    limites: 'Cada cambio reescribe el archivo completo. No hay bloqueo de escrituras concurrentes ni sustitución atómica; está orientado al uso local de una persona.',
    revision: '6bca5c6843832ec42c9fcd42005e6d9e97f56859', fuentes: [['README.md', 'Comandos y formato'], ['notas.py', 'Implementación'], ['test_notas.py', 'Casos de prueba']],
  },
  'prueba-web-saldantia': {
    nombre: 'Saldantia — interfaz web accesible',
    resumen: 'Sitio estático de servicios con estilos separados por sección y una auditoría documentada de accesibilidad y adaptación de pantalla.',
    proposito: 'Presentar una oferta de servicios con una página legible y controles identificables en escritorio y pantallas pequeñas.',
    ejemplo: ['Una persona abre el sitio en un celular y recorre servicios y contacto.', 'Una disposición adaptada al ancho disponible, con etiquetas de formulario y una navegación que indica la sección visible.'],
    flujo: [['Cargar', 'El navegador recibe HTML, estilos y recursos estáticos.'], ['Distribuir', 'Las reglas de CSS adaptan secciones y textos.'], ['Acompañar', 'El script actualiza navegación y apariciones durante el recorrido.']],
    decisiones: [['HTML y CSS modular', 'Separan base visual, portada, servicios y otras secciones sin un proceso de compilación.'], ['JavaScript acotado', 'Añade comportamiento de desplazamiento a una estructura de contenido estática.']],
    alcance: 'El repositorio publica página, estilos, script y un informe de revisión visual y accesibilidad.',
    validacion: 'AUDITORIA_CALIDAD.md documenta anchos revisados, contraste y etiquetas. Es evidencia de una auditoría escrita; el inventario no contiene una suite automatizada.',
    limites: 'La ficha acredita la interfaz y su auditoría. La recepción efectiva de formularios y una evaluación con usuarios requieren evidencia adicional.',
    revision: '195ac3fc5803a33be2d8315cad28e3195fd41da1', fuentes: [['README.md', 'Estructura del sitio'], ['AUDITORIA_CALIDAD.md', 'Auditoría publicada'], ['js/scroll.js', 'Navegación y apariciones'], ['index.html', 'Contenido y controles']],
  },
  'sirhegel': {
    nombre: 'Perfil GitHub — documentación y métricas',
    resumen: 'Repositorio del perfil público: presentación de trabajo, documentación editorial y herramientas para producir métricas verificables.',
    proposito: 'Conectar la presentación de Jhon con proyectos y evidencia pública. El README del perfil reúne enlaces; las herramientas acompañan la actualización de sus datos.',
    ejemplo: ['Un inventario público de repositorios y la documentación del perfil.', 'Una presentación enlazada con archivos de métricas y material de apoyo versionado.'],
    flujo: [['Reunir', 'Conservar información del perfil y referencias a los trabajos.'], ['Preparar', 'Organizar herramientas, métricas y textos de presentación.'], ['Publicar', 'GitHub muestra el README especial de la cuenta.']],
    decisiones: [['Markdown', 'Mantiene la presentación legible y revisable en el historial.'], ['Python y Shell', 'Acompañan la recolección y preparación documentada de datos del perfil.']],
    alcance: 'Este repositorio acredita documentación del perfil y herramientas de apoyo. Los proyectos enlazados conservan su código y créditos en sus respectivos repositorios.',
    validacion: 'El árbol publica herramientas, archivos de métricas y pruebas. La presencia de un proyecto en el README no demuestra que su implementación viva en este repositorio.',
    limites: 'Las cifras requieren fecha y fuente; una actividad o una insignia no mide por sí misma capacidad técnica. Los créditos de trabajos conjuntos se revisan en su fuente original.',
    revision: '4674a3efc9764e9aa158d8107bf957058d81314c', fuentes: [['README.md', 'Perfil y referencias'], ['herramientas', 'Herramientas del perfil', 'tree'], ['metricas', 'Métricas versionadas', 'tree'], ['pruebas', 'Pruebas publicadas', 'tree']],
  },
  'sitio': {
    nombre: 'Sitio personal — publicación y observatorio 3D',
    resumen: 'Portafolio construido con un generador estático, proyectos documentados y una sala 3D continua que acompaña la navegación.',
    proposito: 'Reunir trabajo de software, escritura y estudios con enlaces de evidencia. La interfaz permite explorar el contenido dentro de un observatorio modelado.',
    ejemplo: ['Una ficha de proyecto y una navegación a Ciencia desde la portada.', 'El generador entrega HTML legible y la navegación cambia el contenido conservando la misma sala y la elección de audio.'],
    flujo: [['Construir', 'Node combina datos y plantillas para generar páginas, índices y metadatos.'], ['Servir', 'Los documentos se publican como archivos estáticos; las funciones del panel tienen su propia lógica.'], ['Interactuar', 'El controlador mantiene la sala Three.js y actualiza el contenido sin sustituir su canvas.']],
    decisiones: [['JavaScript y generación estática', 'Publican contenido consultable sin exigir que el navegador reconstruya cada página.'], ['Three.js y esbuild', 'Modelan geometría y compilan el motor visual que acompaña el recorrido.'], ['HTML progresivo', 'Mantiene una salida legible con movimiento reducido o sin WebGL.']],
    alcance: 'El trabajo publicado reúne generador, plantillas, catálogo, panel, pruebas de navegador y motor del observatorio. La escena se construye con geometría; sus controles cambian telón, luz y órbita.',
    validacion: 'Las pruebas comprueban navegación, accesibilidad, seguridad y continuidad del canvas. Las métricas de repositorios se mantienen separadas de esta explicación editorial.',
    limites: 'La resolución se adapta al dispositivo y existe pausa. Falta medir frecuencia y consumo en una muestra de teléfonos físicos; una animación fluida en un equipo no acredita todos los dispositivos.',
    revision: 'ebb898c72d9cade1e9261b68271298aa42bb5dd5', fuentes: [['construir.js', 'Generador del sitio'], ['plantilla.js', 'Documentos y navegación'], ['activos/observatorio-3d.js', 'Sala modelada'], ['pruebas/cinematografia.test.mjs', 'Continuidad de navegación']],
  },
});

const propios = new Map(REPOSITORIOS_GITHUB.repositorios.map((repo) => [repo.nombre.toLowerCase(), repo]));

// O(L) tiempo y espacio para una URL de longitud L. Invariante: solo fichas propias
// identificadas en el catálogo; un fork o una URL ajena nunca hereda una explicación.
export function explicacionDeProyecto(proyecto) {
  if (proyecto.fork || proyecto.github?.fork) return null;
  if (!proyecto.repo) return proyecto.slug === 'polidinamica-inteligencia-leads' ? EXPLICACIONES_PROYECTOS[proyecto.slug] : null;
  let url;
  try { url = new URL(proyecto.repo); } catch { return null; }
  if (url.protocol !== 'https:' || url.hostname !== 'github.com') return null;
  const partes = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  if (partes.length !== 2 || partes[0].toLowerCase() !== REPOSITORIOS_GITHUB.propietario.toLowerCase()) return null;
  const nombre = partes[1].toLowerCase();
  return propios.has(nombre) ? EXPLICACIONES_PROYECTOS[nombre] || null : null;
}

// O(K + L) tiempo y espacio: K pasos de flujo, L longitud de la URL.
// Invariante: conserva slug, evidencia numérica, enlaces y estado del catálogo.
export function proyectoConExplicacion(proyecto) {
  const detalle = explicacionDeProyecto(proyecto);
  if (!detalle) return proyecto;
  return {
    ...proyecto,
    nombre: detalle.nombre || proyecto.nombre,
    resumen: detalle.resumen,
    ...(detalle.lenguajes ? { lenguajes: [...detalle.lenguajes] } : {}),
    ...(detalle.cifras ? { cifras: detalle.cifras } : {}),
    porQue: detalle.proposito,
    detalles: detalle.flujo.map(([titulo, texto]) => [titulo, texto]),
    auditoria: { ...proyecto.auditoria, queHice: detalle.alcance },
  };
}

// O(T) tiempo y espacio de salida para T caracteres. Invariantes: texto escapado,
// fuentes HTTPS a revisión inmutable y detalles nativos utilizables sin JavaScript.
export function explicacionProyecto(proyecto) {
  const detalle = explicacionDeProyecto(proyecto);
  if (!detalle) return '';
  const fuentes = detalle.fuentes.map(([ruta, texto, tipo = 'blob']) => {
    const url = `${proyecto.repo.replace(/\/+$/, '')}/${tipo}/${detalle.revision}/${ruta.split('/').map(encodeURIComponent).join('/')}`;
    return `<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(texto)}</a> <span class="micro">${esc(ruta)}</span></li>`;
  }).join('');
  return `<section class="franja proyecto-explicacion" data-explicacion-proyecto="${esc(proyecto.slug)}">
    <div class="scrim columna revelar prosa-ancha">
      <p class="micro verde">Desarrollo de software</p>
      <h2>Una entrada, un proceso, un resultado</h2>
      <p>${esc(detalle.proposito)}</p>
      <p class="micro">${detalle.vacio || detalle.privado ? 'Ejemplo propuesto · alcance en desarrollo' : 'Ejemplo ilustrativo'}</p>
      <dl class="proyecto-ejemplo"><dt>Qué recibe</dt><dd>${esc(detalle.ejemplo[0])}</dd><dt>Qué entrega</dt><dd>${esc(detalle.ejemplo[1])}</dd></dl>
      <details class="proyecto-ingenieria sep-m">
        <summary>Cómo está desarrollado y cómo se comprueba</summary>
        <div class="proyecto-ingenieria-contenido">
          <h3>Recorrido de los datos</h3>
          <ol>${detalle.flujo.map(([titulo, texto]) => `<li><b>${esc(titulo)}.</b> ${esc(texto)}</li>`).join('')}</ol>
          <h3>Tecnologías y función de cada una</h3>
          <dl>${detalle.decisiones.map(([tecnologia, motivo]) => `<dt>${esc(tecnologia)}</dt><dd>${esc(motivo)}</dd>`).join('')}</dl>
          <h3>Trabajo publicado</h3><p>${esc(detalle.alcance)}</p>
          <h3>Comprobación y límites</h3><p>${esc(detalle.validacion)}</p><p>${esc(detalle.limites)}</p>
          ${fuentes ? `<h3>Código y documentación consultados</h3><p>Explicación contrastada con la revisión <a href="${esc(proyecto.repo)}/tree/${detalle.revision}" target="_blank" rel="noopener"><code>${detalle.revision.slice(0, 7)}</code></a>. La propiedad del repositorio no atribuye automáticamente cada línea a una sola persona; el historial y los créditos permiten revisar colaboraciones.</p><ul class="proyecto-fuentes">${fuentes}</ul>` : `<p>${detalle.privado ? 'No se enlazan código ni datos comerciales privados.' : `El <a href="${esc(proyecto.repo)}" target="_blank" rel="noopener">repositorio público</a> todavía no tiene una revisión de código que permita comprobar una implementación.`}</p>`}
        </div>
      </details>
    </div>
  </section>`;
}

---
titulo: Antes de contribuir: auditar políticas y trabajo duplicado con GitHub CLI
categoria: Análisis
fecha: 2026-08-27
resumen: Diseño y uso de gh-before-you-contribute, una extensión de GitHub CLI y Action de solo lectura que reúne políticas de IA, señales de trabajo en curso y salidas aptas para automatización.
etiquetas: GitHub, código abierto, GitHub CLI, automatización, IA, seguridad
---

Contribuir a un proyecto ajeno debería comenzar antes de escribir código. Hay dos preguntas previas que parecen sencillas: si el proyecto admite trabajo asistido por IA y si otra persona ya está resolviendo el mismo problema. En GitHub, ninguna de las dos se responde de forma fiable mirando un solo campo.

Construí [gh-before-you-contribute](https://github.com/SirHegel/gh-before-you-contribute) para reunir esas comprobaciones en una extensión de GitHub CLI y una Action reutilizable. La versión [v1.0.0](https://github.com/SirHegel/gh-before-you-contribute/releases/tag/v1.0.0) no decide si una contribución es buena. Hace una tarea más pequeña: consulta evidencia accesible a la sesión, muestra de dónde salió y detiene el trabajo automático cuando encuentra un bloqueo explícito.

## Las políticas no viven en un lugar único

Una política de contribución asistida por IA puede estar en `CONTRIBUTING.md`, `AI_POLICY.md`, `AGENTS.md`, una plantilla de pull request o la documentación del proyecto. También puede estar en el repositorio especial `.github` de la organización y aplicarse como regla común a todos sus repositorios. Leer únicamente el repositorio de destino puede producir un falso permiso por ausencia de información.

El comprobador `ai-policy` construye un corpus en capas. Primero consulta los documentos comunes de la organización; después revisa los archivos del repositorio; por último informa el sitio declarado en el campo `homepage` para que una persona pueda comprobarlo cuando la política esté fuera de GitHub.

La salida distingue cuatro situaciones:

- `FORBIDDEN`: existe una prohibición expresa.
- `DISCLOSE`: se permite o regula el uso, pero hay que declararlo como indique el proyecto.
- `RESPONSIBLE-USE`: hay reglas de uso responsable que deben leerse antes de continuar.
- `NO-POLICY`: no se encontró una regla concluyente en los documentos consultados.

`NO-POLICY` no significa permiso. El comando combinado lo convierte en `REVIEW`: falta una revisión humana del sitio, de la documentación no estándar o de una conversación con quienes mantienen el proyecto.

La clasificación se apoya en frases explícitas y conserva las fuentes en el informe. Ese detalle importa porque una expresión regular mal diseñada puede invertir una regla. «Las contribuciones con LLM no están prohibidas» contiene la palabra *prohibidas*, pero dice lo contrario de «están prohibidas». El código evita convertir una palabra aislada en decisión y deja la evidencia visible para poder discutir un falso positivo.

## Una incidencia sin responsable puede estar ocupada

La ausencia de asignación y comentarios tampoco demuestra que una incidencia esté libre. Una persona puede abrir un pull request sin asignarse la incidencia, mencionar el número solo en la descripción del cambio o decir que ya tiene un parche antes de publicarlo.

El comprobador `issue-free` reúne cuatro clases de señal:

1. Eventos `cross-referenced` del timeline, donde GitHub enlaza pull requests con la incidencia.
2. Pull requests abiertos que mencionan su número.
3. Pull requests abiertos por quien creó la incidencia, presentados como candidatos para revisión.
4. Declaraciones de trabajo en el cuerpo o los comentarios, como tener un parche o estar preparando un pull request.

Las señales estructurales no reemplazan la lectura. Un pull request enlazado puede referirse al contexto y no resolver la incidencia. Por eso `TAKEN` es una indicación conservadora para inspeccionar la evidencia, no una afirmación sobre la intención de otra persona. En modo automático se trata como bloqueo porque duplicar trabajo es más costoso que pedir una revisión.

## Una salida para personas y otra para procesos

El ejecutable raíz compone ambos análisis y produce `READY`, `REVIEW` o `BLOCKED`. El formato de texto conserva los documentos, frases y pull requests que explican el resultado. El formato JSON ofrece la misma estructura sin obligar a analizar texto de terminal:

```bash
gh before-you-contribute owner/repositorio 123 --json | jq .
```

La propiedad `verdict` contiene el resultado conjunto; `policy` e `issue` conservan el veredicto y el informe de cada comprobación. Un proceso puede seleccionar solo el resultado final:

```bash
gh before-you-contribute owner/repositorio 123 --json \
  | jq -e '.verdict == "READY"'
```

El modo `--strict` formaliza el contrato de salida. El código `0` indica que la auditoría terminó sin un bloqueo; `1`, que se encontró una prohibición expresa o trabajo ya reclamado; y `2`, una entrada inválida, una dependencia ausente o un error de la API. Separar un bloqueo de un fallo técnico evita que una automatización interprete «GitHub no respondió» como «la incidencia está libre».

## Solo lectura como límite de diseño

La extensión usa la autenticación ya administrada por `gh` y realiza consultas a la API de GitHub. No publica comentarios, no asigna incidencias, no crea pull requests y no envía telemetría. Tampoco guarda las respuestas de la API. Su trabajo termina al imprimir la evidencia y devolver un código de salida.

La [política de seguridad](https://github.com/SirHegel/gh-before-you-contribute/blob/v1.0.0/SECURITY.md) documenta ese límite y el canal privado de reporte. En GitHub Actions conviene expresarlo también mediante permisos mínimos:

```yaml
permissions:
  contents: read
  issues: read
  pull-requests: read

steps:
  - uses: SirHegel/gh-before-you-contribute@v1.0.0
    with:
      repository: owner/repositorio
      issue: '123'
      format: json
      strict: 'true'
```

Fijar `@v1.0.0` hace reproducible esta configuración. Quien prefiera recibir correcciones compatibles de la versión mayor puede usar el alias `@v1` publicado por el proyecto.

El repositorio valida los scripts con ShellCheck y usa un reemplazo determinista de `gh` durante las pruebas. Así puede comprobar escenarios permitidos y bloqueados sin consumir cuota de la API ni depender del estado cambiante de repositorios externos. Las reglas para ampliar los detectores están en [CONTRIBUTING.md](https://github.com/SirHegel/gh-before-you-contribute/blob/v1.0.0/CONTRIBUTING.md).

## Instalar exactamente la versión 1.0.0

La extensión requiere [GitHub CLI](https://cli.github.com/) con una sesión autenticada y `jq`. Antes de instalarla se pueden verificar ambas dependencias:

```bash
gh auth status
jq --version
```

El parámetro `--pin` de GitHub CLI permite instalar la etiqueta concreta en vez de seguir automáticamente la versión más reciente:

```bash
gh extension install SirHegel/gh-before-you-contribute --pin v1.0.0
gh before-you-contribute --help
```

Después, una auditoría local recibe el repositorio y, de forma opcional, el número de incidencia:

```bash
gh before-you-contribute owner/repositorio
gh before-you-contribute owner/repositorio 123 --strict
```

La [documentación completa de v1.0.0](https://github.com/SirHegel/gh-before-you-contribute/tree/v1.0.0) incluye los detectores individuales y la configuración de la Action. El resultado sigue necesitando criterio humano: la herramienta reduce la incertidumbre inicial y deja un rastro verificable, pero no suplanta las reglas del proyecto ni la conversación con sus mantenedores.

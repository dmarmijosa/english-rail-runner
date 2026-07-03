# Convenciones de código

## Lenguaje y estilo
- TypeScript estricto (`strict: true`); sin `any` — se usan casts puntuales tipados
  (p. ej. `as THREE.Mesh`) solo en fronteras con Three.js.
- Comillas simples, punto y coma, 2 espacios (config del starter Ionic + ESLint).
- Comentarios solo para restricciones no evidentes en el código (por qué, no qué);
  en inglés en el código del motor, en español en docs/tasks.

## Nombres
- Archivos: kebab-case (`level-run.ts`, `game.page.ts`).
- Clases: PascalCase (`LevelRun`, `GameScene`, `GameInput`).
- Funciones/variables: camelCase; constantes de balance en SCREAMING_SNAKE (`JUMP_V`).
- Interfaces sin prefijo `I` (`ViewModel`, `RunHooks`, `TrackEntity`).
- Signals: sustantivos (`hearts`, `phrase`, `mode`); computed derivados (`levelCards`).

## Organización (regla de dependencia)
- `domain/` no importa nada del proyecto.
- `engine/` solo importa `domain/`.
- `infra/` importa `engine/`/`domain/` y librerías (Three.js, WebAudio, localStorage).
- `game.page.ts` (UI) es el único que cablea todo; nadie importa desde `ui`.
- Textos visibles SOLO en `strings.ts` — cero literales de UI en componentes o engine.

## Buenas prácticas que ya sigue el proyecto
- Componentes standalone con `ChangeDetectionStrategy.OnPush` y signals.
- Control flow moderno (`@if`, `@for` con `track`).
- Trabajo pesado fuera de NgZone; `zone.run()` solo en eventos.
- Teclado por `event.code` físico (funciona en layouts no latinos).
- Listeners con limpieza simétrica en `ngOnDestroy` / `dispose()`.
- Números de balance como constantes con nombre, nunca mágicos inline.
- Assets por rutas relativas (`assets/game/...`) — compatibles con subrutas y Capacitor.
- Determinismo: RNG sembrado, paso fijo; nada de `Math.random()` en lógica de juego
  (solo en efectos visuales sin consecuencia, p. ej. el shake de cámara).

## Al añadir contenido
- Nuevos niveles: solo datos en `domain/curriculum.ts` (id secuencial, 8 pares, unidad).
- Nuevos potenciadores: extender `PowerKind`, lógica en `level-run.ts`, icono en
  `scene.ts` (powerPool) y etiqueta en `strings.ts`.
- Cada tarea importante terminada → actualizar `tasks/current.md` y `tasks/backlog.md`.

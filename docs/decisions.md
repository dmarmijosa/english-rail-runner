# Decisiones de arquitectura

_Registro de decisiones importantes, con contexto y consecuencias._

## D1 — Ionic + Angular con Capacitor (no Flutter, no React Native)
- **Contexto**: el juego es Three.js/WebGL (código web). Flutter no ejecuta Three.js nativo;
  React Native habría necesitado un WebView intermedio de todos modos.
- **Decisión**: app Ionic + Angular standalone; Capacitor empaqueta `www/` como app nativa.
- **Consecuencia**: un solo código para web y móvil; acceso a plugins nativos (haptics, status bar).

## D2 — Clean architecture con dominio puro
- `domain/` y `engine/` no importan Angular, Three.js ni DOM. Se pueden testear en Node
  y portar a otro runtime sin tocar una línea.
- La UI consume el engine mediante dos contratos: `RunHooks` (eventos salientes) y
  `ViewModel` (estado de render por frame). Nada más cruza la frontera.

## D3 — Simulación a paso fijo con RNG sembrado (determinismo)
- `LevelRun.update(16.6ms, cmds)` nunca depende del framerate. Toda la aleatoriedad fluye
  por un PRNG sembrado; la misma semilla reproduce exactamente la misma partida.
- **Actualización 2026-07-03**: la semilla ahora es aleatoria POR INTENTO (petición de Danny:
  el orden de palabras/carriles no debe repetirse al rejugar). La reproducibilidad se
  conserva pasando una semilla fija al constructor (`new LevelRun(level, i, hooks, seed)`).
- Permite reproducir bugs y hacer fast-forward en tests (se usó en la verificación E2E).

## D4 — Bucle rAF fuera de NgZone + signals para el HUD
- 60 updates/s dentro de la zona dispararían change detection continuamente.
- El bucle corre con `zone.runOutsideAngular`; los eventos de juego (baja frecuencia)
  entran con `zone.run()` y escriben signals (`ChangeDetectionStrategy.OnPush`).

## D5 — La respuesta de la pregunta usa la INTENCIÓN del jugador
- En la puerta se evalúa `this.lane` (carril elegido), no la posición interpolada
  `heroX` redondeada: una pulsación justo antes de la puerta debe contar.
  (Origen: feedback de Danny "los controles no reaccionan a tiempo".)

## D6 — Carteles de respuesta escalonados en altura + texto a 2 líneas
- Los tableros (4.6 u de ancho, carriles a 3 u) se solapan visualmente en horizontal.
  Escalonar la altura por carril (+0/+1.05/+2.1) y envolver frases largas en dos líneas
  balanceadas resolvió la legibilidad. El pórtico de la frase va alto (y=8.9) para no
  ocluir la línea de visión a los carteles.

## D7 — Héroe con animación procedural (compromiso)
- El auto-rig humanoide (Meshy) rechazó 2 veces las proporciones chunky del zorro.
  Presupuesto de regeneración agotado → animación procedural (bob + balanceo + inclinación)
  sobre la malla estática. Revisitar en backlog.

## D8 — Assets pesados fuera del bundle JS
- GLB (14 MB), texturas y audio viven en `src/assets/game/` y se cargan en runtime
  con rutas relativas (`assets/game/...`) — compatible con `capacitor://localhost` en iOS.

## D9 — Pools e instancing por ley de rendimiento
- Presupuesto: 60 fps en móvil medio, DPR cap 1.5, sin shadow maps.
- Monedas/traviesas = InstancedMesh; vagones/obstáculos/carteles = pools reciclados;
  cero allocaciones dentro del frame loop.

## D10 — Sin autenticación; progreso en localStorage
- Requisito del producto. `Progress` es un objeto plano serializable; migrar a otra
  persistencia (Capacitor Preferences, backend) solo toca `infra/storage.ts`.

## D11 — El despliegue web de Higgsfield queda como legado
- La versión pre-migración sigue jugable en https://wavy-tree-721.higgsfield.gg/
  (game_id `f54a41b9-0b44-4ab2-90b0-4540bdab20fb`). Para actualizarla desde este proyecto:
  `npm run build`, añadir el stub `logic.js` a `www/`, zip y redesplegar CON ese game_id.

## D12 — Mobile-first: gestos como control principal
- La app es táctil: swipes **encadenados** (tras cada gesto el origen se resetea a la
  posición actual del dedo, permitiendo mover + saltar en un mismo arrastre), tap = saltar,
  háptica en cada gesto (@capacitor/haptics). La UI nunca menciona teclas; teclado y
  gamepad siguen operativos como métodos secundarios (mismo stream de `Command`s).
- El dron villano solo se materializa cuando la persecución es real (dd < 10) y vuela en
  alto por el flanco del héroe — nunca entre la cámara y los carteles de respuesta.

## D13 — Modo Repaso sobre palabras falladas
- Las respuestas incorrectas se acumulan en `Progress.failed` (en→es). `domain/review.ts`
  construye un `LevelDef` sintético (id 0, hasta 10 palabras) que se juega con el mismo
  `LevelRun`; los distractores salen de TODO el vocabulario (`ALL_PAIRS`) porque el set de
  repaso puede ser pequeño. Acertar una palabra la redime (sale de `failed`, entra en
  `learned`). El repaso no escribe estrellas de curriculum (`recordResult` ignora `levelId ≤ 0`).
- Consecuencia de diseño: `LevelRun` acepta un `distractorPool` opcional y `buildQuestions`
  garantiza 2 distractores distintos ≠ respuesta; el nº de puertas ya no depende de
  `cfg.questions` sino de `questions.length` (soporta niveles de longitud variable).

## D14 — Ventana de lectura ampliada (~5 s)
- Petición del usuario: la palabra y las opciones estaban demasiado juntas para elegir.
  `readDist` pasó de `max(55, speed*3.8)` a `max(80, speed*5.6)` y el pórtico 3D de la frase
  se separó de los carteles (`gate−12`). Sube la distancia de reacción sin tocar el resto.

## Patrones utilizados
- **Capas concéntricas** (domain ← engine ← infra/ui), **View-Model plano** por frame,
  **Object pooling**, **Command pattern** para input (teclado/táctil/gamepad → `Command`),
  **Event hooks** tipados, **Signals + OnPush** en la UI.

## Posibles mejoras futuras
- Ver `tasks/backlog.md` (rigging real, TTS, SRS, tests del dominio, split de scene.ts).

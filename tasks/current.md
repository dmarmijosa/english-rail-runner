# Tarea actual

_Última actualización: 2026-07-03 (4ª iteración)_

## Iteración 4 (última) — más distancia, visual héroe/dron + Logros
- ✅ Aún más distancia palabra↔opciones: `readDist` de `max(80, speed*5.6)` a
  `max(115, speed*7.6)` (~7 s). Verificado: readGap 82 → 115.
- ✅ Visual: héroe más grande (altura 2.4) y elevado (+0.72) para que se vean los pies;
  cámara más picada (y 6.7, mira a y 2.3). Dron rediseñado para estar **siempre visible**
  volando por delante y arriba de la vía, descendiendo hacia el héroe según se acerca
  (sin tapar cámara ni carteles). Verificado en móvil.
- ✅ **Sistema de Logros** (tarea del backlog): 9 logros en `domain/achievements.ts`
  (primer paso, sin fallos, intacto, racha 5, repasador, 25/100 palabras, tier 1, 500
  monedas). `Progress.achievements` los persiste; se evalúan al terminar un nivel, el
  resumen muestra un toast "¡Logro desbloqueado!" y hay pantalla de lista desde el menú
  ("🏅 Logros n/total"). Motor: `RunResult` ahora expone `maxStreak` y `heartsLeft`.
  Verificado E2E: nivel perfecto desbloqueó y guardó 4 logros.

## Iteración 3 — distancia de lectura + Modo Repaso
- ✅ Más distancia entre la palabra y las opciones: la ventana de lectura pasó de
  `max(55, speed*3.8)` a `max(80, speed*5.6)` (~5 s) y el pórtico 3D de la frase se
  separó de los carteles (gate−12). Verificado: readGap 55 → 82 unidades.
- ✅ **Modo Repaso** (tarea del backlog): las palabras falladas se guardan en
  `Progress.failed` (en→es) y se redimen al acertarlas. Nuevo `domain/review.ts`
  construye un nivel sintético con hasta 10 palabras falladas; distractores tomados de
  TODO el vocabulario (`ALL_PAIRS`). Botón "🔁 Repaso (N)" en el menú; el HUD muestra
  "🔁 Repaso"; el resumen dice "¡Repaso completado!". No escribe estrellas de nivel.
  Verificado E2E: fallar → repasar → redención (`failed` vacío, palabras a `learned`).
- Regresión OK en nivel normal (8 preguntas, distractores del mismo tema).
- Archivos: `domain/review.ts` (NUEVO), `domain/curriculum.ts` (WordPair), `domain/quiz.ts`
  (pool de distractores), `domain/progress.ts` (`failed` + redención), `engine/level-run.ts`
  (readDist, failedWords, distractorPool, gates por nº real de preguntas),
  `game.page.ts/.html/.scss` (runLevel + startReview, botón repaso, HUD/summary), `strings.ts`.

## Qué se está desarrollando actualmente
- ✅ HECHO hoy — **iteración mobile-first**:
  - Gestos táctiles como control principal: swipes encadenados sin levantar el dedo
    (umbral 14 px), tap = saltar, vibración háptica en cada gesto/acierto/golpe
    (@capacitor/haptics). UI sin menciones de teclado; hint de gestos al iniciar nivel.
  - Visual: pies del héroe plantados (+0.42, altura 1.85), dron rediseñado (rotores con
    giro propio, ojo brillante, lámpara parpadeante) que escolta en alto por el flanco y
    solo aparece con dd < 10 — nunca invade la cámara.
  - Carteles rediseñados: esquinas redondeadas, degradado por estado (✓ dorado / ✗ magenta),
    animación pop al aparecer y flotado suave.
  - Aleatoriedad por partida: `LevelRun` recibe semilla aleatoria por intento — el orden de
    preguntas, el carril correcto y el trazado cambian en cada rejugada.
  - Animaciones/transiciones de UI (cards pop, feedback, estrellas, hint, palabras del resumen).
  - **Backlog cumplido**: TTS de pronunciación (Web Speech API) al acertar y al tocar las
    palabras del resumen (`infra/tts.ts`).
  - JSDoc en todo `src/app/game/**` + README.md del proyecto.
- EN CURSO: empaquetado iOS con Capacitor (config lista; falta generar plataforma nativa).

## Qué falta por terminar
- [ ] `npx cap add ios` + `npx cap sync ios` (requiere Xcode + CocoaPods en el Mac de Danny).
- [ ] Xcode: orientación landscape, AppIcon (base `src/assets/icon/favicon.png`), splash #f7b267.
- [ ] QA en iPhone real: WebGL, latencia de gestos, háptica, TTS y audio tras primer toque.
- [ ] Distribución: TestFlight → App Store (cuenta Apple Developer).

## Próximos pasos
1. `npm run build && npx cap add ios && npx cap open ios`.
2. Ajustes nativos y QA en dispositivo.
3. Backlog: rigging real del héroe, modo repaso de falladas, tests del dominio.

## Bloqueadores
- Pasos nativos iOS requieren Xcode interactivo (máquina de Danny).
- Rig del héroe: 2 intentos Meshy fallidos → animación procedural (compromiso documentado).
- Créditos Higgsfield restantes: ~15–20.

## Archivos afectados (iteración mobile-first, 2026-07-03)
- `src/app/game/infra/input.ts` — gestos encadenados, `onGesture`, JSDoc (reescrito).
- `src/app/game/infra/tts.ts` — NUEVO: pronunciación inglesa (Web Speech API).
- `src/app/game/infra/scene.ts` — dron rediseñado y reposicionado, carteles redondeados con
  pop-in, héroe +0.42/1.85, JSDoc.
- `src/app/game/engine/level-run.ts` — semilla aleatoria por intento (parámetro `seed`), JSDoc.
- `src/app/game/game.page.ts/.html/.scss` — háptica, TTS, hint de gestos, animaciones UI,
  gancho dev `?dev=1` (`window.__rail`), JSDoc.
- `src/app/game/strings.ts` — textos de gestos (sin teclado).
- `README.md` — NUEVO. `docs/decisions.md` — D3 actualizada (semilla por intento) + D12.

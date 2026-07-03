# Estado actual del desarrollo

_Actualizado: 2026-07-03 (3ª iteración: repaso + distancia de lectura)_

## Iteración 3 (última)
- Más distancia palabra↔opciones: ventana de lectura ~5 s (readGap 55 → 82).
- **Modo Repaso** (`domain/review.ts`): re-juega las palabras falladas (`Progress.failed`),
  redimidas al acertar; botón "🔁 Repaso (N)" en el menú, resumen "¡Repaso completado!".
- Verificado E2E en navegador; build de producción OK.


## Iteración mobile-first (última)
- Gestos táctiles encadenados como control principal + háptica; UI sin menciones de teclado;
  hint de gestos al arrancar nivel.
- Dron rediseñado (rotores, ojo, lámpara) y reposicionado (solo visible con dd < 10, en alto
  por el flanco); pies del héroe plantados (+0.42); carteles redondeados con degradado,
  ✓/✗ y pop-in; animaciones/transiciones en toda la UI.
- Orden de preguntas y carril correcto aleatorios por partida (semilla por intento).
- TTS de pronunciación al acertar y al tocar palabras del resumen (backlog cumplido).
- JSDoc en todo el código del juego + README.md.
- Gancho dev: `?dev=1` expone `window.__rail` (startLevel/run) para verificación automatizada.

## Hito anterior
Migración completa del juego (antes web vanilla con Three.js) a **Ionic + Angular 20**:
- Motor en TS bajo `src/app/game/` (domain/engine/infra), UI como `GamePage` con signals.
- Assets movidos a `src/assets/game/`. Base web antigua eliminada.
- `npm run build` pasa; verificado en navegador: menú → niveles → gameplay (HUD, aciertos,
  monedas, corazones) funcionan. 120 fps en desktop.

## Incluye los fixes de la sesión anterior
- Pies del héroe visibles (+0.28 sobre el techo curvo del vagón).
- Carteles de respuesta escalonados por carril + frases largas en 2 líneas balanceadas.
- Pórtico de frase elevado (no ocluye carteles) y oculto al llegar al héroe.
- Controles: carril por intención en la puerta, LANE_SPEED 14, salto cancela slide,
  caída rápida, swipe a 16 px, buffer de salto 150 ms.

## En qué punto estamos
- Web (dev): 100 % jugable con `npm start` (ng serve).
- iOS: config Capacitor lista (`appId com.dmarmijosa.englishrailrunner`); falta
  `npx cap add ios`, ajustes en Xcode (orientación landscape, AppIcon, splash) y QA en iPhone.
- Ver `tasks/current.md` para el detalle y `tasks/backlog.md` para lo demás.

## Datos operativos
- Juego web legado publicado: https://wavy-tree-721.higgsfield.gg/
  (game_id Higgsfield `f54a41b9-0b44-4ab2-90b0-4540bdab20fb`).
- Créditos Higgsfield restantes: ~15–20 (plan plus) — regeneración de assets limitada.
- Rig del héroe: 2 intentos fallidos (proporciones); animación procedural como compromiso.

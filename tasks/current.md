# Tarea actual

_Última actualización: 2026-07-03_

## Qué se está desarrollando actualmente
- ✅ HECHO: migración completa del juego web (Three.js vanilla) a **Ionic + Angular 20 standalone**
  bajo `src/app/game/` (dominio/engine/infra en TS, HUD y menús como componente Angular con signals).
  La base web antigua fue eliminada; este proyecto es ahora la única fuente.
- EN CURSO: empaquetado iOS con Capacitor (config lista; falta generar la plataforma nativa).

## Qué falta por terminar
- [ ] `npx cap add ios` + `npx cap sync ios` (requiere Xcode + CocoaPods en el Mac).
- [ ] En Xcode: bloquear orientación a landscape, AppIcon (base: `src/assets/icon/favicon.png`),
  splash screen con la paleta (#f7b267), firma con el equipo de desarrollo.
- [ ] Probar en iPhone real: rendimiento WebGL, latencia táctil, audio tras el primer toque.
- [ ] Distribución: TestFlight → App Store (requiere cuenta Apple Developer).
- [ ] Decidir si se actualiza el despliegue web de Higgsfield desde `www/` (ver docs/decisions.md).

## Próximos pasos
1. `npm run build` + `npx cap add ios` + `npx cap open ios`.
2. Ajustes nativos (orientación, iconos, splash).
3. QA en dispositivo.
4. Backlog: rigging real del héroe, TTS de pronunciación, modo repaso.

## Bloqueadores
- Generar la plataforma iOS y firmar requiere Xcode interactivo (máquina de Danny).
- El auto-rig del héroe (Meshy) falló 2 veces por proporciones chunky → animación procedural.
- Créditos Higgsfield restantes: ~15–20 (plan plus).

## Archivos afectados (migración, 2026-07-03)
- Nuevos: `src/app/game/**` (domain/, engine/, infra/, game.page.*, strings.ts),
  `src/assets/game/**` (modelos GLB, texturas, audio), `design/`, `tools/`.
- Modificados: `src/app/app.routes.ts` (ruta única → GamePage), `src/index.html` (título/tema),
  `capacitor.config.ts` (appId com.dmarmijosa.englishrailrunner), `angular.json` (budget estilos).
- Eliminados: `src/app/home/` y toda la base web antigua (carpeta `public/` del proyecto padre).
- Juego web publicado (versión pre-migración, sigue vivo): https://wavy-tree-721.higgsfield.gg/
  (game_id Higgsfield: `f54a41b9-0b44-4ab2-90b0-4540bdab20fb`).

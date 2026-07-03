# 🦊🚂 English Rail Runner

Juego 3D educativo tipo *endless runner* para aprender inglés. Lee la frase en español,
desliza el dedo para cambiar de vía y **salta al vagón cuyo cartel lleva la traducción
correcta** antes de la puerta de respuesta. Un dron villano se acerca con cada error…

- 🎮 **36 niveles** desde lo básico (saludos, números, colores) hasta conversación esencial
- 🪙 Monedas, rachas ×5, estrellas por nivel y potenciadores (🛡️ escudo, 🧲 imán, 🐢 cámara lenta, ✖️2)
- 🗣️ **Pronunciación**: cada acierto se pronuncia en inglés (Web Speech API, offline)
- 📱 **Mobile-first**: gestos táctiles encadenados con vibración háptica; también teclado y mando
- 🎨 Estilo propio: desierto al atardecer, tren de madera ámbar/turquesa, low-poly cartoon
- 🔀 Cada partida baraja el orden de preguntas y el carril correcto — nunca se repite igual
- 🔒 Sin autenticación: el progreso vive en el dispositivo

> Versión web jugable (legado pre-migración): https://wavy-tree-721.higgsfield.gg/

## Stack

| Capa | Tecnología |
|---|---|
| App | Ionic 8 + Angular 20 standalone (signals, OnPush) |
| 3D | Three.js 0.170 + GLTFLoader |
| Nativo | Capacitor 8 (iOS / Android) |
| Assets | Modelos GLB, texturas y audio generados con IA (STYLE FORMULA v1 en `design/`) |

## Cómo ejecutarlo

```bash
npm install
npm start          # → http://localhost:4200 (añade ?dev=1 para fps/draw calls)
```

**Controles**: desliza ←→ para cambiar de vía, ↑ o toque para saltar, ↓ para agacharte.
En escritorio también funcionan las flechas/WASD y un mando (Gamepad API).

## Build iOS

```bash
npm run build
npx cap add ios      # primera vez
npx cap sync ios
npx cap open ios     # firmar, orientación landscape, AppIcon, splash
```

Más comandos en [.ai/commands.md](.ai/commands.md).

## Arquitectura (clean)

```
src/app/game/
├── domain/    # currículo, quiz y progresión — lógica pura, sin dependencias
├── engine/    # LevelRun: simulación determinista a paso fijo (60 Hz)
├── infra/     # Three.js, gestos/teclado/gamepad, WebAudio, TTS, storage
└── game.page.*  # UI Angular: HUD y menús con signals, bucle fuera de NgZone
```

Detalles y diagramas Mermaid: [docs/architecture.md](docs/architecture.md) ·
Decisiones: [docs/decisions.md](docs/decisions.md) ·
Convenciones: [docs/conventions.md](docs/conventions.md) ·
Estado y pendientes: [tasks/current.md](tasks/current.md)

## Créditos

Diseño, código y assets generados con ayuda de IA (Claude Code + Higgsfield).
Proyecto de Danny Armijos — aprende inglés jugando. 🚀

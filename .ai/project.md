# English Rail Runner — resumen del proyecto

Juego 3D educativo tipo *endless runner* para aprender inglés (ES→EN), estilo Subway Surfers
pero con identidad propia (desierto al atardecer, tren de madera ámbar/turquesa, héroe zorro).

**Mecánica**: aparece una frase en español → tres vagones adelante llevan carteles con opciones
en inglés → el jugador cambia de carril y salta al vagón con la traducción correcta antes de la
puerta. Acertar da puntos (racha ×5), monedas y aleja al dron villano; fallar quita corazón y
lo acerca. Obstáculos (cajas: saltar; señales bajas: deslizarse), rampas con arcos de monedas y
potenciadores (escudo, imán, cámara lenta, x2). Al llegar a la META se muestran las palabras
aprendidas, aciertos y estrellas (≥60 % = 1★ desbloquea el siguiente).

**Contenido**: 36 niveles × 8 pares, de lo básico (saludos, números, colores) a conversación
esencial (opiniones, emergencias, small talk). Todo en `src/app/game/domain/curriculum.ts`.

**Stack**: Ionic 8 + Angular 20 standalone (signals, OnPush) + Three.js 0.170 + Capacitor 8.
Sin autenticación; progreso en localStorage. Assets IA (héroe y vagón GLB, cielo, suelo
seamless, música y SFX) bajo `src/assets/game/`.

**Arquitectura**: clean — `domain/` (datos y reglas puras) ← `engine/` (simulación a paso fijo
determinista) ← `infra/` (Three.js, input, audio, storage) ← `game.page.ts` (UI Angular).
Detalles y diagramas: `docs/architecture.md`. Decisiones: `docs/decisions.md`.

**Estado**: jugable al 100 % en web (ng serve); pendiente empaquetado iOS (ver `tasks/current.md`).

**Legado**: la versión web pre-migración sigue publicada en https://wavy-tree-721.higgsfield.gg/
(game_id Higgsfield `f54a41b9-0b44-4ab2-90b0-4540bdab20fb` — necesario para redesplegar).

**Diseño**: STYLE FORMULA v1 aprobada y manifiesto de assets en `design/` (plan.md, assets.csv).
Dueño: Danny (dmarmijosa2667@gmail.com).

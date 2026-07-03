# Reglas para modificar el código

1. **Respeta la regla de dependencia**: `domain/` no importa nada; `engine/` solo `domain/`;
   `infra/` no importa Angular; solo `game.page.ts` cablea capas. Nunca metas Angular, Three.js
   o DOM en domain/engine.
2. **Cero literales de UI**: todo texto visible va en `src/app/game/strings.ts`.
3. **Determinismo**: nada de `Math.random()` en lógica de juego — usa el RNG sembrado
   (`mulberry32`). El paso de simulación es fijo (16.6 ms); no acoples lógica al framerate.
4. **Rendimiento es ley**: nada de allocaciones dentro del frame loop; entidades repetidas →
   InstancedMesh o pools; DPR cap 1.5; sin shadow maps. Mide con `?dev=1` antes de hablar de
   "lento" (objetivo: 60 fps móvil, <120 draw calls).
5. **Input**: teclado por `event.code` físico, nunca `event.key`. Todo método de entrada
   (teclado/táctil/gamepad) produce los mismos `Command`s.
6. **Trabajo pesado fuera de NgZone**; actualiza la UI solo con signals vía `zone.run()`.
   Limpia todo listener/rAF/timeout en `ngOnDestroy`/`dispose()`.
7. **Balance en datos**: números de juego como constantes con nombre o en `levelConfig`;
   un cambio de balance no debe tocar lógica.
8. **Estilo visual**: cualquier asset nuevo (incluido arte procedural en código) usa la
   STYLE FORMULA v1 y la paleta de `design/plan.md`. No mezclar estilos.
9. **Al terminar una tarea importante**: actualiza `tasks/current.md` (estado, próximos pasos,
   archivos afectados) y `tasks/backlog.md` (bugs/ideas encontrados). Es obligatorio, no opcional.
10. **Verifica antes de dar por hecho**: `npm run build` debe pasar sin errores y el flujo
    menú → nivel → resumen debe probarse en navegador (o dispositivo si el cambio es nativo).
11. **Redeploy web (Higgsfield)**: siempre con el game_id existente
    `f54a41b9-0b44-4ab2-90b0-4540bdab20fb` — omitirlo crea un juego nuevo con otra URL.
12. **Commits**: mensajes en español, imperativos y con alcance ("juego: …", "docs: …",
    "ios: …"). No commitees `www/`, `node_modules/` ni plataformas nativas generadas.

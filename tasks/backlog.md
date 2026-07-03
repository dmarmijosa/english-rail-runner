# Backlog

_Última actualización: 2026-07-03 (2ª iteración)_

## Completado recientemente
- ✅ Pronunciación TTS (Web Speech API) al acertar + palabras del resumen tocables (2026-07-03).
- ✅ Haptics con `@capacitor/haptics`: gestos, aciertos, fallos y golpes (2026-07-03).
- ✅ Orden aleatorio de preguntas/carriles por partida (semilla por intento) (2026-07-03).

## Mejoras futuras
- Héroe con esqueleto real: regenerar el concepto con piernas más largas/separadas (el auto-rig
  humanoide de Meshy rechazó las proporciones actuales, 2 intentos gastados) o rig procedural
  en Blender headless. Hoy corre con animación procedural (bob + balanceo) en `infra/scene.ts`.
- Clips de salto y tropiezo dedicados cuando exista rig.
- Modo repaso: re-jugar solo las palabras falladas (se registran en `Progress.learned`).
- Tienda cosmética con las monedas (skins del zorro) — hoy solo puntúan.
- Logros (racha perfecta, nivel sin daño, 100 palabras).
- Variedad visual por tier: skybox nocturno/nevado en tiers altos (requiere nueva STYLE FORMULA parcial).
- i18n del UI: `strings.ts` es intercambiable; añadir modo invertido EN→ES.
- Ajuste fino del tamaño/coreografía del dron cuando está muy cerca (dd < 3).

## Bugs encontrados
- (menor) El dron puede solaparse con la cámara cuando droneDist < 4.
- (menor) El backdrop del menú puede mostrar el interior de un vagón según el frame.
- (menor) `music.mp3` es un contenedor .m4a renombrado — decodifica bien, pero renombrar sería más limpio.
- (revisar) Swipes consecutivos requieren levantar el dedo entre gestos.
- (revisar) En `game.page.ts`, IDLE_VIEW comparte estado module-level; si algún día hay 2 instancias
  de GamePage simultáneas, extraerlo a la instancia.

## Refactors pendientes
- Extraer constantes de balance (`GRAVITY`, `JUMP_V`, `LANE_SPEED`…) de `engine/level-run.ts`
  a un `domain/config.ts` junto a `levelConfig`.
- `infra/scene.ts` (~600 líneas) → dividir en builders (props, hero, señales, pools).
- Tests unitarios del dominio y el engine (lógica pura, barata de testear con Karma/Jasmine ya configurado).
- El `setTimeout` de limpieza de gantry en `level-run.ts` es tiempo real, no tiempo de simulación —
  mover a un contador interno de la simulación (afecta determinismo puro).

## Ideas para nuevas funcionalidades
- Modo diario: 5 palabras nuevas al día con repaso espaciado (SRS ligero en localStorage).
- Multijugador fantasma (ghost de un amigo).
- Editor de mazos: pegar una lista ES↔EN propia y generar un nivel.
- Estadísticas: curva de aciertos por unidad, palabras más falladas.

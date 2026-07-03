# English Rail Runner — instrucciones para el agente

## Al empezar CUALQUIER sesión nueva, antes de continuar:
1. Recupera la arquitectura del proyecto: lee `docs/architecture.md`.
2. Lee `/docs`, `/tasks` y `/.ai` si existen (mínimo: `.ai/context.md`, `.ai/rules.md`,
   `tasks/current.md`).
3. Resume el estado actual al usuario en 2-3 frases.
4. Continúa desde `tasks/current.md` (sección "Próximos pasos"), salvo que el usuario
   pida otra cosa.

## Reglas permanentes
- Sigue SIEMPRE `.ai/rules.md` al modificar código (regla de dependencia entre capas,
  strings externos, determinismo, presupuesto de rendimiento, limpieza de listeners).
- Cada vez que termines una tarea importante, actualiza automáticamente
  `tasks/current.md` y `tasks/backlog.md` — sin que el usuario lo pida.
- Comandos de build/run/deploy: `.ai/commands.md`.
- Convenciones de código: `docs/conventions.md`. Decisiones ya tomadas (no re-litigar
  sin motivo): `docs/decisions.md`.
- Idioma con el usuario: español. Código y comentarios del motor: inglés.

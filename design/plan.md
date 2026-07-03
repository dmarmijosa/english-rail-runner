# English Rail Runner — design plan

## Experience formula
The player feels the thrill of mastering English because the game constantly turns each
translation choice into a physical leap of survival.

## Profile
- Time: real-time. Space: continuous 3D (3 lanes). Agency: one hero. Conflict: vs system
  (drone villain, obstacles) + vs self (learning). Content: authored curriculum + seeded
  procedural track. Outcome: win/lose per level, 36 levels. Players: solo. Session: 2–4 min
  per level. Engagement: execution + accumulation/discovery (vocabulary mastery).
- Delivery: desktop + mobile browsers + gamepad. Keyboard by physical key codes. All
  player-visible strings in `strings.js` (UI in Spanish; learning target English).

## Core loop
Phrase in Spanish appears → 3 wagons ahead carry English options on signboards → steer/jump
to the correct wagon before the answer gate → correct: chime + coins + streak, drone pushed
back; wrong: buzzer + lose heart, drone closes in → after 8 questions the station gate (META)
→ summary of learned words, stars by accuracy → next level unlocked.

## Verbs
move lane (left/right), jump, slide, (passive) collect, use power-ups picked on track.

## Systems
- Hearts: 3. Wrong answer or obstacle hit = −1 heart + drone approach. 0 hearts or drone
  catch = level failed (restart level — the cost of failure repeats the interesting part).
- Drone distance: starts 30 m, −8 m per mistake, +4 m per correct, catches at 0.
- Power-ups: shield (absorbs one mistake), magnet (attracts coins 6 s), slow-time (reading
  slow-motion 6 s), ×2 points (10 s).
- Obstacles: crates (jump), low signal frames (slide), wagon gaps (jump), ramps (bonus arc
  with coin trail — risk/reward).
- Economy: coins source = track + correct answers; sink = none in v1 (score only) — recorded
  simplification; stars gate progression instead.
- Scoring: base 100 per correct × streak multiplier (max ×5) × powerup; stars: ≥60 % = 1,
  ≥80 % = 2, 100 % = 3. Next level unlocks with ≥1 star.

## Curriculum (36 levels, basics → essentials)
Units of 8 items each: greetings, numbers, colors, family, days/months, animals, food,
house, school, body, clothes, weather, common verbs ×2, adjectives, places, transport,
time expressions, phrases: introductions, restaurant, directions, shopping, airport, hotel,
work, health, emotions, common questions, connectors, past tense basics, future plans,
small talk, opinions, emergencies, technology, essentials review.

## Balance defaults (data-driven, in curriculum/config)
Speed 14 u/s at level 1 → +0.35 u/s per level (cap 26). Question every ~110 m; obstacle
density scales with tier. Reading time ≥3.5 s at max speed (agency metric, frozen).

## Agency metrics (frozen)
Lane width 3 u; jump air time 0.62 s at 14 u/s ≈ 8.7 u horizontal; wagon roof height 2.6 u;
gap length ≤ 6 u (comfortable); slide window 0.6 s.

## STYLE FORMULA v1 (approved by user)
stylized low-poly 3D cartoon with soft matte shading and gentle color gradients; chunky
rounded silhouettes with slightly exaggerated proportions and no hard outlines; environment
in warm sunset-desert amber and teal-sky tones, hero in bold cobalt-and-cream travel gear
contrasting the surroundings, villains and hazards in hot magenta-red, pickups and
correct-answer cues glowing golden-yellow; cheerful late-afternoon adventure light with long
soft shadows; high contrast between game elements and backgrounds, clean readable
silhouettes, three-quarter isometric view on all concept images.

## Architecture (clean layering)
- `src/domain` — curriculum data, quiz sequencing, progression rules (pure, no DOM/Three).
- `src/app` — game state machine, track spawner, collisions, scoring (pure logic, seeded RNG,
  fixed timestep).
- `src/infra` — Three.js renderer, input (keyboard/touch/gamepad → commands), audio, storage.
- `src/ui` — DOM HUD and menus, consuming `strings.js`.
Deploy: Higgsfield apps engine, solo stub `logic.js` + `index.html` at zip root.

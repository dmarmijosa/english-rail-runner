# Numeric thresholds (fixed before build)

- Frame budget: 60 fps on a mid mobile browser; DPR cap 1.5; no shadows maps (blob shadows);
  fog-limited draw distance 160 u; coins as InstancedMesh (1 draw call); wagons ≤ 40 visible.
- Zero allocations in the frame loop (pools for coins/obstacles/labels).
- Reading window: ≥3.5 s between phrase reveal and answer gate at current speed.
- Input tolerance: lane switch buffered 150 ms; jump buffered 120 ms before landing; answer
  gate counts the lane occupied at gate z ± 0.8 u; hero hitbox 0.6×1.6×0.6 (smaller than visual).
- Drone: start 30 m, −8 m wrong / obstacle, +4 m correct, catch at 0 (level failed).
- Stars: ≥60 % correct = 1★, ≥80 % = 2★, 100 % = 3★; unlock next level at ≥1★.
- Asset budget: zip ≤ 25 MiB per asset; total target < 20 MiB.
- Regeneration budget: 2 attempts per generated asset, then compensate in code.

# Roulette Lab 3D — Automatic Table Edition

A multilingual educational roulette simulator showing why negative expected value cannot be removed by betting systems.

## What changed in v4

The simulator now behaves like a continuous automatic roulette table rather than a manually launched animation:

1. The inner rotor turns counter-clockwise.
2. The launcher sends the ball clockwise into the stationary outer track.
3. Betting remains open during a visible countdown.
4. Betting closes when the ball loses enough speed to leave the outer track.
5. The ball moves inward along the sloped bowl, strikes deflectors, enters the rotating pocket ring, and settles.

The camera is mathematically fixed for the entire session: there are no orbit controls, follow-camera transitions, shakes or loss animations.

## Features

- Separate stationary ball track and counter-clockwise rotating wheel rotor
- Clockwise automatic ball launch
- Betting countdown with a real lock point at track release
- Physically inspired deceleration, inward bowl movement, deflector impacts and pocket settling
- Fully fixed camera with no orbit controls, following, damping or shake
- Correct horizontal pocket geometry with the official wheel order and number colors
- Ball and machine share one local coordinate system, so the ball settles on the pocket ring instead of the hub
- Automatic recurring launches; one pause/resume control replaces per-round launch buttons
- Multiple simultaneous bets with quick chips, undo, remove, clear and repeat-last-round controls
- Clickable 3D pockets and felt-style betting board
- Restrained win effects, pocket glow and synthesized sound
- European single-zero and American double-zero wheels
- Continuous automatic rounds plus 100 / 1,000 / 10,000-round fast simulation based on the previous bet portfolio
- Bankroll, turnover, expected loss, actual P/L and return-rate tracking
- Chinese, English and French interface
- Reduced-motion support and 2D fallback
- No login, payments, server-side data or real-money gambling

## Simulation scope

The motion is a physically inspired educational model, not a calibrated engineering replica of a specific commercial machine. The direction, phase sequence, deceleration logic and inward movement are modeled consistently; the final pocket is sampled first with `crypto.getRandomValues()` and the late settling phase guides the ball into that sampled pocket. Animation never changes the probability distribution.

## Local development

```bash
npm ci
npm run dev
```

## Production build

```bash
npm ci --no-audit --no-fund
npm run build
```

The deployable output is generated in `dist/`.

## Render deployment

The included `render.yaml` pins Node 22.22.1 and uses the public npm registry.

- Build command: `npm ci --no-audit --no-fund && npm run build`
- Publish directory: `dist`
- Runtime: Render Static Site

## Educational model

- European single-zero house edge: `1 / 37 ≈ 2.70%`
- American double-zero house edge: `2 / 38 ≈ 5.26%`

```text
Expected loss = total amount wagered × house edge
```

## License

MIT. Three.js is used under its MIT license.

## Preview files

- `docs/preview-3d.png`: corrected horizontal pocket ring and outer-track ball
- `docs/preview-interface.png`: automatic-round multiple-bet interface and 2D fallback

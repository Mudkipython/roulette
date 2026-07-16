# Roulette Lab 3D — Physical Sequence Edition

A multilingual educational roulette simulator showing why negative expected value cannot be removed by betting systems.

## What changed in v3

The single-round animation was rebuilt around the operating sequence of an automatic roulette machine:

1. The inner rotor turns counter-clockwise.
2. The launcher sends the ball clockwise into the stationary outer track.
3. Betting remains open during a visible countdown.
4. Betting closes when the ball loses enough speed to leave the outer track.
5. The ball moves inward along the sloped bowl, strikes deflectors, enters the rotating pocket ring, and settles.

The camera stays in a stable wide view. There is no automatic follow camera.

## Features

- Separate stationary ball track and counter-clockwise rotating wheel rotor
- Clockwise automatic ball launch
- Betting countdown with a real lock point at track release
- Physically inspired deceleration, inward bowl movement, deflector impacts and pocket settling
- Fixed wide camera with optional manual orbit/zoom before launch
- Clickable 3D pockets and felt-style betting board
- Quick chips, straight-up and common outside bets
- Restrained win effects, pocket glow and synthesized sound
- European single-zero and American double-zero wheels
- Single-round animation plus 100 / 1,000 / 10,000-round fast simulation
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

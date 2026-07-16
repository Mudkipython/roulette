# Roulette Lab 3D

A multilingual educational roulette simulator showing why negative expected value cannot be removed by betting systems.

## Features

- Three.js 3D roulette wheel with metallic materials, lighting, shadows and bloom
- Ball launch, high-speed orbit, gradual track descent and deterministic landing in the sampled pocket
- Optional cinematic follow camera, orbit/zoom controls and synthesized sound effects
- Clickable 3D pockets and a felt-style betting board
- Quick chips, straight-up and common outside bets
- Win confetti, pocket glow and loss feedback
- European single-zero and American double-zero wheels
- Single-round animation plus 100 / 1,000 / 10,000-round fast simulation
- Bankroll, turnover, expected loss, actual P/L and return-rate tracking
- Chinese, English and French interface
- Reduced-motion support and a 2D canvas fallback if WebGL initialization fails
- No login, payments, server-side data or real-money gambling

## Local development

```bash
npm install
npm run dev
```

Open the URL printed by Vite.

## Production build

```bash
npm ci
npm run build
```

The deployable output is generated in `dist/`.

## Render deployment

The included `render.yaml` configures a Render Static Site:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Environment variables: none

For a manually created Render Static Site, use the same values.

## Educational model

The result pocket is sampled first with `crypto.getRandomValues()`. The 3D animation then lands the ball in that sampled pocket. Animation does not alter probabilities.

Standard roulette wagers share the same house edge on a given wheel:

- European single-zero: `1 / 37 ≈ 2.70%`
- American double-zero: `2 / 38 ≈ 5.26%`

Expected loss is presented as:

```text
Total amount wagered × house edge
```

## License

MIT. Three.js is used under its MIT license.

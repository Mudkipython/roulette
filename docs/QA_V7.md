# Roulette Lab v7 QA

## Physics regression

- 1,000 European-wheel rounds
- All 37 labels observed
- Betting closed between 8.63 and 9.70 seconds
- Rounds resolved between 12.45 and 17.75 seconds
- 0 escaped trajectories
- 0 centre penetrations
- 0 safety-timeout resolutions
- 0 unresolved rounds
- Every round contacted a pocket separator
- 533 rounds contacted at least one deflector
- Label-frequency chi-square: 30.45 with 36 degrees of freedom, p = 0.73

The uniformity check does not establish perfect randomness, but it found no evidence of label bias in this regression sample.

## Interface regression

The production bundle was loaded through Chromium DevTools Protocol. The environment could not create a WebGL2 context, so this pass verified the 2D fallback and DOM interface:

- Chinese, English, and French options include visible flags and native language names
- `lang` changes to `en-CA` and `fr-CA`
- `#learn/strategies` opens the strategy chapter instead of returning to the game
- 390 px mobile viewport has no horizontal overflow
- Mobile bottom tabs remain visible
- No non-WebGL runtime errors

## Build and security

- Clean `npm ci` passed
- Vite production build passed
- JavaScript syntax checks passed
- No duplicate HTML IDs
- All 175 `data-i18n` keys are represented in the translation source
- npm production dependency audit: 0 known vulnerabilities

## Environment limitation

Headless Chromium in the build container failed to initialize EGL/SwiftShader, so a live WebGL frame could not be captured here. The 3D renderer’s motion inputs were validated through the independent 1,000-round solver regression, while the browser pass validated the automatic 2D fallback and all requested UI behavior.

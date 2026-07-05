# Princess Green — Phaser Game Rules

## Stack

- Phaser 4 (from game-creator `phaser-2d` template)
- Vite 7, ES modules, JavaScript (not TypeScript for MVP)
- Target design resolution: 1920×1080 logical (adapt via Constants.js + Scale.FIT)

## Architecture (follow game-architecture skill)

- All cross-module communication via `EventBus` with `domain:action` event names
- Global state in `GameState` singleton (`chapter`, `affection`, `flags`, `evolutionLevel`)
- Magic numbers only in `Constants.js`
- Dialogue data in `assets/dialogues/*.json` — never hardcode dialogue in scenes

## Scene naming

- `BootScene`, `MenuScene`, `SwampScene`, `CastleScene`, `PrincessScene`
- Chapter transitions use camera fade + title overlay (350ms default from `TRANSITION.FADE_DURATION`)

## MVP scope

- Warrior chapter: swamp exploration + castle climax + kiss reversal
- Princess chapter: slow frog movement, jump, tongue attack, end screen
- Defer: full 5–8 scenes, 3 companions, evolution tree, multiple endings, watercolor art

## Code style

- Comments in English
- Match existing game-creator patterns in `src/core/` and `src/scenes/`
- Prefer extending template entities over rewriting architecture

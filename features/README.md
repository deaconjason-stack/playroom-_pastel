# Pastel Flap — Playroom game 33

An original, pastel-colored bird-and-obstacles game, inspired by the general tap-to-fly arcade genre. Not affiliated with any other game's publisher.

## What it does
- Tap, press Space / Up, or use the on-screen flap button to fly.
- Three modes: Cozy, Classic, Zippy.
- Endless rounds (no time limit); scores increase for each obstacle passed.
- Pause/resume; automatically pauses if the page becomes hidden.
- Playroom's existing FX toggle controls sounds, and music controls are unchanged.
- Calls the existing Playroom `finish("pastel-flap", ...)` flow for XP, points and highscores.
- Adds a Retro game card and a Playroom Passport collectible sticker.

## Live website
https://playroom-pastel-arcade.vercel.app/

## Files in this branch
- `features/pastel-flap.js` and `features/pastel-flap.css`: isolated original game source.
- `releases/playroom-33-games.html`: deployed 33-game HTML release snapshot; its Flap code and CSS are embedded to avoid changing existing production assets.

**Deployment note:** The Vercel project is currently deployed from source uploads, not from this GitHub branch. This repository did not contain the existing Playroom base-game JavaScript and styles when the feature was added, so the release HTML snapshot alone is **not a standalone GitHub Pages deployment**. The live site keeps its eight existing supporting assets and uses this updated index.

## Safe integration
When the complete Playroom repository is synchronized, merge the source and ensure the new script registers after the base game engine. Add the game to the Retro category and ensure each round awards XP exactly once via `finish`. Preserve all existing games and the saved localStorage rewards keys.

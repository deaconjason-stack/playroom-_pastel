# Playroom Festival

A free, browser-based pastel arcade with 36 games, optional original music and effects, local rewards, avatars, collectible stickers, skill stars, and three-game adventure trails.

Live site: https://playroom-pastel-arcade.vercel.app/

The Festival adds Pocket Pinball, Glow Air Hockey (computer or local two-player), Sky Hop, and Beat Bloom with three original rhythm tracks. All source assets are in `src/`; Vercel serves that directory directly. There are no dependencies or build step.

To run locally:

```sh
python3 -m http.server 8000 --directory src
```

To run the progression, physics, pinball-session, and legacy compatibility checks:

```sh
node --test tests/*.test.cjs
```

Rewards, high scores, favorites, trails, and avatar choices stay in the visitor's browser. The existing reward and high-score storage keys are preserved. Clearing browser storage can remove progress. Music and effects start muted and have independent controls; all audio is generated on the device.

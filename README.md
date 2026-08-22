# ONKI INC. — TRIPLE REALITY

One site, three completely different versions, switchable at any time.

## Run it
Open `ONKI-INC.html` (or `dist/index.html`) in a browser. Everything is self-contained —
no build step, no assets, no server needed. three.js loads from CDN.

## The three realities
1. **ONKI OS 98** — Windows 95/98 skeuomorphic desktop. Draggable/resizable windows,
   Start menu, live taskbar clock, 3D CRT broadcast unit you can drag-rotate,
   aperture-grille CRT post-processing, 8-bit media deck.
2. **ONKI∴NULL** — cinematic black brutalist one-pager. Eyes cursor, dot nav,
   scroll-driven 3D camera (monolith → type ring → TV → handheld → email recursion tunnel),
   bloom + afterimage + RGB shift + film grain, minimal signal-HUD player.
3. **DREAMCORE 2001** — Y2K aqua collage. WebGL cloud sky, liquid chrome, spinning CD,
   glossy XP windows, animated stickers, prism/bloom post FX, CD-DA player.

## Switching
`1` `2` `3` keys, or the REALITY dial bottom-left. Each switch runs its own
transition (channel-static / film-gate tear / bubble wipe).

## Music — ONKI FM
No audio files. A procedural Web Audio engine generates five tracks
(SOMEDAY, FRAGMENTS, ECHO DRIVE, LUCID, DREAMSTATE) from note/pattern data.
Each reality re-voices the same transport with its own instrument profile:
8-bit pulse (OS 98), analog/tape (NULL), supersaw/gloss (2001).
Each reality also has a completely different player UI. `M` toggles playback.

## Mini game
MR. ONKI & DOG — a pixel runner, same engine in three shells
(Game Boy / arcade cabinet / aqua handheld). Space or ↑ to jump, ↓ to duck.

## Dropping in the real projects
Put files in `assets/`, then set `media:` on that project in `PROJECTS`
(`src/js/12-core.js`) — one edit, updates all three realities:

    { media:'assets/otter.mp4', id:'otter', t:"THE OTTER", ... }

`.mp4/.webm/.mov` become autoplaying muted looping video thumbnails,
`.jpg/.png/.webp` become stills, and an empty string falls back to the
animated procedural slot. See `assets/MEDIA.md`. Then `node build.js`.

## Source layout
```
src/shell.html        page skeleton + SVG filter rack
src/css/00-base.css   boot screen, relocator, cursor, transitions
src/css/10-v1.css     ONKI OS 98
src/css/11-v2.css     ONKI∴NULL
src/css/12-v3.css     DREAMCORE 2001
src/html/*            markup per reality
src/js/10-audio.js    ONKI FM engine (tracks + 3 voice profiles)
src/js/11-game.js     Mr. Onki runner
src/js/12-core.js     content data, boot, router, cursor, fullscreen post-FX shader
src/js/13-worlds.js   window manager, 3 players, section logic
src/js/20-three.js    three.js scenes + EffectComposer chains
build.js              concatenates src/ -> dist/index.html   (node build.js)
```

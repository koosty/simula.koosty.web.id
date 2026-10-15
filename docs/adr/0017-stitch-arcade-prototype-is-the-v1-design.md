# The Stitch arcade prototype is the v1.0.0 design

Supersedes `0015` for the palette values and `0016` for the layout. The rest of `0015` and `0016` still holds: the palette lives in `src/lib/theme.ts`, the printable sheet is unchanged, and the simulation frame height logic (`0005`) is kept.

## Decision

- The Stitch project "EduArcade Simulator Hub" (design system "Neo-Arcade STEM") is the design for v1.0.0. It is a prototype to build from, not only a reference.
- Palette values come from the Stitch design system: background `#12131d`, surface scale `#0c0d17` to `#33343f`, outline `#849495` and `#3b494b`, primary `#dbfcff` with container `#00f0ff`, secondary container `#ff4a8d`, tertiary container `#f3db00`.
- The site header is an arcade bar: logo, subject tabs in uppercase, and a sound toggle. Tabs follow the catalogue subjects.
- The home page opens with an eyebrow chip, a large uppercase heading, an insert-coin button, and stat cards.
- The catalogue and class pages use card grids. A card has a coloured top bar, a preview area, and a difficulty or subject label.
- Simulation pages use the workspace frame from the Stitch screens: a status strip above the simulation, and the simulation in the main area.
- Icons are inline SVG. Images are inline SVG or files in `public/`. Nothing is loaded from Google or other hosts, as the standalone rule requires.

## What is not copied from the prototype

- Figures that look like live game data are not shown: credits, tokens, high score, streak, "1,842 online", "124,590x", and the leaderboard. The site has no account, score, or server, so these numbers would be made up for a student.
- The Stitch Tailwind CDN script is not used. The styles are written by hand against the tokens, so the site keeps its no-hardcoded-colour checks.

## Consequences

- `TOKENS` in `src/lib/theme.ts` changes to the Stitch values. Each simulation's `:root` block is written from the same values (`docs/adr/0015`).
- The layout tests that pin class names keep their names. Tests that pinned exact colours or the old layout are updated only where they break on the new values.
- The printable sheet keeps its plain layout (`docs/adr/0008`).

# The site and simulations use the Neo-Arcade STEM palette

Supersedes `0010` for the palette. The rest of `0010` still holds: tokens are written as literal values in one place, and a page writes `var(--text-muted)` rather than a value.

## Decision

The site and all 71 simulations use one design system, Neo-Arcade STEM:

- Dark base `#0b0c16`, card surface `#1a1b32`.
- Cyan `#00f0ff` is the accent and the link colour. It is used for actions, not for long text.
- Magenta `#ff4a8d` is the error colour, yellow `#ffe600` the warning colour, lime `#39ff14` the success colour.
- Fonts: Plus Jakarta Sans for body text, Space Grotesk for headings, JetBrains Mono for numbers and code.

The fonts are self-hosted in `public/fonts/` and loaded from `/fonts/fonts.css`. Nothing loads a font from an external host.

## Why the old rule goes

`0010` kept the site's chrome apart from the simulations on purpose, so a visible edge would sit around an embedded simulation. The owner has now chosen one design system for both. The base colour is the same on both, so no edge needs to be drawn.

## What still holds

- Every text role meets 4.5:1 on both surfaces. `test/theme.test.ts` checks this from `TOKENS`.
- The accent is not a text role. The test checks the role list, not a number.
- The printable sheet keeps its own print values, as before.

## Consequences

- Each of the 71 simulations has the same `:root` values. Their `[data-theme="light"]` blocks are removed. No script or preference selected them, so they were dead code.
- Canvas drawings in simulations use the hex values directly, because canvas cannot read `var(--token)`. A palette change means editing those values too.
- Object colours inside 3D scenes are scene assets and are not part of the palette.
- Simulations still load KaTeX, marked, highlight.js and three.js from cdnjs and unpkg. This decision does not change that.
- The skill files in `simula-w` still describe the old palette. They need their own update.

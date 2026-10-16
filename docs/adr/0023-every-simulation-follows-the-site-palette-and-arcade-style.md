# Every simulation follows the site palette and arcade style

Amends `0017` and `0019`. Builds on `0020` (full-width frame) and `0022` (Lucide icons). `0005` and `0021` are unchanged.

## Decision

- All 71 simulations have a dark token block and a light one, in `:root[data-theme='light']` and in `@media (prefers-color-scheme: light)`. The site writes its choice onto the frame (`attachThemeSync`), so each simulation follows the header switch.
- No simulation sets `data-theme` on its `<html>`. The site's choice, or the system setting, decides the palette.
- Buttons use the site shape: Space Grotesk, weight 700, uppercase, `--radius-lg`, a keycap base shadow that sinks on press, and a glow on the primary action.
- Arcade styling is applied where the element exists: LED dot on panel headings, grid and glow on a stage, glow on readout boxes and on selected choices at 40%, drop-shadow on markers and traces in SVG. Reduced motion turns off button transitions.
- The start and reset buttons carry a Lucide icon (`play`, `rotate-ccw`) beside their label. Other buttons have no icon.
- Two columns from a frame width of 760px where a simulation has a stage or canvas and a separate control panel. Simulations with no such pair stay in one column.
- The light palette's success colour is `#047857`, not `#059669`. The lighter green gave 3.77:1 on white for heading text.
- A simulation whose markup does not fit a step skips that step. It is not restructured to fit.

## Why

- The publish pipeline copies each simulation verbatim from `courses/` into `simulations/` (`scripts/publish-batch.mjs`; see `0026`). Users asked for one look across the catalog, and the dark-only palette made the light site look like two products.
- Contrast was checked in both modes in a real browser for all 71 pages. Six pages failed on one token, which was then fixed.

## Consequences

- These edits are made directly in the simulation files under `simulations/`. A new publish from `courses/` replaces them. The generator's template must receive the same changes, or the next publish will reverse this work. Rule `0026` makes the fix for any new simulation belong in `courses/<slug>/scenes/`.
- Each simulation now has about 90 more CSS lines. The Angka Bulat file remains the reference.
- Canvas drawing is unchanged. Where a canvas paints its own opaque background, the stage grid is hidden behind it. That is accepted, because changing the canvas would change the simulation logic.

# The simulation page places an information column beside the frame

Superseded by `0020` for the layout. The information column described below is removed, and the frame takes the page width.

Refines `0005` for layout only. The frame, its measurement and its tab order are unchanged.

## Decision

- On a screen 1200px wide or more, the Halaman Simulasi shows the frame in a wide column (two fifths of the content width, as `2fr` against `1fr`) and an information column beside it.
- The information column holds the catalogue description and the related simulations. It uses only fields the catalogue already holds: no learning goals or instructions are written by hand.
- Below 1200px the information column moves under the frame, so the frame keeps the full width of a phone or a narrow window.
- The simulation files are not changed. Their markup, css and scripts are the tool's output (`0005`), and the layout is owned by `src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro`.
- The document order stays breadcrumb, frame, new-tab link, information column. The grid does not reorder anything, so the breadcrumb is reached before the frame and the new-tab link is reached after it.

## Why not change the simulation files

Changing the layout inside each simulation means editing 71 files that the publishing tool copies verbatim (`scripts/publish-batch.mjs`), so a republish would undo the change. It would also need the generator skill to change, and a regenerated scene is not identical to the one before. A layout in the page wrapper survives both.

## Consequences

- The simulation's own controls stay inside the frame. Moving them into the information column needs per-simulation changes, which this decision does not make.
- The frame measures its own width, so a wider frame shows its content at a larger size and may change its measured height. The measurement lifecycle in `0005` already covers a width change.
- The information column adds no content the catalogue lacks. If a simulation later needs its own instructions, that belongs in the catalogue entry, not in the page.

# Icons are Lucide paths drawn as inline SVG

Consistent with `0017`, which says icons are inline SVG. Material Symbols from the Stitch prototype is not used.

## Decision

- Icons come from Lucide (ISC licence). Only the icons in use are copied into `src/lib/icons.ts` as SVG path markup, from `lucide-static`. The package is not a runtime dependency.
- The site renders them with `src/components/Icon.astro`, as inline `<svg>` with `currentColor`. No request leaves the site.
- A simulation is one HTML file with no imports (`0005`). Its icons are pasted into that file as inline `<svg>`, with the same attributes. Angka Bulat is the only simulation with icons so far.
- An icon always sits next to its text, never in place of it. Screen readers get the text, and the icon has `aria-hidden="true"`.

## Why

- Stitch uses Material Symbols, which loads a font from Google Fonts. `0017` forbids that host, and making it self-hosted would add a large font file for about four icons.
- Lucide is one consistent stroke style, is available as SVG, and matches the outline weight of the site's buttons.
- Copying only the paths used keeps the bundle small and needs no build step in the simulations.

## Consequences

- Adding an icon means adding its paths to `src/lib/icons.ts` and checking the licence line still applies. Do not load icons from a CDN.
- Icons from the Stitch screens that need a feature the site does not have (sound, scores, timers) are not copied.
- Each new icon in a simulation is a manual paste, like other simulation edits.

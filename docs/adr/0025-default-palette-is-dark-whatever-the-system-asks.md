# The default palette is dark, whatever the system asks for

Amends `0019`. The rest of `0019` stands: two palettes, the header switch, the stored choice in `localStorage`, and the pre-paint script.

## Decision

- Without a stored choice, the site is dark. The site no longer reads `prefers-color-scheme`.
- The pre-paint script in `src/layouts/Base.astro` always writes `data-theme` on `<html>`: `light` only when the stored choice is `light`, otherwise `dark`. The header button reads the same attribute.
- `themeStylesheet()` no longer emits the `@media (prefers-color-scheme: light)` block.

## Why

- The reader asked for dark as the look of the site. A system set to light used to turn the whole site light without any choice by the reader.
- Simulations follow the attribute (ADR 0023). Because the attribute is always written, a simulation frame follows the site's choice rather than its own system query.

## Consequences

- The 71 simulation files still contain their `@media (prefers-color-scheme: light)` block (ADR 0023). It applies only where a frame's document has no `data-theme`, and the site now always writes one. The block is effectively unused, but removing it means editing the files again.
- Without JavaScript the attribute is never written. The page then uses the dark `:root` palette, but a simulation frame falls back to its own system query, so it can show light while the page is dark.
- A simulation can paint its system palette for a moment before the frame's attribute is copied on `load` (`attachThemeSync` in `src/lib/frame.ts`).

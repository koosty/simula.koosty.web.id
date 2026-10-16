# The site has a light and a dark palette

Extends `0017` for the site chrome. The simulations stay dark and keep the dark palette from `0017`. `0018` is unchanged.

## Decision

- The site has two palettes: the dark one from `0017` and a light one from the Stitch prototype's light screens (Neo-Arcade STEM, light design system).
- The light palette is taken from the light lobby screen's HTML, not from the design system's written guide. The screen uses cyan `#0092ac` and magenta `#b8126b`. The guide lists `#0099b8` and `#c01573`. White text on the guide's cyan is 3.36:1, so the screen's value is used.
- Dark is the default. Without a stored choice, the light palette applies when the system asks for light (`prefers-color-scheme: light`).
- The header has a button that switches between light and dark. It shows the mode it will switch to. The choice is stored in `localStorage` under `theme`, and a stored choice beats the system setting.
- A small inline script in `<head>` applies a stored choice before first paint, so a reader does not see the other palette flash.
- A new token `accentText` is the text colour on the accent. It is `#12131d` in dark and `#0f172a` in light. Text on a filled accent uses it, not `--bg`: `#f8fafc` on the light cyan is 3.68:1, below the 4.5:1 for text.
- Fonts are the same in both palettes: Space Grotesk for headings, Plus Jakarta Sans for body text, and JetBrains Mono for labels, numbers and the tab bar. These match the font roles in both Stitch screens. They are declared once in `Base.astro` as `--font-display`, `--font-body` and `--font-mono`. Before this, `--font-display` and `--font-mono` were never declared, so headings and labels silently used the body face.
- The simulations do not change. They keep the dark values in their own `:root` blocks. In light mode an embedded simulation still shows its dark frame.

## Consequences

- `src/lib/theme.ts` exports `TOKENS` (dark) and `TOKENS_LIGHT`. `themeStylesheet()` writes the dark block as default, the light block under `[data-theme='light']`, and the light block again under the system query when no choice is stored.
- `asHex`, `textSurfaces` and the contrast tests take the palette as a parameter. Every text role, the accent, and the focus ring are checked in both palettes.
- The unused `tokenCustomProperties` is removed.
- Header height on a 375px phone grows from one row to two, because the toggle wraps. The toggle is 44px high, the minimum touch target.

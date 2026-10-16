<details>
<summary>Relevant source files</summary>

The following files were used as context for generating or updating this documentation page:

- [`src/lib/theme.ts`](../../src/lib/theme.ts)
- [`src/layouts/Base.astro`](../../src/layouts/Base.astro)
- [`src/lib/frame.ts`](../../src/lib/frame.ts)
- [`src/components/Sheet.astro`](../../src/components/Sheet.astro)
- [`src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro`](../../src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro)
- [`src/integrations/copySimulations.ts`](../../src/integrations/copySimulations.ts)
- [`test/theme.test.ts`](../../test/theme.test.ts)
- [`test/chrome-built.test.ts`](../../test/chrome-built.test.ts)
- [`docs/adr/0009-chrome-paints-with-the-simulations-palette.md`](../../docs/adr/0009-chrome-paints-with-the-simulations-palette.md)
- [`docs/adr/0010-site-keeps-its-own-dark-palette.md`](../../docs/adr/0010-site-keeps-its-own-dark-palette.md)
- [`docs/adr/0015-neo-arcade-stem-palette.md`](../../docs/adr/0015-neo-arcade-stem-palette.md)
- [`docs/adr/0017-stitch-arcade-prototype-is-the-v1-design.md`](../../docs/adr/0017-stitch-arcade-prototype-is-the-v1-design.md)
- [`docs/adr/0019-site-has-a-light-and-a-dark-palette.md`](../../docs/adr/0019-site-has-a-light-and-a-dark-palette.md)
- [`docs/adr/0023-every-simulation-follows-the-site-palette-and-arcade-style.md`](../../docs/adr/0023-every-simulation-follows-the-site-palette-and-arcade-style.md)
- [`simulations/lower-secondary/grade-7/matematika/angka-bulat-dan-garis-bilangan.html`](../../simulations/lower-secondary/grade-7/matematika/angka-bulat-dan-garis-bilangan.html)
- [`CONTEXT.md`](../../CONTEXT.md)
</details>

# Site Theming

The site's colours are declared once in `src/lib/theme.ts` and emitted into every page as CSS custom properties. A page writes `var(--text-muted)` and never a literal. `CONTEXT.md` names this set **Palet** and warns against calling it a theme, colour scheme, skin or design tokens.

There are two palettes, dark and light (ADR 0019). The token names are the same in both, so a component writes one token and gets the right value for the reader's choice. The dark palette is the default. Every simulation under `simulations/` also carries both palettes under the same token names (ADR 0023).

Sources: [CONTEXT.md](../../CONTEXT.md), [src/lib/theme.ts:1-9](../../src/lib/theme.ts), [src/layouts/Base.astro:36](../../src/layouts/Base.astro)

## Tokens

`TOKENS` is the dark palette. It is the default, and the palette each simulation writes into its own `:root` block by hand.

```ts
export const TOKENS: Palette = {
  bg: '#12131d',
  surface: '#1a1b25',
  panel: '#1e1f2a',
  border: '#3b494b',
  borderStrong: '#849495',
  text: '#e2e1f0',
  textMuted: '#b9cacb',
  textDim: '#849495',
  link: '#00f0ff',
  linkHover: '#dbfcff',
  accent: '#00f0ff',
  accentText: '#12131d',
  secondary: '#ff4a8d',
  tertiary: '#f3db00',
  focusRing: '#00f0ff',
  radius: '8px',
  radiusSmall: '4px',
} as const satisfies Palette;
```

Sources: [src/lib/theme.ts:61-86](../../src/lib/theme.ts)

`TOKENS_LIGHT` has the same names. It is taken from the Stitch lobby's light screen (ADR 0019).

```ts
export const TOKENS_LIGHT: Palette = {
  bg: '#f8fafc',
  surface: '#ffffff',
  panel: '#f1f5f9',
  border: '#cbd5e1',
  borderStrong: '#475569',
  text: '#0f172a',
  textMuted: '#334155',
  textDim: '#64748b',
  link: '#00657a',
  linkHover: '#004e5f',
  accent: '#0092ac',
  accentText: '#0f172a',
  secondary: '#b8126b',
  tertiary: '#d97706',
  focusRing: '#0092ac',
  radius: '8px',
  radiusSmall: '4px',
} as const satisfies Palette;
```

Sources: [src/lib/theme.ts:88-114](../../src/lib/theme.ts)

| Token | Type | Role |
|---|---|---|
| `bg` | Surface | Page background. The simulation frame is painted with it too. |
| `surface` | Surface | Card, panel and header background. |
| `panel` | Translucent | Never a checked surface; what it resolves to depends on what is beneath. |
| `border`, `borderStrong` | Line | Card edges; `borderStrong` is the header rule and the outline of buttons and the theme switch. |
| `text`, `textMuted`, `textDim` | Foreground | Body text at three emphases. |
| `link`, `linkHover` | Foreground | Anchors. |
| `accent` | Non-text | Current tab fill, the main call to action, and the lit top edge of cards. Not one of the text roles the tests check. |
| `accentText` | Foreground on accent | Text on a filled accent: the current tab and the main call to action. |
| `secondary` | Non-text | Hover outline of tabs and the switch, the outline and text of the eyebrow label, and the dot in the logo. |
| `tertiary` | Non-text | The left edge of the status strip on a simulation page. |
| `focusRing` | Non-text | `:focus-visible` outline. |
| `radius`, `radiusSmall` | Dimension | Corner radii. |

The type system splits the set three ways: `OpaqueToken` is what contrast arithmetic can be handed, `SurfaceToken` is what a page paints as a background, and `ForegroundToken` is what a page draws on a surface.

Sources: [src/lib/theme.ts:22-56](../../src/lib/theme.ts), [src/layouts/Base.astro:254-259](../../src/layouts/Base.astro), [src/pages/index.astro:178-189](../../src/pages/index.astro), [src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro:157-169](../../src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro)

Fonts are not part of the palette. They are declared once in `src/layouts/Base.astro` as `--font-display` (Space Grotesk, headings), `--font-body` (Plus Jakarta Sans, body) and `--font-mono` (JetBrains Mono, labels, numbers and tabs). The font files are self-hosted under `public/fonts/` and loaded by `/fonts/fonts.css` (ADR 0021 allows CDN libraries for simulations only; the site loads its own fonts).

Sources: [src/layouts/Base.astro:46](../../src/layouts/Base.astro), [src/layouts/Base.astro:122-131](../../src/layouts/Base.astro), [docs/adr/0017-stitch-arcade-prototype-is-the-v1-design.md](../../docs/adr/0017-stitch-arcade-prototype-is-the-v1-design.md)

## Choosing a palette

`themeStylesheet()` writes every palette rule the site needs into `<head>`:

- The dark block on `:root, [data-theme='dark']`, with `color-scheme: dark`.
- The light block on `[data-theme='light']`, with `color-scheme: light`.
- The light block again under `@media (prefers-color-scheme: light)`, on `:root:not([data-theme='dark'])`.

So a reader with no stored choice gets the palette their system asks for, and the default is dark when the system asks for nothing. The header button sets `data-theme` on `<html>` and stores the choice in `localStorage` under `theme`. A stored choice beats the system setting. An inline script in `<head>` applies a stored choice before first paint.

The button shows the mode it will switch to: "Mode gelap" while the page is light, "Mode terang" while it is dark. The icon matches the label: a flashlight for "Mode terang", a flashlight-off for "Mode gelap" (ADR 0022).

Sources: [src/lib/theme.ts:140-151](../../src/lib/theme.ts), [src/layouts/Base.astro:38-45](../../src/layouts/Base.astro), [src/layouts/Base.astro:80-84](../../src/layouts/Base.astro), [src/layouts/Base.astro:87-112](../../src/layouts/Base.astro)

## Why the palette changed

ADR 0015 replaced the palette that ADR 0010 set. ADR 0017 then set the dark values to the Stitch prototype's: a background of `#12131d`, a surface scale from `#0c0d17` to `#33343f`, and the cyan, pink and yellow accents. ADR 0019 adds the light palette and the switch.

Before ADR 0023, the simulations had only the dark palette, so an embedded simulation was dark even on a light page. ADR 0023 gave all 71 simulations their own light and dark blocks and the same arcade styling, and `attachThemeSync` in `src/lib/frame.ts` copies the header's choice onto the frame's document, so the frame follows the header switch.

Sources: [docs/adr/0015-neo-arcade-stem-palette.md](../../docs/adr/0015-neo-arcade-stem-palette.md), [docs/adr/0017-stitch-arcade-prototype-is-the-v1-design.md](../../docs/adr/0017-stitch-arcade-prototype-is-the-v1-design.md), [docs/adr/0019-site-has-a-light-and-a-dark-palette.md](../../docs/adr/0019-site-has-a-light-and-a-dark-palette.md), [docs/adr/0023-every-simulation-follows-the-site-palette-and-arcade-style.md](../../docs/adr/0023-every-simulation-follows-the-site-palette-and-arcade-style.md), [src/lib/frame.ts:130-156](../../src/lib/frame.ts)

The token *names* in the simulations are their own: `--bg`, `--surface`, `--text-muted`. The site uses the same names, so the same rule reads the same way on both sides.

Sources: [simulations/lower-secondary/grade-7/matematika/angka-bulat-dan-garis-bilangan.html](../../simulations/lower-secondary/grade-7/matematika/angka-bulat-dan-garis-bilangan.html), [src/lib/theme.ts:61-66](../../src/lib/theme.ts)

## Emitting the palette

```ts
export function themeCustomProperties(tokens: Palette = TOKENS, selector = ':root'): string {
  const declarations = Object.entries(tokens)
    .map(([name, value]) => `  --${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value};`)
    .join('\n');
  return `${selector} {\n${declarations}\n}`;
}
```

Sources: [src/lib/theme.ts:116-127](../../src/lib/theme.ts)

`themeCustomProperties` writes one block for one palette under one selector. `themeStylesheet` combines the blocks for both palettes and the system query. The layout calls `themeStylesheet` through `set:html`, because an Astro `<style>` block is not a template expression site.

Sources: [src/lib/theme.ts:129-151](../../src/lib/theme.ts), [src/layouts/Base.astro:30-36](../../src/layouts/Base.astro)

## Contrast arithmetic

The module holds the maths so a new colour can be checked against the ratio its use needs before it reaches a page.

| Export | Value or behaviour |
|---|---|
| `AA_NORMAL_TEXT` | `4.5` |
| `AA_NON_TEXT` | `3` |
| `isHexColour` | Accepts `#rgb` and `#rrggbb`, case-insensitive. |
| `asHex(token, palette?)` | Narrows an `OpaqueToken` to a colour the maths can read; throws otherwise. Defaults to the dark palette. |
| `relativeLuminance` | WCAG 2.1 luminance from 0 to 1. |
| `contrastRatio` | `(lighter + 0.05) / (darker + 0.05)` |
| `ratioRequiredFor` | Returns `AA_NORMAL_TEXT` for `text`, `textMuted`, `textDim` and `link`; throws on any other role. |
| `textSurfaces(palette?)` | `bg` and `surface`. The first list to update when a new surface is introduced. |
| `surfaceTokens()`, `foregroundTokens()` | The checked sets. `panel` is absent from the surfaces. |

Sources: [src/lib/theme.ts:161-162](../../src/lib/theme.ts), [src/lib/theme.ts:170-172](../../src/lib/theme.ts), [src/lib/theme.ts:181-187](../../src/lib/theme.ts), [src/lib/theme.ts:212-215](../../src/lib/theme.ts), [src/lib/theme.ts:223-227](../../src/lib/theme.ts), [src/lib/theme.ts:236-246](../../src/lib/theme.ts), [src/lib/theme.ts:254-259](../../src/lib/theme.ts), [src/lib/theme.ts:269-274](../../src/lib/theme.ts)

There is no large-text bar: the chrome uses large type only for the page's own `h1`, and the relaxed 3:1 would let a colour through that reads as washed out on the dark surfaces. One bar, met by everything, is the simpler rule and the stricter outcome.

A link is held to the text bar rather than the component bar: it is text, read at body size, and judging it as a UI element would let 3:1 body text through.

`panel` is excluded from contrast checks because it is translucent, so what it resolves to depends on the surface beneath it and a ratio for it would be a guess.

The accent is a non-text colour. Text on a filled accent uses `accentText`: the dark background value (`#12131d`) on the dark palette, and the dark text value (`#0f172a`) on the light one. The design guide's cyan (`#0099b8`) gives white text 3.36:1, which is why the light palette uses the screen's `#0092ac` with dark text on it.

Sources: [src/lib/theme.ts:88-95](../../src/lib/theme.ts), [src/lib/theme.ts:80](../../src/lib/theme.ts), [src/lib/theme.ts:108](../../src/lib/theme.ts)

## Where the palette is overridden

The printable sheet replaces the palette for print only, with its own literal black-on-white values rather than tokens, because the printed page has no dark background to inherit.

Sources: [src/components/Sheet.astro](../../src/components/Sheet.astro)

The Halaman Simulasi's frame uses `var(--border)`, `var(--radius)` and `var(--bg)` for its box, `var(--focus-ring)` for its focus outline, and `var(--tertiary)` on the status strip above it.

Sources: [src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro:157-169](../../src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro), [src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro:185-196](../../src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro), [src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro:213-216](../../src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro)

## Tests

- [`test/theme.test.ts`](../../test/theme.test.ts) checks the palette's roles, the accent and the focus ring against the ratio their use needs, for both palettes, and checks that `themeCustomProperties` writes the light palette for a reader who chose it or whose system asks for it.
- [`test/chrome-built.test.ts`](../../test/chrome-built.test.ts) reads the built pages and confirms they carry palette values rather than literals. The palette blocks are exempt.

Sources: [test/theme.test.ts:19-63](../../test/theme.test.ts), [test/theme.test.ts:181-206](../../test/theme.test.ts), [test/chrome-built.test.ts](../../test/chrome-built.test.ts)

## Known gaps

- Simulations load KaTeX, marked, highlight.js and three.js from cdnjs and unpkg, pinned to a version and hashed where the browser allows (`docs/adr/0021`). The palette does not change that.
- The palette checks run on the site's tokens only. The contrast of each simulation's own colours is not checked by `test/theme.test.ts`.
- The simulation files are edited by hand (ADR 0023). The external tool that generates them will overwrite those edits on its next publish unless its template is changed too.

Sources: [docs/adr/0021-simulations-may-load-pinned-cdn-libraries.md](../../docs/adr/0021-simulations-may-load-pinned-cdn-libraries.md), [docs/adr/0023-every-simulation-follows-the-site-palette-and-arcade-style.md](../../docs/adr/0023-every-simulation-follows-the-site-palette-and-arcade-style.md), [test/theme.test.ts](../../test/theme.test.ts)

## Related pages

- [Site Navigation](../features/site-navigation.md)
- [Printable Class Sheet](../features/printable-class-sheet.md)
- [Simulation Page](../features/simulation-page.md)
- [Testing](testing.md)

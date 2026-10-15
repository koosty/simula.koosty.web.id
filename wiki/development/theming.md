<details>
<summary>Relevant source files</summary>

The following files were used as context for generating or updating this documentation page:

- [`src/lib/theme.ts`](../../src/lib/theme.ts)
- [`src/layouts/Base.astro`](../../src/layouts/Base.astro)
- [`src/components/Sheet.astro`](../../src/components/Sheet.astro)
- [`src/pages/index.astro`](../../src/pages/index.astro)
- [`src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro`](../../src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro)
- [`src/integrations/copySimulations.ts`](../../src/integrations/copySimulations.ts)
- [`test/theme.test.ts`](../../test/theme.test.ts)
- [`test/chrome-built.test.ts`](../../test/chrome-built.test.ts)
- [`docs/adr/0009-chrome-paints-with-the-simulations-palette.md`](../../docs/adr/0009-chrome-paints-with-the-simulations-palette.md)
- [`docs/adr/0010-site-keeps-its-own-dark-palette.md`](../../docs/adr/0010-site-keeps-its-own-dark-palette.md)
- [`docs/adr/0017-stitch-arcade-prototype-is-the-v1-design.md`](../../docs/adr/0017-stitch-arcade-prototype-is-the-v1-design.md)
- [`docs/adr/0019-site-has-a-light-and-a-dark-palette.md`](../../docs/adr/0019-site-has-a-light-and-a-dark-palette.md)
- [`CONTEXT.md`](../../CONTEXT.md)
</details>

# Site Theming

The site's colours are declared once in `src/lib/theme.ts` and emitted into every page as CSS custom properties. A page writes `var(--text-muted)` and never a literal. `CONTEXT.md` names this set **Palet** and warns against calling it a theme, colour scheme, skin or design tokens.

There are two palettes, dark and light (ADR 0019). The names are the same in both, so a component writes one token and gets the right value for the reader's choice.

Sources: [CONTEXT.md](../../CONTEXT.md), [src/layouts/Base.astro](../../src/layouts/Base.astro)

## Tokens

`TOKENS` is the dark palette. It is the default and the palette the simulations write into their own `:root` blocks by hand.

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

| Token | Type | Role |
|---|---|---|
| `bg` | Surface | Page background. |
| `surface` | Surface | Card and panel background. |
| `panel` | Translucent | Never a checked surface; what it resolves to depends on what is beneath. |
| `border`, `borderStrong` | Line | Card edges; `borderStrong` is also the header rule and input outlines. |
| `text`, `textMuted`, `textDim` | Foreground | Body text at three emphases. |
| `link`, `linkHover` | Foreground | Anchors. |
| `accent` | Non-text | Featured rule, filled active tab, focus outline. Never running text. |
| `accentText` | Foreground on accent | Text on a filled accent, such as the active tab and the insert-coin button. |
| `focusRing` | Non-text | `:focus-visible` outline. |
| `radius`, `radiusSmall` | Dimension | Corner radii. |

The type system splits the set three ways: `OpaqueToken` is what contrast arithmetic can be handed, `SurfaceToken` is what a page paints as a background, and `ForegroundToken` is what a page draws on a surface.

Sources: [src/lib/theme.ts](../../src/lib/theme.ts)

## Choosing a palette

`themeStylesheet()` writes the whole rule set into `<head>`:

- The dark block on `:root` and `[data-theme='dark']`.
- The light block on `[data-theme='light']`.
- The light block again under `@media (prefers-color-scheme: light)`, on `:root:not([data-theme='dark'])`.

So a reader with no stored choice gets the palette their system asks for. The header button sets `data-theme` on `<html>` and stores the choice in `localStorage` under `theme`. A stored choice beats the system setting. An inline script in `<head>` applies a stored choice before first paint.

The button shows the mode it will switch to: "Mode gelap" while the page is light, "Mode terang" while it is dark.

Sources: [src/lib/theme.ts](../../src/lib/theme.ts), [src/layouts/Base.astro](../../src/layouts/Base.astro)

## Why the palette changed

ADR 0015 replaced the palette that ADR 0010 set. ADR 0017 then set the dark values to the Stitch prototype's: a background of `#12131d`, a surface scale from `#0c0d17` to `#33343f`, and the cyan, pink and yellow accents. ADR 0019 adds the light palette and the switch.

The site and the simulations share the dark palette, so an embedded simulation has no visible edge against the dark page. A simulation stays dark even on a light page. This is a known gap, and simulations are not changed in this step.

Sources: [docs/adr/0015-neo-arcade-stem-palette.md](../../docs/adr/0015-neo-arcade-stem-palette.md), [docs/adr/0017-stitch-arcade-prototype-is-the-v1-design.md](../../docs/adr/0017-stitch-arcade-prototype-is-the-v1-design.md), [docs/adr/0019-site-has-a-light-and-a-dark-palette.md](../../docs/adr/0019-site-has-a-light-and-a-dark-palette.md)

The token *names* are still the simulations' own: `--bg`, `--surface`, `--text-muted`.

## Emitting the palette

```ts
export function themeCustomProperties(tokens: Palette = TOKENS, selector = ':root'): string {
  const declarations = Object.entries(tokens)
    .map(([name, value]) => `  --${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value};`)
    .join('\n');
  return `${selector} {\n${declarations}\n}`;
}
```

`themeCustomProperties` writes one block. `themeStylesheet` combines the blocks for both palettes and the system query. The layout calls `themeStylesheet` through `set:html`, because an Astro `<style>` block is not a template expression site.

Sources: [src/lib/theme.ts](../../src/lib/theme.ts), [src/layouts/Base.astro](../../src/layouts/Base.astro)

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

Every test in `test/theme.test.ts` runs against both palettes.

There is no large-text bar: the chrome uses large type only for the page's own `h1`, and the relaxed 3:1 would let a colour through that reads as washed out on the dark surfaces. One bar, met by everything, is the simpler rule and the stricter outcome.

A link is held to the text bar rather than the component bar: it is text, read at body size, and judging it as a UI element would let 3:1 body text through — the fault this palette exists to close.

`panel` is excluded from contrast checks because it is translucent, so what it resolves to depends on the surface beneath it and a ratio for it would be a guess.

The accent is a non-text colour. It is used for the featured rule, borders and the focus outline. Text on a filled accent uses `accentText`, which is `--bg` on the dark palette and a dark slate on the light one.

Sources: [src/lib/theme.ts](../../src/lib/theme.ts), [docs/adr/0010-site-keeps-its-own-dark-palette.md](../../docs/adr/0010-site-keeps-its-own-dark-palette.md)

## Where the palette is overridden

The printable sheet replaces the palette for print only, with its own literal black-on-white values rather than tokens, because the printed page has no dark background to inherit.

Sources: [src/components/Sheet.astro](../../src/components/Sheet.astro)

The Halaman Simulasi's frame uses `var(--border)`, `var(--radius)`, `var(--bg)` and `var(--focus-ring)`.

Sources: [src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro](../../src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro)

## Tests

- [`test/theme.test.ts`](../../test/theme.test.ts) checks every text role, the accent, and the focus ring against the ratio their use needs, for both palettes.
- [`test/chrome-built.test.ts`](../../test/chrome-built.test.ts) reads the built pages and confirms they carry palette values rather than literals. The palette blocks are exempt.

Sources: [test/theme.test.ts](../../test/theme.test.ts), [test/chrome-built.test.ts](../../test/chrome-built.test.ts)

## Known gaps

- Simulations still load KaTeX, marked, highlight.js and three.js from cdnjs and unpkg. The palette does not change that.
- Simulations have no light palette. In light mode, an embedded simulation shows its dark frame.
- Fonts: the light design guide uses Space Grotesk for body text, while the site uses Plus Jakarta Sans for body text in both palettes. Not changed in this step.

## Related pages

- [Site Navigation](../features/site-navigation.md)
- [Printable Class Sheet](../features/printable-class-sheet.md)
- [Simulation Page](../features/simulation-page.md)
- [Testing](testing.md)

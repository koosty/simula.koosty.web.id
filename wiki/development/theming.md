<details>
<summary>Relevant source files</summary>

The following files were used as context for generating or updating this documentation page:

- [`src/lib/theme.ts`](../../src/lib/theme.ts)
- [`src/layouts/Base.astro`](../../src/layouts/Base.astro)
- [`src/components/Sheet.astro`](../../src/components/Sheet.astro)
- [`src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro`](../../src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro)
- [`src/integrations/copySimulations.ts`](../../src/integrations/copySimulations.ts)
- [`test/theme.test.ts`](../../test/theme.test.ts)
- [`test/chrome-built.test.ts`](../../test/chrome-built.test.ts)
- [`docs/adr/0009-chrome-paints-with-the-simulations-palette.md`](../../docs/adr/0009-chrome-paints-with-the-simulations-palette.md)
- [`docs/adr/0010-site-keeps-its-own-dark-palette.md`](../../docs/adr/0010-site-keeps-its-own-dark-palette.md)
- [`CONTEXT.md`](../../CONTEXT.md)
</details>

# Site Theming

The site's colours are declared once in `src/lib/theme.ts` and emitted into every page as CSS custom properties. A page writes `var(--text-muted)` and never a literal. `CONTEXT.md` names this set **Palet** and warns against calling it a theme, colour scheme, skin or design tokens.

Sources: [CONTEXT.md:43-45](), [src/layouts/Base.astro:35]()

## Tokens

```ts
export const TOKENS: Record<TokenName, string> = {
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
  focusRing: '#00f0ff',
  radius: '8px',
  radiusSmall: '4px',
} as const satisfies Record<TokenName, string>;
```

Sources: [src/lib/theme.ts:63-78]()

| Token | Type | Role |
|---|---|---|
| `bg` | Surface | Page background. |
| `surface` | Surface | Card and panel background. |
| `panel` | Translucent | Never a checked surface; what it resolves to depends on what is beneath. |
| `border`, `borderStrong` | Line | Card edges. |
| `text`, `textMuted`, `textDim` | Foreground | Body text at three emphases. |
| `link`, `linkHover` | Foreground | Anchors. |
| `accent` | Non-text | Featured rule, borders, focus outline. Never running text. |
| `focusRing` | Non-text | `:focus-visible` outline. |
| `radius`, `radiusSmall` | Dimension | Corner radii. |

Sources: [src/lib/theme.ts:15-40](), [src/lib/theme.ts:50-60](), [docs/adr/0010-site-keeps-its-own-dark-palette.md:17-21]()

The type system splits the set three ways: `OpaqueToken` is what contrast arithmetic can be handed, `SurfaceToken` is what a page paints a background, and `ForegroundToken` is what a page draws on a surface.

Sources: [src/lib/theme.ts:42-60]()

## Why the palette changed

ADR 0015 replaces the palette that ADR 0010 set. The site and the simulations share one palette (Neo-Arcade STEM), so an embedded simulation has no visible edge against the page. ADR 0017 then sets the values to the Stitch prototype's: a background of `#12131d`, a surface scale from `#0c0d17` to `#33343f`, and the cyan, pink and yellow accents. Fonts are self-hosted from `public/fonts/`.

Sources: [docs/adr/0015-neo-arcade-stem-palette.md:1-30](), [docs/adr/0017-stitch-arcade-prototype-is-the-v1-design.md:1-20]()

The token *names* are still the simulations' own: `--bg`, `--surface`, `--text-muted`.

Sources: [src/lib/theme.ts:227-233](), [CONTEXT.md:43-45]()

## Emitting the palette

```ts
export function themeCustomProperties(
  tokens: Record<TokenName, string> = TOKENS,
  selector = ':root',
): string {
  const declarations = Object.entries(tokens)
    .map(([name, value]) => `  --${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value};`)
    .join('\n');
  return `${selector} {\n${declarations}\n}`;
}
```

Sources: [src/lib/theme.ts:92-100]()

The function takes a selector as well as a token map. There is one theme today: the simulations are hardcoded dark and nothing selects a light block, so none is emitted.

Sources: [src/lib/theme.ts:77-90](), [README.md:53-61]()

The layout calls it through `set:html`, because an Astro `<style>` block is not a template expression site.

Sources: [src/layouts/Base.astro:29-35]()

## Contrast arithmetic

The module holds the maths so a new colour can be checked against the ratio its use needs before it reaches a page.

Sources: [README.md:61-62](), [src/lib/theme.ts:1-8]()

| Export | Value or behaviour | Sources |
|---|---|---|
| `AA_NORMAL_TEXT` | `4.5` | [src/lib/theme.ts:110]() |
| `AA_NON_TEXT` | `3` | [src/lib/theme.ts:111]() |
| `isHexColour` | Accepts `#rgb` and `#rrggbb`, case-insensitive. | [src/lib/theme.ts:115-117]() |
| `asHex` | Narrows an `OpaqueToken` to a colour the maths can read; throws otherwise. | [src/lib/theme.ts:122-133]() |
| `relativeLuminance` | WCAG 2.1 luminance from 0 to 1. | [src/lib/theme.ts:161-164]() |
| `contrastRatio` | `(lighter + 0.05) / (darker + 0.05)` | [src/lib/theme.ts:170-175]() |
| `ratioRequiredFor` | Returns `AA_NORMAL_TEXT` for `text`, `textMuted`, `textDim` and `link`; throws on any other role. | [src/lib/theme.ts:185-195]() |
| `textSurfaces()` | `bg` and `surface`. The first list to update when a new surface is introduced. | [src/lib/theme.ts:203-208]() |
| `surfaceTokens()`, `foregroundTokens()` | The checked sets. `panel` is absent from the surfaces. | [src/lib/theme.ts:218-225]() |

There is no large-text bar: the chrome uses large type only for the page's own `h1`, and the relaxed 3:1 would let a colour through that reads as washed out on the dark surfaces. One bar, met by everything, is the simpler rule and the stricter outcome.

Sources: [src/lib/theme.ts:102-109]()

A link is held to the text bar rather than the component bar: it is text, read at body size, and judging it as a UI element would let 3:1 body text through — the fault this palette exists to close.

Sources: [src/lib/theme.ts:177-184]()

`panel` is excluded from contrast checks because it is translucent, so what it resolves to depends on the surface beneath it and a ratio for it would be a guess.

Sources: [src/lib/theme.ts:50-60](), [src/lib/theme.ts:210-220]()

The accent is a non-text colour. It is used for the featured rule, borders and the focus outline, not for running text.

Sources: [docs/adr/0010-site-keeps-its-own-dark-palette.md:19-21](), [src/integrations/copySimulations.ts:23-38]()

## Where the palette is overridden

The printable sheet replaces the dark palette for print only, with its own literal black-on-white values rather than tokens, because the printed page has no dark background to inherit.

Sources: [src/components/Sheet.astro:153-167]()

The Halaman Simulasi's frame uses `var(--border)`, `var(--radius)`, `var(--bg)` and `var(--focus-ring)`.

Sources: [src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro:169-194]()

## Tests

- [`test/theme.test.ts`](../../test/theme.test.ts) — checks every text role against the ratio its use needs, reading the tokens through `asHex`.
- [`test/chrome-built.test.ts`](../../test/chrome-built.test.ts) — reads the built pages and confirms they carry palette values rather than literals.

Sources: [src/lib/theme.ts:126-133](), [test/chrome-built.test.ts:1-12]()

## Known gaps

- Simulations still load KaTeX, marked, highlight.js and three.js from cdnjs and unpkg. The palette does not change that.

## Related pages

- [Site Navigation](../features/site-navigation.md)
- [Printable Class Sheet](../features/printable-class-sheet.md)
- [Simulation Page](../features/simulation-page.md)
- [Testing](testing.md)

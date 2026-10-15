/**
 * The site's palettes, and the arithmetic that holds them readable.
 *
 * Two palettes from the Neo-Arcade STEM design system in the Stitch prototype
 * (docs/adr/0017, docs/adr/0019). The dark one is the default and the one the
 * simulations use, so an embedded simulation and the page around it share one
 * surface. The light one is for the rest of the site. The test suite checks
 * every text role against the ratio its use needs, in both palettes.
 */

/** A colour this module can do contrast arithmetic on. */
export type HexColour = `#${string}`;

/**
 * The roles a colour can play, which is what decides the ratio it must meet.
 *
 * Some are translucent, because the simulations declare their borders that way
 * and a border that matches exactly is what keeps a card edge from reading as a
 * seam. Anything used as a foreground is opaque: contrast cannot be computed
 * for a colour whose backdrop it does not know.
 */
export type TokenName =
  | 'bg'
  | 'surface'
  | 'panel'
  | 'border'
  | 'borderStrong'
  | 'text'
  | 'textMuted'
  | 'textDim'
  | 'link'
  | 'linkHover'
  | 'accent'
  | 'accentText'
  | 'secondary'
  | 'tertiary'
  | 'focusRing'
  | 'radius'
  | 'radiusSmall';

/** A token that is a plain colour, which contrastRatio can be handed. */
export type OpaqueToken = Extract<
  TokenName,
  'bg' | 'surface' | 'text' | 'textMuted' | 'textDim' | 'link' | 'accent' | 'accentText' | 'focusRing'
>;

/**
 * The tokens a page paints as a background.
 *
 * `panel` is deliberately absent: it is translucent, so what it resolves to
 * depends on the surface beneath it and a ratio for it would be a guess.
 */
export type SurfaceToken = Extract<TokenName, 'bg' | 'surface'>;

/** The tokens a page draws as a foreground on a surface. */
export type ForegroundToken = Extract<TokenName, 'text' | 'textMuted' | 'textDim' | 'link'>;

/** A full set of values, one per token, under the names the site paints with. */
export type Palette = Record<TokenName, string>;

/**
 * The dark palette: the default, and the one the simulations write into their
 * own :root block by hand.
 *
 * Checked by test/theme.test.ts. Changing a value here means changing the same
 * value in every simulation under simulations/.
 */
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

/**
 * The light palette: the Stitch lobby's light screen (docs/adr/0019).
 *
 * Two values differ from the design system's written guide, which lists
 * cyan #0099b8 and magenta #c01573. The screen uses #0092ac and #b8126b, and
 * they are the ones checked here. White text on the guide's cyan is 3.36:1,
 * so the accent carries dark text (`accentText`) instead.
 */
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

/**
 * The palette as a CSS custom property block under a selector.
 *
 * The selector is a parameter so the site can write each palette under its own
 * selector, and so a test can write a block without touching the defaults.
 */
export function themeCustomProperties(tokens: Palette = TOKENS, selector = ':root'): string {
  const declarations = Object.entries(tokens)
    .map(([name, value]) => `  --${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value};`)
    .join('\n');
  return `${selector} {\n${declarations}\n}`;
}

/**
 * Every palette rule the site writes into <head>.
 *
 * The dark palette is the default. A reader who has chosen light, or whose
 * system asks for light and who has not chosen dark, gets the light palette.
 * The choice is stored by the header toggle as `data-theme` on <html>, and an
 * explicit choice beats the system setting.
 *
 * `color-scheme` follows the same rules, so form controls and scrollbars match
 * the palette in use.
 */
export function themeStylesheet(): string {
  const lightSelector = "[data-theme='light']";
  const darkSelector = ":root, [data-theme='dark']";
  const systemLight = ":root:not([data-theme='dark'])";
  return [
    `${darkSelector} {\n  color-scheme: dark;\n}`,
    themeCustomProperties(TOKENS, darkSelector),
    `${lightSelector} {\n  color-scheme: light;\n}`,
    themeCustomProperties(TOKENS_LIGHT, lightSelector),
    `@media (prefers-color-scheme: light) {\n  ${systemLight} {\n  color-scheme: light;\n  }\n${themeCustomProperties(TOKENS_LIGHT, systemLight)}\n}`,
  ].join('\n');
}

/**
 * The ratios WCAG 2.1 asks for, named by what they are checked against.
 *
 * There is no large-text bar here. The chrome uses large type only for the
 * page's own h1, and the relaxed 3:1 would let a colour through that reads as
 * washed out on the dark surfaces. One bar, met by everything, is the simpler
 * rule and the stricter outcome.
 */
export const AA_NORMAL_TEXT = 4.5;
export const AA_NON_TEXT = 3;

/**
 * Whether a string is a hex colour this module can read.
 *
 * `contrastRatio` needs six numbers and a colour it cannot parse would produce
 * a confident wrong answer rather than an error, so every caller checks first.
 */
export function isHexColour(value: string): value is HexColour {
  return /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}

/**
 * An opaque token as a colour the maths can read.
 *
 * Narrows rather than casts, so a token that stops being opaque is a type error
 * at this call instead of a wrong number in a passing assertion. Exported so the
 * palette's own assertions read the tokens through the same door the code does.
 */
export function asHex(token: OpaqueToken, palette: Palette = TOKENS): HexColour {
  const value: string = palette[token];
  if (!isHexColour(value)) {
    throw new Error(`Token --${token} harus warna hex, bukan: ${value}`);
  }
  return value;
}

/** The red, green and blue of a hex colour, each 0 to 1. */
function channels(colour: HexColour): [number, number, number] {
  const hex = colour.slice(1);
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;

  if (full.length !== 6 || !/^[0-9a-f]{6}$/i.test(full)) {
    throw new Error(`Warna tidak dapat dibaca: ${colour}`);
  }

  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [number, number, number];
}

/**
 * One channel made linear, as WCAG 2.1 defines it.
 *
 * The gamma step matters and is not decoration: without it a mid grey comes
 * out far too bright, and the ratios computed here would all be wrong.
 */
function linearise(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

/** The relative luminance of a colour, from 0 (black) to 1 (white). */
export function relativeLuminance(colour: HexColour): number {
  const [r, g, b] = channels(colour);
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/**
 * The contrast ratio between two colours, from 1 to 21.
 *
 * Both arguments are checked, because an unreadable pair is exactly what this
 * function exists to catch and a wrong answer here would hide it.
 */
export function contrastRatio(foreground: HexColour, background: HexColour): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * The ratio a colour has to meet to be used for something.
 *
 * A link is held to the text bar rather than the component bar: it is text, it
 * is read at body size, and judging it as a UI element would let 3:1 body text
 * through, which is the fault this palette is meant to close.
 */
export function ratioRequiredFor(role: ForegroundToken): number {
  switch (role) {
    case 'text':
    case 'textMuted':
    case 'textDim':
    case 'link':
      return AA_NORMAL_TEXT;
    default:
      throw new Error(`Peran warna tidak dikenal: ${role as string}`);
  }
}

/**
 * The backgrounds this site paints, each with what sits on it.
 *
 * A pairing missing from here is a pairing nothing checks, so this is the first
 * list to update when a new surface is introduced.
 */
export function textSurfaces(palette: Palette = TOKENS): Record<SurfaceToken, HexColour> {
  return {
    bg: asHex('bg', palette),
    surface: asHex('surface', palette),
  };
}

/**
 * The surfaces, keyed by the token that names each one.
 *
 * `panel` is absent because it is translucent: what it resolves to depends on
 * the surface beneath it, so a ratio for it would be a guess. The panel is only
 * ever a background, and the text on it sits on `surface` with barely a
 * difference between them.
 */
export function surfaceTokens(): SurfaceToken[] {
  return ['bg', 'surface'];
}

/** The roles that are drawn as foregrounds on a surface. */
export function foregroundTokens(): ForegroundToken[] {
  return ['text', 'textMuted', 'textDim', 'link'];
}

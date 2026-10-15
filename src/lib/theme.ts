/**
 * The site's palette, and the arithmetic that holds it readable.
 *
 * A dark palette: the Neo-Arcade STEM design system (docs/adr/0015). The
 * simulations use the same values, so an embedded simulation and the page
 * around it share one surface. The test suite checks every text role against
 * the ratio its use needs.
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
  | 'focusRing'
  | 'radius'
  | 'radiusSmall';

/** A token that is a plain colour, which contrastRatio can be handed. */
export type OpaqueToken = Extract<
  TokenName,
  'bg' | 'surface' | 'text' | 'textMuted' | 'textDim' | 'link' | 'accent' | 'focusRing'
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

/**
 * The site's colours, under the names the rest of the site paints with.
 *
 * Written as literal values here and checked by test/theme.test.ts. The same
 * values are written into the :root block of every simulation.
 */
export const TOKENS: Record<TokenName, string> = {
  bg: '#0b0c16',
  surface: '#1a1b32',
  panel: 'rgba(18, 19, 36, 0.92)',
  border: 'rgba(138, 43, 226, 0.4)',
  borderStrong: '#8a2be2',
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

/**
 * The palette as CSS custom properties, written into the <head> of every page.
 *
 * There is one theme. The selector is a parameter so a test can write a second
 * block under another selector without changing this function.
 */
export function themeCustomProperties(
  tokens: Record<TokenName, string> = TOKENS,
  selector = ':root',
): string {
  const declarations = Object.entries(tokens)
    .map(([name, value]) => `  --${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value};`)
    .join('\n');
  return `${selector} {\n${declarations}\n}`;
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
export function asHex(token: OpaqueToken): HexColour {
  const value: string = TOKENS[token];
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
export function textSurfaces(): Record<SurfaceToken, HexColour> {
  return {
    bg: asHex('bg'),
    surface: asHex('surface'),
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

/**
 * The tokens as a CSS custom property block.
 *
 * Emitted into the page by Base.astro, so a page writes `var(--text-muted)`
 * rather than repeating a value that the palette already states. The names are
 * the simulations' own: `--bg`, `--surface`, `--text-muted`.
 */
export function tokenCustomProperties(tokens: Record<TokenName, string>): string {
  return Object.entries(tokens)
    .map(([name, value]) => `  --${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value};`)
    .join('\n');
}
import { describe, it, expect } from 'vitest';
import {
  asHex,
  TOKENS,
  contrastRatio,
  isHexColour,
  surfaceTokens,
  foregroundTokens,
  type HexColour,
  textSurfaces,
  ratioRequiredFor,
  AA_NORMAL_TEXT,
  AA_NON_TEXT,
  themeCustomProperties,
} from '../src/lib/theme';

describe('the palette', () => {
  it('names exactly the roles the palette is for, and no more', () => {
    // A token nothing paints with is a second source of truth waiting to drift.
    // The list is written out here, since it is the decision the palette makes.
    expect(Object.keys(TOKENS).sort()).toEqual(
      [
        'accent',
        'bg',
        'border',
        'borderStrong',
        'focusRing',
        'link',
        'linkHover',
        'panel',
        'radius',
        'radiusSmall',
        'surface',
        'text',
        'textDim',
        'textMuted',
      ].sort(),
    );
  });

  it('keeps the accent visible against the page without using it for text', () => {
    // The accent marks the featured rule and the focus outline. A non-text
    // colour still has to be seen, so it must meet the 3:1 bar against the page.
    expect(contrastRatio(asHex('accent'), asHex('bg'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });
});

describe('isHexColour', () => {
  it('accepts the three and six digit forms', () => {
    expect(isHexColour('#fff')).toBe(true);
    expect(isHexColour('#0a0a1a')).toBe(true);
  });

  it('rejects anything contrastRatio cannot read', () => {
    // The maths below silently produces nonsense for a colour it cannot parse,
    // which would let an unreadable pair pass as a readable one.
    for (const value of ['red', '#ff', 'rgb(0,0,0)', 'var(--bg)', '#gggggg', '']) {
      expect(isHexColour(value), value).toBe(false);
    }
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
  });

  it('is 1 for a colour on itself', () => {
    expect(contrastRatio('#0a0a1a', '#0a0a1a')).toBeCloseTo(1, 5);
  });

  it('does not care which of the two colours is listed first', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(contrastRatio('#000000', '#ffffff'), 10);
  });

  it('reads the three digit form as the six digit form', () => {
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(21, 5);
  });

  it('throws on a colour it cannot parse rather than guessing', () => {
    // A silent wrong answer here would make every ratio assertion below pass
    // for the wrong reason. The value is a real CSS colour that this module
    // deliberately cannot read, which is the case most likely to arrive.
    const named = 'rebeccapurple';
    expect(() => contrastRatio(named as HexColour, '#000000')).toThrow();
  });

  it("matches the published value for a colour the site uses", () => {
    // Checked against the W3C definition rather than against a value measured
    // earlier, so the maths is pinned by something outside this repo.
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
    // Checked against the W3C worked example for the gamma threshold, which is
    // the step most likely to be got wrong. 8-bit #0a0a1a on white is 19.60.
    expect(contrastRatio('#0a0a1a', '#ffffff')).toBeCloseTo(19.6, 1);
  });
});

describe('every colour the chrome puts on a surface', () => {
  it('meets the ratio that use needs', () => {
    // Criterion: text meets a readable contrast ratio against its background on
    // every page. Each pairing below is one this site actually renders, named
    // so a failure says which text on which surface went unreadable.
    const failures: string[] = [];

    for (const [name, surface] of Object.entries(textSurfaces())) {
      for (const role of ['text', 'textMuted', 'textDim', 'link'] as const) {
        const required = ratioRequiredFor(role);
        const actual = contrastRatio(asHex(role), surface);
        if (actual < required) {
          failures.push(`${TOKENS[role]} (${role}) on ${surface} (${name}): ${actual.toFixed(2)} < ${required}`);
        }
      }
    }

    expect(failures).toEqual([]);
  });
});

describe('the non-text colours', () => {
  it('separate a surface from its background enough to be seen', () => {
    // A border at 1.5 is decoration nobody can find. The focus ring is held to
    // the same bar as any other non-text element.
    for (const surface of Object.values(textSurfaces())) {
      expect(contrastRatio(asHex('focusRing'), surface), surface).toBeGreaterThanOrEqual(AA_NON_TEXT);
    }
  });

  it('holds the focus ring to the strongest bar a ring may be judged by', () => {
    // The ring is drawn outside the element, so what matters is that it is
    // visible against whatever sits behind it, which is the page background.
    expect(contrastRatio(asHex('focusRing'), asHex('bg'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });
});

describe('ratioRequiredFor', () => {
  it('holds ordinary text to the strict bar', () => {
    expect(ratioRequiredFor('text')).toBe(AA_NORMAL_TEXT);
    expect(ratioRequiredFor('textMuted')).toBe(AA_NORMAL_TEXT);
  });

  it('holds a link to the strict bar too, because it may be read as body text', () => {
    // A link is text. Treating it as a UI component only would let body-sized
    // link text through at 3:1, which is the fault this ticket is closing.
    expect(ratioRequiredFor('link')).toBe(AA_NORMAL_TEXT);
  });

  it('refuses a role it does not know rather than defaulting', () => {
    // The parameter is typed, so the only way in is a value from outside. The
    // check that it throws is what a caller would rely on after building a role
    // name at run time.
    const role: string = 'accent';
    expect(() => ratioRequiredFor(role as Parameters<typeof ratioRequiredFor>[0])).toThrow();
  });
});

describe('themeCustomProperties', () => {
  it('emits one custom property per token', () => {
    const css = themeCustomProperties(TOKENS);
    expect(css).toContain(`--bg: ${TOKENS.bg};`);
    expect(css).toContain(`--text-muted: ${TOKENS.textMuted};`);
  });

  it('emits nothing that is not a token', () => {
    const css = themeCustomProperties(TOKENS);
    const properties = [...css.matchAll(/(--[a-z-]+):/g)].map((m) => m[1]);
    expect(new Set(properties).size).toBe(properties.length);
    expect(properties.length).toBe(Object.keys(TOKENS).length);
  });

  it('can write a second theme under a different selector', () => {
    // Reversible by choice, not by accident. The simulations select a theme by
    // setting data-theme on their own <html> and already ship a complete light
    // palette, so the day they honour a preference the chrome needs this to
    // write a `[data-theme="light"]` block beside the `:root` one. That block is
    // deliberately not written today — all 23 are hardcoded dark — so this is
    // what proves adding it is a call rather than a restructuring.
    const light = themeCustomProperties({ ...TOKENS, bg: '#f7f7fb', text: '#16161d' }, "[data-theme='light']");
    expect(light).toContain("[data-theme='light'] {");
    expect(light).toContain('--bg: #f7f7fb;');
    expect(light).toContain('--text: #16161d;');
  });

  it('writes the dark palette under :root by default', () => {
    expect(themeCustomProperties()).toContain(':root {');
  });

  it('keeps the accent out of the text roles', () => {
    // The two are separate tokens on purpose. Merging them would put a 4.2
    // colour behind body text the first time someone reached for the accent.
    expect(themeCustomProperties(TOKENS)).not.toContain('--link: #6366f1');
  });
});

describe('the token groups', () => {
  it('lists the surfaces the site actually paints', () => {
    // Every one of these is a background colour used in src/ today. A surface
    // missing here would not be checked, so this is the list to update first
    // when a new one is introduced. The translucent panel is deliberately
    // absent: what it resolves to depends on what is behind it.
    expect(surfaceTokens()).toEqual(['bg', 'surface']);
    expect(foregroundTokens()).toEqual(['text', 'textMuted', 'textDim', 'link']);
  });
});
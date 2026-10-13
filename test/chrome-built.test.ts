import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  TOKENS,
  asHex,
  contrastRatio,
  isHexColour,
  AA_NON_TEXT,
  type HexColour,
} from '../src/lib/theme';

/**
 * The built pages the ticket names, plus one simulation page because that is
 * where the chrome and a simulation meet.
 */
const PAGES = [
  '/',
  '/katalog/',
  '/sitemap/',
  '/smp/',
  '/smp/kelas-7/',
  '/smp/matematika/',
  '/smp/kelas-7/cetak/',
  '/smp/kelas-7/matematika/angka-bulat-dan-garis-bilangan/',
];

const DIST = resolve(import.meta.dirname, '..', 'dist');

function htmlAt(path: string): string {
  return readFileSync(resolve(DIST, path.slice(1), 'index.html'), 'utf8');
}

/**
 * The rules inside a stylesheet's print block.
 *
 * Parsed rather than pattern-matched: the alternative is a pattern that passes
 * only because the CSS minifier writes the block a particular way, and which
 * then fails for an unrelated reason the day it does not.
 */
function printRules(css: string): { selector: string; value: string }[] {
  const start = css.indexOf('@media print');
  if (start === -1) return [];
  const found: { selector: string; value: string }[] = [];
  for (const rule of css.slice(start).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    for (const selector of rule[1].split(',')) {
      found.push({ selector: selector.trim().replace(/\[data-astro-cid-[\w-]+\]/g, ''), value: rule[2] });
    }
  }
  return found;
}

/** Every style block on a built page, concatenated. */
function cssOf(path: string): string {
  return [...htmlAt(path).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
}

describe('every page carries the palette', () => {
  it('emits the tokens as custom properties on every page', () => {
    // The tokens are emitted by Base, so a page that does not use the layout
    // would paint nothing at all. This is the check that they reached every
    // page rather than the one that happened to be looked at.
    for (const path of PAGES) {
      const css = cssOf(path);
      expect(css, path).toContain(`--bg: ${TOKENS.bg};`);
      expect(css, path).toContain(`--text: ${TOKENS.text};`);
      expect(css, path).toContain(`--link: ${TOKENS.link};`);
      expect(css, path).toContain(`--focus-ring: ${TOKENS.focusRing};`);
    }
  });

  it('paints the page background with the simulation background', () => {
    // Criterion: the chrome and the simulations are one surface. The page is
    // what surrounds the frame, so this is the colour the eye compares across
    // that edge.
    for (const path of PAGES) {
      expect(cssOf(path), path).toMatch(/html\{[^}]*background:\s*var\(--bg\)/);
    }
  });

  it('paints the frame with the same background as the page', () => {
    // Criterion: no embedded simulation reads as a hard-edged black rectangle
    // against white. Against the chrome it is the same value, so the seam has
    // no contrast of its own.
    // Matched on the selector's own name rather than anchored to `iframe{`:
    // Astro scopes a page's rules with a data attribute, so the built
    // selector reads iframe[data-astro-cid-...].
    const css = cssOf(PAGES[PAGES.length - 1]);
    expect(css).toMatch(/iframe[^{}]*\{[^}]*background:\s*var\(--bg\)/);
  });

  it('gives the frame border-box, so its border does not make it wider than its column', () => {
    // Criterion: the frame fills the width. With the default content-box the
    // border is added to the width, so the frame came out 2px wider than the
    // column it is supposed to fill — measured at a phone width, where the
    // criterion is most easily broken and least easily noticed.
    const css = cssOf(PAGES[PAGES.length - 1]);
    const frame = [...css.matchAll(/iframe[^{}]*\{([^{}]*)\}/g)].find((m) => /background/.test(m[1]));
    expect(frame, 'no iframe rule with a background').toBeDefined();
    expect(frame?.[1]).toMatch(/box-sizing:\s*border-box/);
  });

  it('gives the frame the shared hairline, not an edge lighter than both sides', () => {
    // A border brighter than the page and the simulation would draw the very
    // edge the ticket says not to draw, even with the backgrounds matched.
    const css = cssOf(PAGES[PAGES.length - 1]);
    expect(css).toMatch(/iframe[^{}]*\{[^}]*border:\s*1px solid var\(--border\)/);
  });
});

describe('no page hardcodes a colour', () => {
  /**
   * The declarations a stylesheet makes, with their selectors.
   *
   * Matched declaration by declaration rather than by searching the whole file
   * for a `#`, because a hex-looking string inside a comment, a url() or a
   * bundled script is not a colour the page paints and flagging it would train
   * everyone to ignore this check.
   */
  const COLOUR_LITERAL = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(|\boklab\(|\boklch\(/i;

  /**
   * The `:root` block, where the palette declares itself.
   *
   * Every token is a literal here by definition — that is where the value lives
   * — so these are the one place a literal is correct and the check skips them.
   */
  function isPaletteDeclaration(selector: string): boolean {
    return selector.startsWith(':root');
  }

  /**
   * Every declaration in a stylesheet that names a colour, with its selector.
   *
   * Read declaration by declaration and matched on the *value* rather than on
   * a list of property names, because a colour reaches a page through more
   * properties than `color`: `background`, `border`, `outline` and every
   * shorthand of each. A check written against `color` alone would have passed
   * a page that hardcoded its entire background.
   */
  function colourDeclarations(css: string): { selector: string; property: string; value: string }[] {
    const found: { selector: string; property: string; value: string }[] = [];
    const printAt = css.indexOf('@media print');
    // The printable sheet's print block is exempt: a printed page carries no
    // custom properties into it, so those values are ink rather than screen
    // colour and have to be literals.
    const screen = printAt === -1 ? css : css.slice(0, printAt);

    for (const rule of screen.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = rule[1].trim();
      if (isPaletteDeclaration(selector)) continue;

      for (const decl of rule[2].split(';')) {
        const match = decl.match(/^\s*([-a-z]+)\s*:\s*(.+?)\s*$/i);
        if (!match) continue;
        const [, property, value] = match;
        // A property that cannot carry a colour is not this check's business.
        if (!/color|background|border|outline|shadow|fill|stroke/i.test(property)) continue;
        if (COLOUR_LITERAL.test(value)) found.push({ selector, property, value });
      }
    }
    return found;
  }

  it('resolves every colour the site paints through a token', () => {
    // A literal is a second source of truth for a value the palette already
    // states, and it is how the one unreadable link on this site happened: a
    // component that styled everything around a link and not the link.
    const offenders: string[] = [];

    for (const path of PAGES) {
      for (const { selector, property, value } of colourDeclarations(cssOf(path))) {
        offenders.push(`${path}: ${selector} { ${property}: ${value} }`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('would notice a colour written into a background, border or outline', () => {
    // The check above is only worth anything if it reaches past `color`. This
    // proves it does, by asking the same reader to find colours that are
    // genuinely there — real declarations on a real page, so a reader that came
    // back empty would be a defect in the reader rather than in this test.
    //
    // The printable sheet's print block is the place to look: those values are
    // literals by design, and they sit in `background`, `color`, `border-top`
    // and `outline` between them, which is the spread of properties the screen
    // check has to reach past `color` to cover.
    const sheetCss = cssOf('/smp/kelas-7/cetak/');
    expect(sheetCss).toContain('@media print');

    // The print block on its own, because colourDeclarations deliberately cuts
    // it off: handing it the whole stylesheet would find nothing new, and
    // handing it a fragment that starts mid-rule would find nothing at all.
    // What is being shown is that the reader can see a colour in a property
    // other than `color` when one is there.
    const printBlock = sheetCss.slice(sheetCss.indexOf('@media print'));
    const found: { selector: string; property: string; value: string }[] = [];
    for (const rule of printBlock.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      for (const decl of rule[2].split(';')) {
        const match = decl.match(/^\s*([-a-z]+)\s*:\s*(.+?)\s*$/i);
        if (!match) continue;
        const [, property, value] = match;
        if (!/color|background|border|outline|shadow/i.test(property)) continue;
        if (COLOUR_LITERAL.test(value)) {
          found.push({ selector: rule[1].trim(), property, value });
        }
      }
    }
    const properties = new Set(found.map((d) => d.property));

    expect(found.length).toBeGreaterThan(0);
    // At least one is not `color`, which is the whole point: a reader limited to
    // `color` would find nothing here beyond what the first check already saw.
    expect([...properties].some((property) => property !== 'color')).toBe(true);
  });
});

describe('every link is styled, so none falls back to the browser default', () => {
  it('gives every anchor on the site a colour from the palette', () => {
    // The one contrast failure this site had was an anchor in a paragraph
    // whose surrounding styles were all written and whose own were not, so it
    // rendered in the browser's default link blue. A rule on `a` itself is what
    // stops that happening again to the next link somebody adds.
    //
    // Matched as a selector list that is exactly `a`, and anchored to the start
    // of a rule. Matched loosely this pattern is satisfied by any rule holding an
    // `a` and a link colour, and the built home page has four such rules of
    // which two are this one — so the loose version passes with the rule deleted,
    // which is the failure this ticket exists to close.
    for (const path of PAGES) {
      const css = cssOf(path);
      // Split on the braces only: `[^}]*` between them is the whole selector,
      // so a rule after another rule is still found.
      const selectors = [...css.matchAll(/(?:^|\})([^{}]*)\{/g)].map((m) => m[1].trim());
      expect(selectors, `${path}: no rule for \`a\``).toContain('a');
    }
  });

  it('gives the simulation page fallback link a colour of its own', () => {
    // Belt and braces on the one that failed: the global rule would cover it,
    // but a page that depends on a rule in another file to be readable is a
    // page whose readability is one refactor away from breaking.
    const css = cssOf(PAGES[PAGES.length - 1]);
    expect(css).toMatch(/\.fallback[^{}]*a[^{}]*\{[^}]*color:\s*var\(--link\)/);
  });
});

describe('focus is visible everywhere', () => {
  it('draws a ring on every kind of control the site has', () => {
    // Criterion: focus is visible on every interactive element. The site has
    // links, form controls on the Katalog, and one iframe, and a rule that
    // missed one of them is exactly the inconsistency being closed.
    const css = cssOf(PAGES[0]);
    expect(css).toContain(':focus-visible');
    for (const selector of ['a:focus-visible', 'button:focus-visible', 'input:focus-visible', 'iframe:focus-visible']) {
      expect(css, selector).toContain(selector);
    }
  });

  it('draws the ring in a colour a reader can see against the page', () => {
    // A ring nobody can see is the same defect as no ring. Checked by the same
    // arithmetic as every other colour on the page.
    expect(contrastRatio(asHex('focusRing'), asHex('bg'))).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it('keeps the breadcrumb ahead of the frame and the new-tab link behind it', () => {
    // Criterion: the Halaman Simulasi keeps its breadcrumb and new-tab link
    // reachable while the frame has focus.
    //
    // Two links, on either side of the frame, and that placement is the point.
    // The breadcrumb sits *before* the iframe in the document, so it is reached
    // on the way in. The new-tab link sits *after* it, so tabbing through the
    // simulation and out the other side lands on it — which is the one control a
    // reader needs when the frame has failed to render at all. A reader who
    // cannot get into the frame, or who is stuck in it, has no way back out to
    // the page; these two are how.
    //
    // Reachability was measured in a browser, not inferred from this ordering:
    // the breadcrumb is tab stops 7 to 10, the frame is 11, and the new-tab
    // link is 22, each with a visible focus ring.
    const html = htmlAt(PAGES[PAGES.length - 1]);
    const navAt = html.indexOf('class="breadcrumb"');
    const frameAt = html.indexOf('id="simulation-frame"');
    const fallbackAt = html.indexOf('class="fallback"');

    expect(navAt, 'no breadcrumb on the simulation page').toBeGreaterThan(-1);
    expect(frameAt, 'no frame on the simulation page').toBeGreaterThan(-1);
    expect(fallbackAt, 'no new-tab link on the simulation page').toBeGreaterThan(-1);

    // Breadcrumb before the frame, so it is reached on the way in.
    expect(navAt).toBeLessThan(frameAt);
    // New-tab link after it, so tabbing through the simulation reaches it.
    expect(fallbackAt).toBeGreaterThan(frameAt);
  });
});

describe('the palette on paper', () => {
  it('leaves the printable sheet printing black on white', () => {
    // The sheet is the one page meant to come out of a printer, and a token
    // that turned it into a dark page would spend a cartridge to print a grey
    // one. Its print block keeps literals for exactly this reason.
    const css = cssOf('/smp/kelas-7/cetak/');
    // Read out of the print block by parsing it, not by matching the bytes the
    // minifier happens to emit. A pattern anchored on `@media print{html{`
    // passes only because the minifier writes it exactly that way, and would
    // fail for a reason that has nothing to do with the behaviour if it did not.
    expect(printRules(css).some((rule) => rule.selector === 'html' && /background:\s*#fff/i.test(rule.value))).toBe(
      true,
    );
  });

  it('keeps every colour the sheet prints a shade of grey', () => {
    const printed = printRules(cssOf('/smp/kelas-7/cetak/'));
    const hues = [...printed.map((rule) => rule.value).join(';').matchAll(/#[0-9a-f]{3,6}/gi)]
      .map((m) => m[0].slice(1))
      .filter((hex) => {
        const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
        const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
        return r !== g || g !== b;
      });
    expect(hues).toEqual([]);
  });
});

describe('no simulation file was touched to make the chrome match', () => {
  it('leaves every simulation still declaring the palette the chrome copied', () => {
    // The whole point of this ticket is that the chrome moved to the
    // simulations, not the other way round. A palette match achieved by editing
    // them would break that and every link to the file behind them.
    //
    // This is about the palette specifically. A simulation that is broken on
    // its own terms does get fixed — the boundary is intent, not provenance
    // (docs/adr/0005): nothing is reshaped to suit the site, but a defect a
    // reader can see is fixed in the file it lives in.
    const dir = resolve(import.meta.dirname, '..', 'example-simulations/lower-secondary/grade-7');
    const files = readdirSync(dir).filter((name) => name.endsWith('.html'));
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      const html = readFileSync(resolve(dir, name), 'utf8');
      // Read from the file's own :root block, not by searching the whole
      // document: every simulation also carries a light-theme block and its
      // inline scripts, and a match anywhere in those would pass for a palette
      // that had been edited away.
      const root = html.slice(html.indexOf(':root'), html.indexOf('}', html.indexOf(':root')));
      const declared = root.match(/--bg\s*:\s*(#[0-9a-f]{3,6})/i)?.[1];
      // Compared as colours rather than as strings: the simulations write
      // `--bg: #0a0a1a` in some files and `--bg:#0a0a1a` in others, and a string
      // comparison would fail on the spacing while the palette was identical.
      expect(declared, `${name} declares no --bg`).toBeDefined();
      expect(isHexColour(declared as string), name).toBe(true);
      expect(contrastRatio(declared as HexColour, asHex('bg')), name).toBe(1);
    }
  });
});
describe('everything the reader can perceive is in Bahasa Indonesia', () => {
  const SITE_PAGES = PAGES;

  /** Every page the site itself builds, excluding the raw simulation files. */
  function sitePages(): string[] {
    const dir = resolve(DIST);
    const found: string[] = [];
    const walk = (current: string): void => {
      for (const name of readdirSync(current, { withFileTypes: true })) {
        // The raw simulation files are the tool's output, served verbatim, and
        // this site does not edit them (docs/adr/0005). They are excluded here
        // deliberately and visibly, not by omission: they are framed onto the
        // Halaman Simulasi, so a reader does meet their text, but their language
        // is the tool's to get right and this repository cannot change it. A few
        // of them carry English control labels such as "Level" and "Reset
        // Kamera", which is a finding for the tool, recorded rather than hidden
        // by quietly narrowing what this check looks at.
        if (name.name === 'simulasi') continue;
        const full = resolve(current, name.name);
        if (name.isDirectory()) walk(full);
        else if (name.name === 'index.html') found.push(full);
      }
    };
    walk(dir);
    return found;
  }

  it('labels the document in Indonesian on every page', () => {
    // A screen reader picks its pronunciation from this. Anything else and an
    // Indonesian page is read with English rules, letter by letter.
    for (const path of SITE_PAGES) {
      expect(htmlAt(path), path).toContain('<html lang="id"');
    }
  });

  it('writes every label, title and placeholder in Indonesian', () => {
    // Criterion: interface text is Bahasa Indonesia throughout, including alt
    // text and control labels. English words a reader would meet on a page of
    // this site are the ones this catches.
    const english = /\b(search|filter|sort|next|previous|submit|close|open|menu|home|page|loading|click|tap)\b/i;
    const offenders: string[] = [];

    for (const file of sitePages()) {
      const html = readFileSync(file, 'utf8');
      for (const match of html.matchAll(/(?:alt|title|aria-label|placeholder)="([^"]*)"/g)) {
        if (english.test(match[1])) {
          offenders.push(`${file.replace(DIST, '')}: ${match[0]}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('gives the frame a title naming the simulation it shows', () => {
    // A frame with no title is announced as "frame" and tells a screen reader
    // nothing about what is inside it.
    for (const path of SITE_PAGES) {
      const html = htmlAt(path);
      if (!html.includes('<iframe')) continue;
      const title = html.match(/<iframe[^>]*\stitle="([^"]*)"/)?.[1];
      expect(title, path).toBeDefined();
      expect(title, path).not.toBe('');
    }
  });

  it('names every page in Indonesian', () => {
    const english = /\b(the|and|of|for|with|simulation(s)?|class|print)\b/i;
    for (const path of SITE_PAGES) {
      const title = htmlAt(path).match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
      // "Simula" is the site's name and is not English text.
      const withoutName = title.replace(/\s*·\s*Simula\s*$/, '');
      expect(english.test(withoutName), `${path}: ${title}`).toBe(false);
    }
  });
});

describe('a canvas bitmap is at least as wide as the box it is drawn into', () => {
  // Found by measurement, not by reading the code: this simulation's drawing
  // reached only the left 42% of its canvas and the rest appeared cut off.
  //
  // `canvas { width: 100% }` sizes the *box*, while the bitmap behind it keeps
  // whatever the element says — and a <canvas> with a height but no width
  // defaults to a 300px-wide bitmap. So the drawing code measured the box
  // (554px), laid the figures out for 554px, and drew them into 300 pixels of
  // bitmap; everything past x=300 was discarded. The upscale then made it look
  // soft rather than obviously wrong.
  //
  // Read from the source because that is all a test can see without a browser.
  // The browser check that backs this up lives in the commit message: the
  // painted extent went from 232px of CSS width to 534px in a 554px box.
  const SIMS = resolve(import.meta.dirname, '..', 'example-simulations/lower-secondary/grade-7');

  it('never sizes a canvas from CSS alone', () => {
    // The rule for every canvas in the batch: if it is stretched to fill its
    // container, something has to set the bitmap to match, or the drawing is
    // silently clipped. A canvas the tool never touches is left alone.
    const offenders: string[] = [];

    for (const name of readdirSync(SIMS)) {
      if (!name.endsWith('.html')) continue;
      const html = readFileSync(resolve(SIMS, name), 'utf8');
      const canvasRule = html.match(/(?:^|[}\s])canvas\s*(?:,[^{]*)?\{([^}]*)\}/);
      if (!canvasRule) continue;
      if (!/width\s*:\s*(100%|100vw)/.test(canvasRule[1])) continue;
      if (!/canvas\.width\s*=/.test(html) && !/\.width\s*=\s*Math\.round/.test(html)) {
        offenders.push(name);
      }
    }

    expect(offenders, `canvas stretched with no bitmap sizing: ${offenders.join(', ')}`).toEqual([]);
  });

  it('sets every stretched canvas bitmap from the box it is drawn into', () => {
    // The specific shape of the fault: a canvas element carrying a height but
    // no width starts from the HTML default of 300px, while the CSS stretches
    // the box to fill the column. The two disagree, and any drawing laid out
    // for the box is cut off at the bitmap's edge.
    //
    // The bitmap may be set by a width attribute or from script — two of the
    // batch do the latter — so what is required is that the bitmap ends up
    // matching the box, not that a particular line exists. Measured in a
    // browser, all three of these hold their bitmap to their client width.
    const offenders: string[] = [];

    for (const name of readdirSync(SIMS)) {
      if (!name.endsWith('.html')) continue;
      const html = readFileSync(resolve(SIMS, name), 'utf8');
      const script = Array.from(html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))
        .map((m) => m[1])
        .join('\n');
      const sizesBitmap = /\.width\s*=\s*(?!\s*\d)/.test(script)
        || /canvas\.width\s*=/.test(script)
        || Array.from(html.matchAll(/<canvas\b[^>]*>/g)).every((t) => /\bwidth\s*=/.test(t[0]));

      for (const tag of html.match(/<canvas\b[^>]*>/g) ?? []) {
        if (/\bwidth\s*=/.test(tag)) continue;
        const id = tag.match(/\bid\s*=\s*["']([^"']+)["']/)?.[1];
        const stretches = id
          ? new RegExp(`${id}\\s*(?:,[^{]*)?\\{[^}]*width\\s*:\\s*(?:100%|100vw)`).test(html)
          : false;
        if (stretches && !sizesBitmap) offenders.push(`${name} (${id})`);
      }
    }

    expect(offenders, `canvas stretched without a bitmap to match: ${offenders.join(', ')}`)
      .toEqual([]);
  });

  it('resizes this simulation\'s bitmap from its own box', () => {
    const html = readFileSync(resolve(SIMS, 'menemukan-pola-dari-susunan-benda.html'), 'utf8');

    // Both halves of the fix: the bitmap follows the box, and the context is
    // scaled to match so the drawing is not squashed.
    expect(html).toMatch(/canvas\.width\s*=\s*pixelW/);
    expect(html).toMatch(/canvas\.height\s*=\s*pixelH/);
    expect(html).toMatch(/ctx\.setTransform\(dpr,\s*0,\s*0,\s*dpr,\s*0,\s*0\)/);

    // The bitmap is written before the drawing maths runs. In the original the
    // first statement read canvas.clientWidth, which is exactly the value that
    // disagreed with the bitmap.
    // Before the drawing maths, not merely somewhere in the function: the whole
    // fault was the layout reading a width the bitmap did not have yet.
    // Reading the box comes first — there is nothing to size the bitmap from
    // until you have measured it. What has to come before everything else is the
    // layout that consumes the measurement.
    const draw = html.slice(html.indexOf('function draw()'));
    const sized = draw.indexOf('canvas.width = pixelW');
    expect(sized).toBeLessThan(draw.indexOf('ctx.clearRect'));
    expect(sized, 'the figures are laid out before the bitmap matches them')
      .toBeLessThan(draw.indexOf('figureLayout(W,'));

    // And the box itself: without a CSS height the bitmap and the box disagree
    // again, so the guard above would stop firing and the bug would return.
    const css = html.match(/(?:^|[}\s])canvas\s*(?:,[^{]*)?\{([^}]*)\}/);
    expect(css?.[1], 'canvas rule not found').toMatch(/width\s*:\s*100%/);
    expect(css?.[1]).toMatch(/height\s*:\s*300px/);
  });
});

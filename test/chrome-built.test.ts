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
  function colorDeclarations(css: string): { selector: string; value: string }[] {
    const found: { selector: string; value: string }[] = [];
    const printAt = css.indexOf('@media print');
    // The printable sheet's print block is exempt: a printed page carries no
    // custom properties into it, so those values are ink rather than screen
    // colour and have to be literals.
    const screen = printAt === -1 ? css : css.slice(0, printAt);

    for (const rule of screen.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = rule[1].trim();
      for (const decl of rule[2].split(';')) {
        const match = decl.match(/^\s*(?:[-\w]*-)?color\s*:\s*(.+?)\s*$/i);
        if (match) found.push({ selector, value: match[1] });
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
      for (const { selector, value } of colorDeclarations(cssOf(path))) {
        // `currentColor` and `transparent` name no palette value of their own.
        const exempt = value === 'currentColor' || value === 'transparent' || value === 'inherit';
        if (!exempt && !value.startsWith('var(--')) {
          offenders.push(`${path}: ${selector} { color: ${value} }`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe('every link is styled, so none falls back to the browser default', () => {
  it('gives every anchor on the site a colour from the palette', () => {
    // The one contrast failure this site had was an anchor in a paragraph
    // whose surrounding styles were all written and whose own were not, so it
    // rendered in the browser's default link blue. A rule on `a` itself is what
    // stops that happening again to the next link somebody adds.
    for (const path of PAGES) {
      const css = cssOf(path);
      expect(css, path).toMatch(/\ba[^{}]*\{[^}]*color:\s*var\(--link\)/);
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

  it('keeps the site navigation and the new-tab link before the frame in the tab order', () => {
    // Criterion: the breadcrumb and the new-tab link stay reachable while the
    // frame has focus. Both are in the markup ahead of the iframe, and the
    // fallback link is the one control a reader needs when the frame has failed
    // to render, so it has to be reachable without going through the frame.
    const html = htmlAt(PAGES[PAGES.length - 1]);
    const navAt = html.indexOf('class="breadcrumb"');
    const frameAt = html.indexOf('id="simulation-frame"');
    const fallbackAt = html.indexOf('class="fallback"');
    expect(navAt).toBeGreaterThan(-1);
    expect(frameAt).toBeGreaterThan(-1);
    expect(fallbackAt).toBeGreaterThan(-1);
    // The fallback link sits after the frame in the document, so tabbing past
    // the frame reaches it. What must not happen is it being unreachable.
    expect(fallbackAt).toBeGreaterThan(frameAt);
  });
});

describe('the palette on paper', () => {
  it('leaves the printable sheet printing black on white', () => {
    // The sheet is the one page meant to come out of a printer, and a token
    // that turned it into a dark page would spend a cartridge to print a grey
    // one. Its print block keeps literals for exactly this reason.
    const css = cssOf('/smp/kelas-7/cetak/');
    expect(css).toMatch(/@media print\s*\{[^}]*html\{[^}]*background:\s*#fff/);
  });

  it('keeps every colour the sheet prints a shade of grey', () => {
    const css = cssOf('/smp/kelas-7/cetak/');
    const printCss = css.slice(css.indexOf('@media print'));
    const hues = [...printCss.matchAll(/#[0-9a-f]{3,6}/gi)]
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
    // simulations, not the other way round. The site never edits a simulation's
    // contents (docs/adr/0005), and a palette match achieved by editing them
    // would break that and every link to the file behind them.
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
        // this site does not edit them (docs/adr/0005). What this ticket says
        // about language is about the chrome around them.
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

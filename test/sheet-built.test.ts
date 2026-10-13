import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, sep as pathSep } from 'node:path';
import { parse } from 'yaml';
import { simulasiUrl } from '../src/lib/catalog';
import { sheetPages, sheetPath, SHEET_SEGMENT } from '../src/lib/sheet';
import type { CatalogEntry } from '../src/lib/types';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = resolve(ROOT, 'dist');
const CATALOG_DIR = resolve(ROOT, 'src/content/simulasi');

const CATALOG: CatalogEntry[] = readdirSync(CATALOG_DIR)
  .filter((name) => name.endsWith('.yaml'))
  .map((name) => {
    const data = parse(readFileSync(resolve(CATALOG_DIR, name), 'utf8'));
    return { ...data, slug: name.replace(/\.yaml$/, '') };
  });

const SHEETS = sheetPages(CATALOG);

/** The built sheet at one address. */
function htmlAt(path: string): string {
  return readFileSync(resolve(DIST, path.slice(1), 'index.html'), 'utf8');
}

/** The visible text of a built page, with its styles and markup removed. */
function textOf(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

describe('the sheet route and the sheet address are the same address', () => {
  it('routes the sheet under the segment sheetPath builds', () => {
    // Astro reads a page's address from the directory its file sits in, so the
    // route is named 'cetak/' on disk while sheetPath composes the segment
    // itself. Nothing makes those two agree except this check: renaming the
    // constant would move every link to the sheet and leave the route behind,
    // and no other test would see it.
    const routeDir = resolve(ROOT, 'src/pages/[tingkat]/[segmen]', SHEET_SEGMENT);
    expect(existsSync(resolve(routeDir, 'index.astro'))).toBe(true);

    const fromConstant = sheetPath('smp', 'kelas-7');
    expect(fromConstant).toContain(`/${SHEET_SEGMENT}/`);
    expect(existsSync(resolve(DIST, fromConstant.slice(1), 'index.html'))).toBe(true);
  });
});

describe('one sheet per class that has simulations', () => {
  it('builds a sheet at the address the catalog calls for', () => {
    expect(SHEETS.length).toBeGreaterThan(0);
    for (const sheet of SHEETS) {
      expect(existsSync(resolve(DIST, sheet.path.slice(1), 'index.html'))).toBe(true);
    }
  });

  it('builds a sheet for every class named in the catalog', () => {
    // Worked out from the catalog files, not from sheet.ts, so a fault in
    // that module cannot move this expectation and the build together.
    const fromCatalog = new Set(
      CATALOG.map((entry) => `${entry.level}/${entry.grade}`).map((key) => {
        const [level, grade] = key.split('/');
        return sheetPath(level, `kelas-${grade}`);
      }),
    );
    for (const path of fromCatalog) {
      expect(existsSync(resolve(DIST, path.slice(1), 'index.html'))).toBe(true);
    }
  });

  it('builds no sheet for a class the catalog has no simulations for', () => {
    // Criterion: an empty sheet is worse than none. A teacher who prints it
    // finds a blank page and reads the site as broken.
    for (const grade of [1, 6, 8, 9, 10, 12]) {
      expect(existsSync(resolve(DIST, sheetPath('smp', `kelas-${grade}`).slice(1), 'index.html'))).toBe(false);
    }
  });

  it('builds no other page under the sheet segment', () => {
    // The route sits under the landing route's segments, so a page could
    // appear there that no class in the catalog asked for.
    const built = readdirSync(DIST, { recursive: true })
      .filter((name): name is string => typeof name === 'string' && name.endsWith('index.html'))
      .map((name) => name.split(pathSep).join('/'))
      .filter((name) => name.endsWith(`/${SHEET_SEGMENT}/index.html`));
    expect(built.length).toBe(SHEETS.length);
  });
});

describe('a sheet lists the class in teaching order', () => {
  const sheet = SHEETS[0];
  const html = htmlAt(sheet.path);
  const text = textOf(html);

  it('lists every simulation of that class, once each', () => {
    for (const item of sheet.items) {
      expect(text).toContain(item.title);
      expect(text).toContain(item.description);
    }
  });

  it('lists them in display order, not alphabetically', () => {
    // The teacher works down the sheet the way the material is taught, so the
    // order on the page has to be the order they meet it in.
    const positions = sheet.items.map((item) => text.indexOf(item.title));
    expect(positions.every((position) => position >= 0)).toBe(true);
    const sorted = [...positions].sort((a, b) => a - b);
    expect(positions).toEqual(sorted);
  });

  it('numbers the entries so the sheet can be worked down', () => {
    // The browser's own list numbers are the point, so this asserts an
    // ordered list rather than the digits being present in the text.
    expect(html).toMatch(/<ol[^>]*class="[^"]*entries/);
  });

  it('carries the Mata Pelajaran of each entry', () => {
    for (const item of sheet.items) {
      expect(item.subject.length).toBeGreaterThan(0);
    }
    expect(text).toContain(sheet.items[0].subject);
  });

  it('links each entry to its Halaman Simulasi', () => {
    // Criterion: on screen the entry is a link, not just words.
    for (const item of sheet.items) {
      expect(html).toContain(`href="${item.url}"`);
    }
  });

  it('shows each address as text, so it survives being printed', () => {
    // A teacher holding the paper cannot click a link. The address is the
    // same string as the href, so one fact is not maintained twice.
    for (const item of sheet.items) {
      expect(text).toContain(item.url);
      expect(item.url).toBe(simulasiUrl(CATALOG.find((e) => e.slug === item.url.split('/').at(-2))!));
    }
  });
});

describe('a sheet is a page of the site', () => {
  const html = htmlAt(SHEETS[0].path);

  it('is reachable from the class page it lists', () => {
    // Nothing in a print stylesheet links a teacher back to the screen, so the
    // class page is the only way in and it has to carry the link.
    for (const sheet of SHEETS) {
      const classPage = `/${sheet.level}/kelas-${sheet.grade}/`;
      expect(htmlAt(classPage)).toContain(`href="${sheet.path}"`);
    }
  });

  it('has a title and a description of its own', () => {
    expect(html).toMatch(/<title>[^<]+<\/title>/);
    expect(html).toMatch(/<meta name="description" content="[^"]+"/);
  });

  it('points its canonical link at itself', () => {
    // The sheet is noindex, but a canonical is still what states which address
    // this is if anything ever links to it.
    const canonical = html.match(/rel="canonical" href="([^"]+)"/)?.[1];
    expect(canonical).toBe(`https://simula.koosty.web.id${SHEETS[0].path}`);
  });

  it('is not indexed, since it repeats the class page at a second address', () => {
    // Two URLs serving the same titles and descriptions split the ranking
    // between them. The sheet is linked from the class page, so it is reachable
    // without being indexed.
    expect(html).toContain('<meta name="robots" content="noindex"');
  });

  it('leads with one heading naming the class', () => {
    // A sheet is read by picking it up, so what class it covers has to be the
    // first thing on it rather than something a reader has to infer.
    const headings = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => m[1].trim());
    expect(headings).toHaveLength(1);
    expect(headings[0]).toContain(`Kelas ${SHEETS[0].grade}`);
  });

  it('keeps its heading levels in step', () => {
    // h1 then h2 per entry: a screen reader announcing a jump from h1 to h3 is
    // the same defect the landing pages had.
    const levels = [...html.matchAll(/<h([1-6])[^>]*>/g)].map((m) => Number(m[1]));
    expect(levels).toContain(1);
    for (let i = 1; i < levels.length; i += 1) {
      expect(levels[i] - levels[i - 1], `lompatan heading: ${levels.join(',')}`).toBeLessThanOrEqual(1);
    }
  });

  it('titles each entry by its simulation alone', () => {
    // The class name belongs in the sheet's own heading. Repeating it on all
    // 23 entries would push every title to the right and cost the sheet a line
    // each, which is most of a page of paper across a term.
    const headings = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => m[1].trim());
    expect(headings).toEqual(SHEETS[0].items.map((item) => item.title));
  });
});

describe('a sheet prints as a sheet', () => {
  const html = htmlAt(SHEETS[0].path);

  /** The <style> blocks of the sheet, concatenated. */
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');

  /**
   * The declarations inside the print block for one selector.
   *
   * Read out of the built stylesheet rather than the source, because what a
   * printer receives is the built sheet. Astro scopes and minifies these rules,
   * so the selector is matched loosely and only the declarations under the print
   * media block are considered.
   */
  function printRulesFor(token: string): string {
    // The print block is the last rule in the stylesheet, so its closing brace
    // is the end of the CSS rather than something followed by a tag.
    const start = css.indexOf('@media print');
    const block = start === -1 ? '' : css.slice(start);
    const found: string[] = [];
    // Each rule is "selector{declarations}"; collect the ones naming the token.
    for (const rule of block.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (rule[1].includes(token)) found.push(rule[2]);
    }
    return found.join(' ');
  }

  it('carries a print stylesheet at all', () => {
    // Without one the sheet prints as the screen page: dark background, white
    // text, and the whole site's navigation down the side.
    expect(css).toContain('@media print');
  });

  it('removes the site navigation from the printed page', () => {
    // Criterion: the sheet prints without navigation or other site chrome. The
    // rule is the only thing standing between a teacher and a page of menus.
    expect(printRulesFor('site-nav')).toMatch(/display:\s*none/);
  });

  it('removes the link back to the class page', () => {
    // Dead weight on paper, and it is a bare line of text a teacher could read
    // as part of the list.
    expect(printRulesFor('.origin')).toMatch(/display:\s*none/);
  });

  it('prints black on white', () => {
    // A dark background spends a cartridge to print a grey page, and light text
    // on a home printer is the classic unreadable sheet.
    expect(css).toMatch(/@media print\s*\{[^}]*html\{[^}]*background:\s*#fff/);
    expect(css).toMatch(/@media print\s*\{[^}]*html\{[^}]*color:\s*#000/);
  });

  it('keeps every printed colour a shade of grey', () => {
    // Criterion: nothing is carried by colour alone. A hue left in the print
    // rules is either wasted ink or, worse, the only thing distinguishing one
    // kind of entry from another.
    //
    // Only the print block is read. The screen rules are deliberately blue and
    // dark, and a printer never sees them; scanning the whole stylesheet would
    // fail on the site being designed for a screen.
    const start = css.indexOf('@media print');
    const printCss = start === -1 ? '' : css.slice(start);
    const hues = [...printCss.matchAll(/#[0-9a-f]{3,6}/gi)]
      .map((m) => m[0].slice(1))
      .filter((hex) => {
        const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
        const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
        return r !== g || g !== b;
      });
    expect(hues).toEqual([]);
  });

  it('underlines the printed address so it reads as a link', () => {
    // On screen colour says "this is a link". Printed in black it would be an
    // ordinary word, and the teacher would not know it is an address to type.
    expect(printRulesFor('.entry-url')).toMatch(/text-decoration:\s*underline/);
  });

  it('does not print the site chrome the sheet never had', () => {
    // The sheet has no related simulations and no filters; if one appeared it
    // would be the first thing on the teacher's desk, taking up the page.
    expect(html).not.toContain('simulation terkait');
    expect(html).not.toContain('class="siblings"');
  });
});

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, sep as pathSep } from 'node:path';
import { parse } from 'yaml';
import { landingPages, landingPath } from '../src/lib/landing';
import { sheetPages } from '../src/lib/sheet';
import type { CatalogEntry } from '../src/lib/types';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = resolve(ROOT, 'dist');
const CATALOG_DIR = resolve(ROOT, 'src/content/simulasi');

/**
 * The catalog as the build read it.
 *
 * Read from the catalog files rather than written down, since simulations arrive
 * through the deploy hook with nobody in the middle. A test that pinned today's
 * number would fail on the next delivery looking like a rendering bug.
 */
const CATALOG: CatalogEntry[] = readdirSync(CATALOG_DIR)
  .filter((name) => name.endsWith('.yaml'))
  .map((name) => {
    const data = parse(readFileSync(resolve(CATALOG_DIR, name), 'utf8'));
    return { ...data, slug: name.replace(/\.yaml$/, '') };
  });

const PAGES = landingPages(CATALOG);

/** Where the printable sheets are served, as dist/ reports them. */
const SHEET_PATHS = new Set(sheetPages(CATALOG).map((sheet) => `${sheet.path}index.html`));

/**
 * The addresses the catalog alone calls for, worked out without landing.ts.
 *
 * Built from the catalog files directly so that a fault in landing.ts cannot
 * move this expectation and the built output together, which would let both
 * agree on something wrong.
 */
const CATALOG_ADDRESSES = new Set<string>([
  ...new Set(CATALOG.map((entry) => landingPath(entry.level, entry.level))),
  ...new Set(CATALOG.map((entry) => landingPath(entry.level, `kelas-${entry.grade}`))),
  ...new Set(CATALOG.map((entry) => landingPath(entry.level, entry.subject))),
]);

/** The built HTML at a landing page's address. */
function htmlAt(path: string): string {
  return readFileSync(resolve(DIST, path.slice(1), 'index.html'), 'utf8');
}

/** The <title> of a built page. */
function titleOf(html: string): string {
  return html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
}

/** The meta description of a built page. */
function descriptionOf(html: string): string {
  return html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
}

describe('the set of landing pages follows the catalog', () => {
  it('builds a page at every address the catalog calls for', () => {
    expect(PAGES.length).toBeGreaterThan(0);
    for (const page of PAGES) {
      expect(existsSync(resolve(DIST, page.path.slice(1), 'index.html'))).toBe(true);
    }
  });

  it('builds no page that the catalog does not call for', () => {
    // The routes generate from the catalog, so a page can only appear by being
    // asked for. This is the other half of that: nothing extra is published.
    const expected = new Set(
      [...CATALOG_ADDRESSES].map((address) => resolve(DIST, address.slice(1), 'index.html')),
    );
    const built = readdirSync(DIST, { recursive: true })
      .filter((name): name is string => typeof name === 'string' && name.endsWith('index.html'))
      .map((name) => name.split(pathSep).join('/'))
      // Pages that are not landing pages, so their presence says nothing about
      // whether the landing routes follow the catalog.
      .filter(
        (name) =>
          name !== 'index.html' &&
          name !== 'katalog/index.html' &&
          name !== 'sitemap/index.html' &&
          !name.startsWith('simulasi/') &&
          // A simulation page is four segments deep; a landing page is one or two.
          !/^smp\/kelas-\d+\/\w+\/[^/]+\/index\.html$/.test(name) &&
          // A printable sheet sits under a class page. It is built from the
          // catalog too, but by the sheet route, and whether it follows the
          // catalog is the sheet's own test to answer. The addresses come
          // from the sheet module rather than a path pattern written out
          // here, so a segment renamed in one place does not quietly match
          // nothing in the other.
          !SHEET_PATHS.has(`/${name}`),
      );
    expect(built.length).toBeGreaterThan(0);
    for (const name of built) {
      expect(expected.has(resolve(DIST, name))).toBe(true);
    }
  });

  it('publishes a landing page for every distinct level in the catalog', () => {
    for (const level of new Set(CATALOG.map((entry) => entry.level))) {
      expect(existsSync(resolve(DIST, landingPath(level, level).slice(1), 'index.html'))).toBe(true);
    }
  });

  it('publishes a landing page for every class in the catalog', () => {
    const classes = new Set(CATALOG.map((entry) => `${entry.level}/kelas-${entry.grade}`));
    for (const key of classes) {
      const [level, segment] = key.split('/');
      expect(existsSync(resolve(DIST, landingPath(level, segment).slice(1), 'index.html'))).toBe(true);
    }
  });

  it('publishes a landing page for every subject in the catalog', () => {
    const subjects = new Set(CATALOG.map((entry) => `${entry.level}/${entry.subject}`));
    for (const key of subjects) {
      const [level, segment] = key.split('/');
      expect(existsSync(resolve(DIST, landingPath(level, segment).slice(1), 'index.html'))).toBe(true);
    }
  });

  it('publishes no landing page for a level, class or subject the catalog lacks', () => {
    // These three are the open set's failure mode: a page with nothing on it.
    for (const path of ['/sma/', '/smp/kelas-9/', '/smp/kimia/']) {
      expect(existsSync(resolve(DIST, path.slice(1), 'index.html'))).toBe(false);
    }
  });
});

describe('a landing page lists the right simulations', () => {
  it('lists every simulation of a Tingkat exactly once', () => {
    const html = htmlAt('/smp/');
    const links = [...html.matchAll(/<a href="\/smp\/kelas-7\/[^/"]+\/([^/"]+)\/"/g)].map((m) => m[1]);
    expect(new Set(links).size).toBe(links.length);
    expect(new Set(links)).toEqual(new Set(CATALOG.map((entry) => entry.slug)));
  });

  it('lists a class page’s simulations in display order', () => {
    const html = htmlAt('/smp/kelas-7/');
    const links = [...html.matchAll(/<a href="\/smp\/kelas-7\/[^/"]+\/([^/"]+)\/"/g)].map((m) => m[1]);
    const expected = [...CATALOG]
      .sort((a, b) => a.order - b.order)
      .map((entry) => entry.slug);
    expect(links).toEqual(expected);
  });

  it('links every card on a landing page to a Halaman Simulasi that exists', () => {
    for (const page of PAGES) {
      const html = htmlAt(page.path);
      const hrefs = [...html.matchAll(/<a href="(\/smp\/kelas-7\/[^/"]+\/[^/"]+\/)"/g)].map((m) => m[1]);
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) {
        expect(existsSync(resolve(DIST, href.slice(1), 'index.html'))).toBe(true);
      }
    }
  });

  it('gives every card a title and a description to choose from', () => {
    const cards = [...htmlAt('/smp/kelas-7/').matchAll(/<li class="card"[\s\S]*?<\/li>/g)].map((m) => m[0]);
    expect(cards).toHaveLength(CATALOG.length);
    for (const card of cards) {
      expect(card).toMatch(/<a href="\/smp\/kelas-7\/[^/"]+\/[^"]+"[^>]*>[^<]+<\/a>/);
      expect(card).toMatch(/<p class="card-description"[^>]*>.{20,}<\/p>/);
    }
  });
});

describe('landing pages are reachable', () => {
  it('links to every other landing page at the same stage', () => {
    // A teacher who bookmarks one class page has to be able to reach the rest
    // of their stage without going back through the Katalog.
    for (const page of PAGES) {
      const html = htmlAt(page.path);
      const siblings = PAGES.filter(
        (candidate) => candidate.level === page.level && candidate.path !== page.path,
      );
      for (const sibling of siblings) {
        expect(html).toContain(`href="${sibling.path}"`);
      }
    }
  });

  it('shows where the reader is on a landing page', () => {
    const html = htmlAt('/smp/kelas-7/');
    // Astro adds data-astro-cid-* to every element, so each assertion matches
    // the attribute and the text rather than the whole tag.
    expect(html).toMatch(/aria-current="page"[^>]*>SMP — Kelas 7</);
    expect(html).toMatch(/<a href="\/katalog\/"[^>]*>Katalog<\/a>/);
    // A class page is two steps from the Katalog: the stage, then the class.
    expect(html).toMatch(/<a href="\/smp\/"[^>]*>SMP<\/a>/);
  });

  it('links every landing page from the Katalog filters', () => {
    // The filters are the route a reader already uses to narrow by level, class
    // or subject, so each choice has to lead somewhere, not filter in place only.
    const katalog = readFileSync(resolve(DIST, 'katalog/index.html'), 'utf8');
    for (const page of PAGES) {
      expect(katalog).toContain(`href="${page.path}"`);
    }
  });
});

describe('landing pages are indexable', () => {
  it('gives every landing page a title of its own', () => {
    const titles = PAGES.map((page) => titleOf(htmlAt(page.path)));
    expect(titles.every((title) => title !== '')).toBe(true);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('gives every landing page a description of its own', () => {
    const descriptions = PAGES.map((page) => descriptionOf(htmlAt(page.path)));
    expect(descriptions.every((description) => description.length > 40)).toBe(true);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it('names the class in a class page’s title', () => {
    expect(titleOf(htmlAt('/smp/kelas-7/'))).toContain('Kelas 7');
  });

  it('points each landing page at itself as canonical', () => {
    expect(htmlAt('/smp/kelas-7/')).toContain(
      '<link rel="canonical" href="https://simula.koosty.web.id/smp/kelas-7/"',
    );
  });

  it('does not ask a crawler to skip a landing page', () => {
    // Only the raw simulation files are noindex; a landing page is how a class
    // is found, so it has to stay indexable.
    expect(htmlAt('/smp/kelas-7/')).not.toContain('name="robots"');
  });
});

describe('landing pages use heading levels a screen reader can follow', () => {
  it('never skips a level on its way down the page', () => {
    // A jump from h1 to h3 leaves a screen reader user with no sense of where
    // they are in the structure. It happened on class pages, where the only
    // section is named by the h1 and so has no subheading of its own.
    for (const page of PAGES) {
      const levels = [...htmlAt(page.path).matchAll(/<(h[1-6])[^>]*>/g)].map((m) =>
        Number(m[1][1]),
      );
      expect(levels.length).toBeGreaterThan(0);
      expect(levels[0]).toBe(1);
      for (const [index, level] of levels.entries()) {
        const previous = levels[index - 1];
        if (previous === undefined) continue;
        expect(level - previous).toBeLessThanOrEqual(1);
      }
    }
  });

  it('names each simulation as a heading on every landing page', () => {
    // The cards are the page's content, so a reader scanning headings has to
    // find them there rather than only as links in a list.
    for (const page of PAGES) {
      const headings = [...htmlAt(page.path).matchAll(/<h[23][^>]*>[^<]*<a href=/g)];
      const expected = page.sections.reduce((total, s) => total + s.simulations.length, 0);
      expect(headings).toHaveLength(expected);
    }
  });
});

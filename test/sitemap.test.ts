import {
  sitemapEntries,
  renderSitemapXml,
  renderRobots,
  SITEMAP_PATH,
  ROBOTS_PATH,
} from '../src/lib/sitemap';
import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';
import type { CatalogEntry } from '../src/lib/types';

const SITE = 'https://simula.koosty.web.id';

function entry(overrides: Partial<CatalogEntry> & { slug: string }): CatalogEntry {
  return {
    title: 'Judul Simulasi',
    description: 'Deskripsi simulasi.',
    level: 'smp',
    grade: 7,
    subject: 'matematika',
    order: 1,
    ...overrides,
  };
}

const CATALOG: CatalogEntry[] = [
  entry({ slug: 'sudut-dalam-segitiga', title: 'Sudut dalam Segitiga', order: 3 }),
  entry({ slug: 'angka-bulat', title: 'Angka Bulat', order: 1 }),
  entry({ slug: 'pecahan', title: 'Pecahan', order: 2 }),
  entry({ slug: 'sma-vektor', title: 'Vektor', level: 'sma', grade: 10, order: 1 }),
];

describe('sitemapEntries', () => {
  it('lists the home page', () => {
    // A crawler arriving with no links at all still finds the site from here.
    const locs = sitemapEntries(CATALOG, SITE).map((e) => e.loc);
    expect(locs).toContain(`${SITE}/`);
  });

  it('lists every landing page', () => {
    const locs = sitemapEntries(CATALOG, SITE).map((e) => e.loc);
    expect(locs).toEqual(
      expect.arrayContaining([
        `${SITE}/smp/`,
        `${SITE}/smp/kelas-7/`,
        `${SITE}/smp/matematika/`,
        `${SITE}/sma/`,
        `${SITE}/sma/kelas-10/`,
      ]),
    );
  });

  it('lists every simulation at its canonical URL', () => {
    const locs = sitemapEntries(CATALOG, SITE).map((e) => e.loc);
    expect(locs).toContain(`${SITE}/smp/kelas-7/matematika/sudut-dalam-segitiga/`);
    expect(locs).toContain(`${SITE}/smp/kelas-7/matematika/angka-bulat/`);
    expect(locs).toContain(`${SITE}/sma/kelas-10/matematika/sma-vektor/`);
  });

  it('lists the Katalog', () => {
    // It is how a searcher reaches a single simulation by name.
    expect(sitemapEntries(CATALOG, SITE).map((e) => e.loc)).toContain(`${SITE}/katalog/`);
  });

  it('never lists a raw simulation file', () => {
    // The tool's own files are noindex (ADR-0005) and are reachable only through
    // the Halaman Simulasi that frames them, so listing them would invite a
    // crawler to index a page the site asks it to skip.
    const xml = renderSitemapXml(CATALOG, SITE);
    expect(xml).not.toContain('/simulasi/');
    expect(xml).not.toContain('.html');
  });

  it('never lists the same address twice', () => {
    // Level is a free-form segment (ADR-0003), so a stage named "katalog"
    // builds the landing address /katalog/ — the address the Katalog itself is
    // served at. They are one URL, so the sitemap carries a single row for it
    // rather than a duplicate a crawler would fetch twice.
    const catalog = [entry({ slug: 'a', level: 'katalog', order: 1 })];
    const locs = sitemapEntries(catalog, SITE).map((e) => e.loc);
    expect(locs.filter((loc) => loc === `${SITE}/katalog/`)).toHaveLength(1);
    expect(new Set(locs).size).toBe(locs.length);
  });

  it('gives every entry words a searcher can match', () => {
    // An entry with an empty title or description is a bare URL to a crawler
    // and a blank row to a reader on the HTML page. None may slip through.
    for (const entry of sitemapEntries(CATALOG, SITE)) {
      expect(entry.title.trim().length, `tanpa judul: ${entry.loc}`).toBeGreaterThan(0);
      expect(entry.description.trim().length, `tanpa deskripsi: ${entry.loc}`).toBeGreaterThan(0);
    }
  });

  it('carries the title and description of every simulation', () => {
    // Criterion 3: the words are what a searcher matches against, and the
    // sitemap protocol has no field for them, so they travel in the entry and
    // the HTML sitemap page reads them back out.
    const entries = sitemapEntries(CATALOG, SITE);
    const sim = entries.find((e) => e.loc.endsWith('/sudut-dalam-segitiga/'));
    expect(sim?.title).toBe('Sudut dalam Segitiga');
    expect(sim?.description).toBe('Deskripsi simulasi.');
  });

  it('carries a title and description for a landing page too', () => {
    const entries = sitemapEntries(CATALOG, SITE);
    const kelas = entries.find((e) => e.loc.endsWith('/smp/kelas-7/'));
    expect(kelas?.title).toContain('Kelas 7');
    expect(kelas?.description.length).toBeGreaterThan(0);
  });

  it('offers an empty site its standing pages rather than nothing', () => {
    // The sitemap must be valid before any simulation is published, and the
    // pages that exist without content are still worth listing.
    expect(sitemapEntries([], SITE).map((e) => e.loc)).toEqual([
      `${SITE}/`,
      `${SITE}/katalog/`,
      `${SITE}/sitemap/`,
    ]);
  });
});

describe('renderSitemapXml', () => {
  const xml = renderSitemapXml(CATALOG, SITE);

  it('declares the sitemap namespace', () => {
    // A sitemap without the namespace is not a sitemap; crawlers reject it.
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
  });

  it('gives every entry a loc, which the protocol requires', () => {
    const locs = xml.match(/<loc>/g) ?? [];
    expect(locs).toHaveLength(sitemapEntries(CATALOG, SITE).length);
  });

  it('ends every URL with a slash, as the site serves them', () => {
    // trailingSlash: 'always' means /smp/ and /smp are different addresses, and
    // only one of them is served.
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      expect(match[1]).toMatch(/\/$/);
    }
  });

  it('escapes the characters that would break the XML', () => {
    // A subject is an open set (ADR-0006), so one may legitimately be named
    // "ilmu & teknologi" and its URL segment would carry an ampersand into the
    // document unescaped, where a crawler would read it as markup.
    const escaped = renderSitemapXml(
      [entry({ slug: 'amp', subject: 'ilmu&teknologi' })],
      SITE,
    );
    expect(escaped).toContain('ilmu&amp;teknologi');
    expect(escaped).not.toMatch(/<loc>[^<]*[^;]&[^a]/);
  });

  it('is parseable XML rather than merely plausible text', () => {
    // Escaping mistakes and unclosed tags both survive a regex check, and both
    // make a crawler discard the whole file rather than part of it.
    expect(() => parse(xml.replace(/<\?xml[^>]*\?>/, ''))).not.toThrow();
  });
});

describe('the paths the two files are served at', () => {
  it('puts the sitemap where robots can name it', () => {
    expect(SITEMAP_PATH).toBe('/sitemap.xml');
  });

  it('puts robots at the address crawlers look for', () => {
    expect(ROBOTS_PATH).toBe('/robots.txt');
  });
});
describe('renderRobots', () => {
  const robots = renderRobots(SITE);

  it('allows crawling', () => {
    // A blanket Disallow would keep every simulation out of the index, which
    // is the opposite of what this ticket is for.
    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).not.toMatch(/Disallow: \//);
  });

  it('names the sitemap at its absolute address', () => {
    // A relative or wrong-host path here means the crawler never finds it.
    expect(robots).toContain(`Sitemap: ${SITE}${SITEMAP_PATH}`);
  });
});

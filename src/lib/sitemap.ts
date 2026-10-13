import type { CatalogEntry } from './types';
import { simulasiUrl } from './catalog';
import { landingPages, landingDescription, landingTitle } from './landing';

/** Where the sitemap is served. Named in robots.txt so crawlers can find it. */
export const SITEMAP_PATH = '/sitemap.xml';

/** Where robots.txt is served. The only address crawlers look for it at. */
export const ROBOTS_PATH = '/robots.txt';

/**
 * The production address, used when Astro has not been given one.
 *
 * astro.config.mjs sets `site`, so this is only a fallback for a build run
 * without it. It is written down once here rather than at each call site,
 * because a sitemap pointing at the wrong host is worse than no sitemap.
 */
export const DEFAULT_SITE = 'https://simula.koosty.web.id';

/**
 * One address a crawler should know about, with the words a searcher matches
 * against.
 *
 * The sitemap protocol has no field for a title or description (sitemaps.org
 * 0.9 defines only loc, lastmod, changefreq and priority), so they travel in
 * the entry and are rendered on the HTML sitemap page. That page is what makes
 * criterion 3 satisfiable at all; the XML alone cannot carry them.
 */
export interface SitemapEntry {
  /** The absolute, canonical URL. */
  loc: string;
  /** The page's own title, in Bahasa Indonesia. */
  title: string;
  /** The page's own description, in Bahasa Indonesia. */
  description: string;
}

/** The pages that exist whatever the catalog holds. */
const ALWAYS: { path: string; title: string; description: string }[] = [
  {
    path: '/',
    title: 'Simula — Katalog Simulasi Pembelajaran',
    description: 'Katalog simulasi pembelajaran interaktif untuk murid dan guru.',
  },
  {
    path: '/katalog/',
    title: 'Katalog Simulasi · Simula',
    description: 'Daftar seluruh simulasi di Simula, dapat disaring menurut tingkat dan kelas.',
  },
  {
    path: '/sitemap/',
    title: 'Peta Situs · Simula',
    description: 'Daftar seluruh halaman di Simula, untuk pembaca maupun mesin pencari.',
  },
];

/**
 * Every address worth indexing, built from the same catalog the pages are.
 *
 * Derived rather than written down so it cannot drift from the URLs those pages
 * are actually served at: a simulation in the catalog is in the sitemap because
 * both read the same list. Raw simulation files are absent on purpose — they
 * are noindex (docs/adr/0005) and reachable only through the page that frames
 * them.
 *
 * The Katalog is listed even though it is not built from the catalog, because a
 * searcher reaching one simulation by name arrives there.
 */
export function sitemapEntries(entries: CatalogEntry[], site: string): SitemapEntry[] {
  const at = (path: string): string => new URL(path, site).href;

  const always = ALWAYS.map((page) => ({ loc: at(page.path), ...page }));

  const landing = landingPages(entries).map((page) => ({
    loc: at(page.path),
    title: landingTitle(page),
    description: landingDescription(page),
  }));

  const simulations = entries.map((entry) => ({
    loc: at(simulasiUrl(entry)),
    title: entry.title,
    description: entry.description,
  }));

  // One row per address. A Map keyed by the URL does this on its own: setting
  // an existing key replaces its value rather than adding a row. That matters
  // because the catalog is authoritative (docs/adr/0004) and the segments are
  // free-form, so a stage or subject may land on an address another kind of
  // page already holds.
  const byLoc = new Map<string, SitemapEntry>();
  for (const entry of [...always, ...landing, ...simulations]) {
    byLoc.set(entry.loc, entry);
  }

  return [...byLoc.values()];
}

/**
 * Escape a value for XML text.
 *
 * The five characters below are the ones that can end an element or start a
 * comment. A title or description containing any of them, as "PK & TK" would,
 * would otherwise produce a document a crawler discards entirely.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * The sitemap document.
 *
 * Only loc is emitted. The other optional tags are hints the protocol itself
 * calls unreliable — a priority does not raise a ranking — and inventing a
 * lastmod would be a claim the build cannot support, since the catalog records
 * no date (see src/lib/home.ts for the same finding).
 */
export function renderSitemapXml(entries: CatalogEntry[], site: string): string {
  const urls = sitemapEntries(entries, site)
    .map((entry) => `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n  </url>`)
    .join('\n');

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${urls}\n` +
    '</urlset>\n'
  );
}

/**
 * robots.txt: crawl everything, and point at the sitemap.
 *
 * The raw simulation files under /simulasi/ are still crawled rather than
 * blocked. They already carry X-Robots-Tag: noindex (docs/adr/0005), which
 * keeps them out of the index while letting a crawler follow the links on them;
 * blocking them here as well would risk the framed pages being discovered
 * nowhere at all.
 */
export function renderRobots(site: string): string {
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${new URL(SITEMAP_PATH, site).href}`, ''].join(
    '\n',
  );
}
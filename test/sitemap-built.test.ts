import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { parse } from 'yaml';
import { simulasiUrl } from '../src/lib/catalog';
import { SITEMAP_PATH, ROBOTS_PATH } from '../src/lib/sitemap';
import type { CatalogEntry } from '../src/lib/types';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = resolve(ROOT, 'dist');
const CATALOG_DIR = resolve(ROOT, 'src/content/simulasi');

// The catalog as the build read it, read from the files. Content arrives
// through the deploy hook with nobody in the middle, so a pinned count would
// fail on the next delivery looking like a broken sitemap.
const CATALOG: CatalogEntry[] = readdirSync(CATALOG_DIR)
  .filter((name) => name.endsWith('.yaml'))
  .map((name) => {
    const data = parse(readFileSync(resolve(CATALOG_DIR, name), 'utf8'));
    return { ...data, slug: name.replace(/\.yaml$/, '') };
  });

const xml = readFileSync(resolve(DIST, SITEMAP_PATH.slice(1)), 'utf8');
const robots = readFileSync(resolve(DIST, ROBOTS_PATH.slice(1)), 'utf8');

/** Every <loc> in the built sitemap. */
function locations(): string[] {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

/** The address a built page is served at, from its path in dist/. */
function addressOf(path: string): string {
  return `https://simula.koosty.web.id${path}`;
}

/**
 * Whether a page asks a crawler to leave it alone.
 *
 * The name and the content are read separately, so this keeps working if the
 * attributes are ever written in another order or the content gains a space. An
 * exact substring match on the whole tag would quietly stop matching after
 * such a change, and every noindex page would then be expected in the sitemap.
 */
function asksNotToBeIndexed(html: string): boolean {
  return [...html.matchAll(/<meta\b[^>]*>/g)]
    .map((m) => m[0])
    .some((tag) => {
      const isRobots = /\bname=["']robots["']/.test(tag);
      const content = tag.match(/\bcontent=["']([^"']*)["']/)?.[1];
      return isRobots && content?.toLowerCase().includes('noindex') === true;
    });
}

/**
 * Every page the build emits that a crawler is allowed to see: not the raw
 * simulation files, and not a page that asks not to be indexed.
 *
 * The noindex pages are read out of the markup rather than matched by name,
 * because a page that asks not to be indexed and still appears in the sitemap
 * is a contradiction, and a path list would have to be kept in step by hand.
 */
function servedPaths(): string[] {
  const paths: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'simulasi') continue;
      const full = resolve(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry === 'index.html') {
        if (asksNotToBeIndexed(readFileSync(full, 'utf8'))) continue;
        const rel = relative(DIST, dir).replace(/\\/g, '/');
        paths.push(rel === '' ? '/' : `/${rel}/`);
      }
    }
  };
  walk(DIST);
  return paths;
}

describe('the built sitemap', () => {
  it('is served at the address robots names', () => {
    expect(existsSync(resolve(DIST, SITEMAP_PATH.slice(1)))).toBe(true);
    expect(robots).toContain(`Sitemap: https://simula.koosty.web.id${SITEMAP_PATH}`);
  });

  it('names every served page, so nothing is left to chance', () => {
    // The whole point of the ticket: a crawler finds every simulation without
    // having to crawl. A page missing here is a page nobody reaches by name.
    const missing = servedPaths().filter((path) => !locations().includes(addressOf(path)));
    expect(missing).toEqual([]);
  });

  it('lists nothing that is not actually served', () => {
    // An entry that 404s wastes a crawler's budget and is read as a broken site.
    const broken = locations().filter((loc) => {
      const path = new URL(loc).pathname;
      return !existsSync(resolve(DIST, path.slice(1), 'index.html'));
    });
    expect(broken).toEqual([]);
  });

  it('lists every simulation in the catalog at its canonical URL', () => {
    for (const entry of CATALOG) {
      expect(locations()).toContain(addressOf(simulasiUrl(entry)));
    }
  });

  it('lists each address once, however many things claim it', () => {
    // The catalog is authoritative (ADR-0004), so a subject may share an address
    // with a class. A duplicate row is a duplicate crawl.
    const locs = locations();
    expect(new Set(locs).size).toBe(locs.length);
  });

  it('lists no raw simulation file', () => {
    // Those are noindex (ADR-0005) and framed by the page that is listed in
    // their place; listing them would invite a crawler to index them.
    expect(xml).not.toContain('/simulasi/');
    expect(locations().some((loc) => loc.endsWith('.html'))).toBe(false);
  });

  it('is valid XML with one host throughout', () => {
    // The protocol requires the namespace, a <loc> per <url>, and a single
    // host. A crawler that finds any of these wrong may discard the file.
    expect(xml).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    const hosts = new Set(locations().map((loc) => new URL(loc).host));
    expect(hosts.size).toBe(1);
    expect(hosts.has('simula.koosty.web.id')).toBe(true);
    expect(xml.match(/<url>/g) ?? []).toHaveLength(locations().length);
  });

  it('stays well inside the size limits', () => {
    // A sitemap over 50,000 URLs or 50MB must be split into an index; at 29
    // entries this cannot happen, but the check is what notices it growing.
    expect(locations().length).toBeLessThan(50_000);
    expect(statSync(resolve(DIST, SITEMAP_PATH.slice(1))).size).toBeLessThan(52_428_800);
  });

  it('matches the canonical link of the page it lists', () => {
    // A sitemap URL that disagrees with the page's own canonical splits the
    // ranking between two addresses, which is what canonical is for.
    for (const entry of CATALOG) {
      const path = simulasiUrl(entry);
      const page = readFileSync(resolve(DIST, path.slice(1), 'index.html'), 'utf8');
      const canonical = page.match(/rel="canonical" href="([^"]+)"/)?.[1];
      expect(canonical).toBe(addressOf(path));
    }
  });
});

describe('the built robots.txt', () => {
  it('allows crawling', () => {
    expect(robots).toContain('User-agent: *');
    expect(robots).not.toMatch(/^Disallow: \/$/m);
  });

  it('is served as plain text at the root', () => {
    // robots.txt is only read at /robots.txt and only as text; served as HTML
    // it is ignored outright.
    expect(existsSync(resolve(DIST, 'robots.txt'))).toBe(true);
    expect(readFileSync(resolve(DIST, 'robots.txt'), 'utf8')).not.toContain('<html');
  });
});

describe('the HTML sitemap page', () => {
  const page = readFileSync(resolve(DIST, 'sitemap/index.html'), 'utf8');
  const text = page
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  it('carries the title and description of every simulation', () => {
    // The sitemap protocol has no field for these, so this page is where a
    // crawler and a reader both find the words a searcher matches against.
    for (const entry of CATALOG) {
      expect(text).toContain(entry.title);
      expect(text).toContain(entry.description);
    }
  });

  it('links to every simulation it lists', () => {
    for (const entry of CATALOG) {
      expect(page).toContain(`href="${simulasiUrl(entry)}"`);
    }
  });

  it('builds no address with a doubled or missing slash', () => {
    // Astro.site is a URL whose string form ends in a slash, so gluing a path
    // onto it yields "https://host//smp/". That happened here and no other test
    // saw it, because every assertion read the catalog and compared loosely.
    // Every href, not only the ones that already look absolute: the fault this
    // guards produced href="katalog/", which a pattern anchored on "/" would
    // not have matched at all.
    // Links to pages on this site. The sitemap.xml link is absolute and is
    // checked by its own test.
    // Anchor links only. The <link rel="canonical"> is an absolute URL and is
    // not a link a reader follows.
    const hrefs = [...page.matchAll(/<a [^>]*href="([^"]*)"/g)].map((m) => m[1]);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href, `tautan rusak: ${href}`).toMatch(/^\//);
      expect(href, `tautan rusak: ${href}`).not.toMatch(/\/\//);
    }
  });

  it('is listed in the sitemap itself rather than being an orphan', () => {
    expect(locations()).toContain(addressOf('/sitemap/'));
    expect(page).toContain(`href="${SITEMAP_PATH}"`);
  });
});
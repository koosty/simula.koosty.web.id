import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, sep as pathSep } from 'node:path';
import { parse } from 'yaml';
import { landingPages } from '../src/lib/landing';
import { navLinksFor } from '../src/lib/nav';
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

/** Every page the site serves, as paths from the site root. */
function builtPages(): string[] {
  return readdirSync(DIST, { recursive: true })
    .filter((name): name is string => typeof name === 'string' && name.endsWith('index.html'))
    .map((name) => `/${name.split(pathSep).join('/').replace(/index\.html$/, '')}`)
    // The raw simulation files are served as documents, not as site pages.
    .filter((path) => !path.startsWith('/simulasi/'));
}

function htmlAt(path: string): string {
  return readFileSync(resolve(DIST, path.slice(1), 'index.html'), 'utf8');
}

/**
 * The navigation items of a built page.
 *
 * Only the list, not the whole <nav>: the site's own name is a link back home
 * but is not a destination a reader navigates to, and counting it would make
 * "Beranda" appear to be linked twice.
 */
function navOf(html: string): { path: string; label: string; current: boolean }[] {
  const list = html.match(/<nav class="site-nav"[\s\S]*?<ul>([\s\S]*?)<\/ul>/)?.[1];
  if (!list) return [];
  return [...list.matchAll(/<a href="([^"]*)"[^>]*>([^<]*)<\/a>/g)].map((match) => ({
    path: match[1],
    label: match[2].trim(),
    // Astro adds data-astro-cid-* to every element, so the attribute is matched
    // rather than the whole tag.
    current: /aria-current="page"/.test(match[0]),
  }));
}

describe('every page carries the site navigation', () => {
  it('puts the navigation on every page the site serves', () => {
    const pages = builtPages();
    expect(pages.length).toBeGreaterThan(1);
    for (const page of pages) {
      expect(htmlAt(page)).toContain('class="site-nav"');
    }
  });

  it('puts the navigation on a simulation page, not only on listings', () => {
    // A reader arrives at a simulation from a search engine more often than
    // from the Katalog, and needs the same way back out from there.
    const simulation = builtPages().find((page) => page.split('/').filter(Boolean).length === 4);
    expect(simulation).toBeDefined();
    expect(navOf(htmlAt(simulation!)).length).toBeGreaterThan(0);
  });

  it('links to the Katalog from every page', () => {
    for (const page of builtPages()) {
      expect(navOf(htmlAt(page)).map((link) => link.path)).toContain('/katalog/');
    }
  });

  it('links every landing page from every page', () => {
    // This is what a site-wide navigation is for: a class or subject is one
    // click away from anywhere, not only from the Katalog.
    const paths = landingPages(CATALOG).map((page) => page.path);
    for (const page of builtPages()) {
      const nav = navOf(htmlAt(page)).map((link) => link.path);
      for (const path of paths) {
        expect(nav).toContain(path);
      }
    }
  });

  it('links nothing the site does not serve', () => {
    for (const page of builtPages()) {
      for (const link of navOf(htmlAt(page))) {
        expect(existsSync(resolve(DIST, link.path.slice(1), 'index.html'))).toBe(true);
      }
    }
  });
});

describe('the navigation marks where the reader is', () => {
  it('marks exactly one link on a landing page', () => {
    for (const page of landingPages(CATALOG)) {
      const current = navOf(htmlAt(page.path)).filter((link) => link.current);
      expect(current.map((link) => link.path)).toEqual([page.path]);
    }
  });

  it('marks the Katalog on the Katalog', () => {
    const current = navOf(htmlAt('/katalog/')).filter((link) => link.current);
    expect(current.map((link) => link.path)).toEqual(['/katalog/']);
  });

  it('marks nothing on a simulation page, which the navigation does not list', () => {
    // A simulation page is not in the navigation, so no link may claim to be
    // where the reader is, or the Katalog would light up on every one.
    const simulation = builtPages().find((page) => page.split('/').filter(Boolean).length === 4)!;
    expect(navOf(htmlAt(simulation)).filter((link) => link.current)).toEqual([]);
  });

  it('marks a link the same way the navigation logic says it should', () => {
    // The built markup and the module must agree, or one of them is lying.
    for (const page of builtPages()) {
      const expected = navLinksFor(CATALOG, page)
        .filter((link) => link.current)
        .map((link) => link.path);
      const actual = navOf(htmlAt(page))
        .filter((link) => link.current)
        .map((link) => link.path);
      expect(actual).toEqual(expected);
    }
  });
});

describe('the navigation is readable and usable', () => {
  it('names itself in Bahasa Indonesia for a screen reader', () => {
    // Without a label a screen reader announces the list with no context, and
    // three lists of links on a landing page are indistinguishable.
    for (const page of builtPages()) {
      expect(htmlAt(page)).toContain('aria-label="Navigasi utama"');
    }
  });

  it('marks the current link for assistive technology, not only in colour', () => {
    expect(htmlAt('/smp/kelas-7/')).toContain('aria-current="page"');
  });

  it('names every link in Bahasa Indonesia', () => {
    for (const link of navOf(htmlAt('/smp/'))) {
      expect(link.label).toMatch(/^(Beranda|Katalog|.* untuk (SMP|Sekolah Dasar|SMA)|SMP|Sekolah Dasar|SMA|SMP — Kelas \d+)$/);
      expect(link.label).not.toMatch(/\b(Home|Search|Simulations|Level|Grade|Subject)\b/);
    }
  });

  it('has a link for every destination it shows', () => {
    // A link with no text is invisible to a reader and to a crawler, which is
    // how a site ends up with pages nobody can find.
    for (const page of builtPages()) {
      for (const link of navOf(htmlAt(page))) {
        expect(link.label.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps the same navigation on every page of the same kind', () => {
    // A reader who learns where the Katalog is on one page must find it in the
    // same place on the next, so the links are identical throughout.
    const onSimulation = navOf(htmlAt(builtPages().find((p) => p.split('/').filter(Boolean).length === 4)!));
    const onLanding = navOf(htmlAt('/smp/'));
    expect(onSimulation.map((l) => l.path)).toEqual(onLanding.map((l) => l.path));
  });
});

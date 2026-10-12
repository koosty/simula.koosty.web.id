import { describe, it, expect } from 'vitest';
import { siteLinksFor, navLinksFor } from '../src/lib/nav';
import type { CatalogEntry } from '../src/lib/types';

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
  entry({ slug: 'a' }),
  entry({ slug: 'b', subject: 'ipa' }),
  entry({ slug: 'c', level: 'sd', grade: 5, subject: 'informatika', order: 2 }),
];

describe('siteLinksFor', () => {
  it('opens with the two pages every reader can reach from anywhere', () => {
    expect(siteLinksFor(CATALOG).slice(0, 2).map((link) => link.path)).toEqual(['/', '/katalog/']);
  });

  it('names both in Bahasa Indonesia', () => {
    expect(siteLinksFor(CATALOG).slice(0, 2).map((link) => link.label)).toEqual(['Beranda', 'Katalog']);
  });

  it('links to the landing pages the catalog calls for', () => {
    // The nav is how a reader reaches a class or subject from any page, so it
    // carries the same set the Katalog does rather than a shorter list.
    // A reader looking for material scans for a class before a subject, so the
    // navigation lists a stage, then its classes, then its subjects.
    expect(siteLinksFor(CATALOG).map((link) => link.path)).toEqual([
      '/',
      '/katalog/',
      '/sd/',
      '/sd/kelas-5/',
      '/sd/informatika/',
      '/smp/',
      '/smp/kelas-7/',
      '/smp/ipa/',
      '/smp/matematika/',
    ]);
  });

  it('offers no landing page for a level the catalog lacks', () => {
    for (const path of siteLinksFor(CATALOG).map((link) => link.path)) {
      expect(path).not.toMatch(/^\/sma\//);
      expect(path).not.toBe('/smp/kelas-9/');
    }
  });

  it('labels a stage by its Indonesian name and a class by stage and grade', () => {
    const labels = new Map(siteLinksFor(CATALOG).map((link) => [link.path, link.label]));
    expect(labels.get('/smp/')).toBe('SMP');
    expect(labels.get('/sd/')).toBe('Sekolah Dasar');
    expect(labels.get('/smp/kelas-7/')).toBe('SMP — Kelas 7');
  });

  it('labels a subject by the stage it sits under, since both can teach it', () => {
    const labels = new Map(siteLinksFor(CATALOG).map((link) => [link.path, link.label]));
    expect(labels.get('/smp/matematika/')).toBe('Matematika untuk SMP');
    expect(labels.get('/sd/informatika/')).toBe('Informatika untuk Sekolah Dasar');
  });

  it('gives every link its own label', () => {
    const labels = siteLinksFor(CATALOG).map((link) => link.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it('offers only the home and Katalog when the catalog is empty', () => {
    // A site with nothing published has nothing to navigate to, and a link to
    // a page that lists nothing is worse than no link.
    expect(siteLinksFor([]).map((link) => link.path)).toEqual(['/', '/katalog/']);
  });
});

describe('navLinksFor', () => {
  it('marks the page the reader is on, so they can tell where they are', () => {
    const links = navLinksFor(CATALOG, '/smp/kelas-7/');
    const current = links.filter((link) => link.current);
    expect(current.map((link) => link.path)).toEqual(['/smp/kelas-7/']);
  });

  it('marks nothing when the reader is on a page the nav does not link to', () => {
    // A simulation page is not in the nav, so no link is current there rather
    // than the Katalog claiming to be where the reader is.
    const links = navLinksFor(CATALOG, '/smp/kelas-7/matematika/a/');
    expect(links.filter((link) => link.current)).toEqual([]);
  });

  it('marks exactly the one page it was asked about', () => {
    for (const path of ['/', '/katalog/', '/smp/', '/smp/ipa/', '/sd/kelas-5/']) {
      const current = navLinksFor(CATALOG, path)
        .filter((link) => link.current)
        .map((link) => link.path);
      expect(current).toEqual([path]);
    }
  });

  it('matches a path with or without its trailing slash', () => {
    // A reader can arrive at /smp/ either way depending on what linked them,
    // and the nav should not claim no link is where they are.
    expect(navLinksFor(CATALOG, '/smp/').find((l) => l.current)?.path).toBe('/smp/');
    expect(navLinksFor(CATALOG, '/smp').find((l) => l.current)?.path).toBe('/smp/');
  });

  it('gives every link text a reader can see', () => {
    // A link with no text is invisible to a reader and to a crawler, which is
    // how a page ends up published and unfindable.
    for (const link of navLinksFor(CATALOG, '/smp/')) {
      expect(link.label.trim().length).toBeGreaterThan(0);
    }
  });
});

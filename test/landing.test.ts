import { describe, it, expect } from 'vitest';
import {
  landingPages,
  landingPath,
  landingPageAt,
  landingTitle,
  landingDescription,
  landingHeading,
  kelasSegment,
} from '../src/lib/landing';
import type { CatalogEntry } from '../src/lib/types';
import type { LandingPage } from '../src/lib/landing';

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
  entry({ slug: 'sudut', title: 'Sudut', order: 1 }),
  entry({ slug: 'keliling', title: 'Keliling', order: 2 }),
  entry({ slug: 'gaya', title: 'Gaya', subject: 'ipa', order: 3 }),
  entry({ slug: 'pecahan', title: 'Pecahan', level: 'sd', grade: 5, order: 4 }),
  entry({ slug: 'segitiga-besar', title: 'Segitiga Besar', grade: 9, order: 5 }),
];

describe('kelasSegment', () => {
  it('reads as a sentence in a URL rather than a bare number', () => {
    expect(kelasSegment(7)).toBe('kelas-7');
  });

  it('matches the segment a simulation URL already uses', () => {
    // A landing page for a class has to sit at the same segment the simulation
    // pages below it use, or the two would disagree about where a class lives.
    expect(kelasSegment(5)).toBe('kelas-5');
  });
});

describe('landingPath', () => {
  it('gives each kind its own address under the same Tingkat', () => {
    expect(landingPath('smp', 'smp')).toBe('/smp/');
    expect(landingPath('smp', 'kelas-7')).toBe('/smp/kelas-7/');
    expect(landingPath('smp', 'matematika')).toBe('/smp/matematika/');
  });

  it('ends in a slash, since the site builds with trailingSlash always', () => {
    for (const segment of ['smp', 'kelas-7', 'matematika']) {
      expect(landingPath('smp', segment).endsWith('/')).toBe(true);
    }
  });

  it('does not collide between a Kelas and a Mata Pelajaran segment', () => {
    // The route reads the second segment to tell the three kinds apart, so a
    // Kelas and a Mata Pelajaran must never produce the same address.
    expect(landingPath('smp', 'kelas-7')).not.toBe(landingPath('smp', '7'));
    expect(landingPath('smp', 'kelas-7')).not.toBe(landingPath('smp', 'matematika'));
  });
});

describe('landingPages', () => {
  it('makes a page for every Tingkat, Kelas and Mata Pelajaran in the catalog', () => {
    const paths = landingPages(CATALOG).map((page) => page.path).sort();
    expect(paths).toEqual([
      // 'pecahan' is an SD simulation of mathematics, so SD gets a stage page,
      // a class page and a subject page of its own.
      '/sd/',
      '/sd/kelas-5/',
      '/sd/matematika/',
      '/smp/',
      '/smp/ipa/',
      '/smp/kelas-7/',
      '/smp/kelas-9/',
      '/smp/matematika/',
    ]);
  });

  it('lists a Tingkat page’s simulations grouped by Kelas', () => {
    const page = landingPages(CATALOG).find((p) => p.path === '/smp/');
    expect(page?.sections.map((s) => s.label)).toEqual(['SMP — Kelas 7', 'SMP — Kelas 9']);
    // 'gaya' is ipa, but it is still a Kelas 7 simulation of this stage.
    expect(page?.sections[0]?.simulations.map((s) => s.slug)).toEqual(['sudut', 'keliling', 'gaya']);
  });

  it('lists a Kelas page’s simulations in display order', () => {
    const page = landingPages(CATALOG).find((p) => p.path === '/smp/kelas-7/');
    expect(page?.sections).toHaveLength(1);
    expect(page?.sections[0]?.simulations.map((s) => s.slug)).toEqual(['sudut', 'keliling', 'gaya']);
  });

  it('lists a Mata Pelajaran page’s simulations grouped by Kelas', () => {
    const page = landingPages(CATALOG).find((p) => p.path === '/smp/matematika/');
    expect(page?.sections.map((s) => s.label)).toEqual(['SMP — Kelas 7', 'SMP — Kelas 9']);
    expect(page?.sections[0]?.simulations.map((s) => s.slug)).toEqual(['sudut', 'keliling']);
  });

  it('gives each level its own subject page, not one page shared across levels', () => {
    // A subject is taught at more than one stage, so the material is split
    // across a page per stage rather than gathered into one.
    const catalog = [
      entry({ slug: 'a', level: 'smp', subject: 'ipa', order: 1 }),
      entry({ slug: 'b', level: 'sma', grade: 10, subject: 'ipa', order: 2 }),
    ];
    const paths = landingPages(catalog).map((p) => p.path);
    expect(paths).toEqual([
      '/sma/',
      '/sma/ipa/',
      '/sma/kelas-10/',
      '/smp/',
      '/smp/ipa/',
      '/smp/kelas-7/',
    ]);
  });

  it('keeps each level’s subject page to that level’s simulations', () => {
    const catalog = [
      entry({ slug: 'a', level: 'smp', subject: 'ipa', order: 1 }),
      entry({ slug: 'b', level: 'sma', grade: 10, subject: 'ipa', order: 2 }),
    ];
    const smp = landingPages(catalog).find((p) => p.path === '/smp/ipa/');
    const sma = landingPages(catalog).find((p) => p.path === '/sma/ipa/');
    expect(smp?.sections.flatMap((s) => s.simulations.map((e) => e.slug))).toEqual(['a']);
    expect(sma?.sections.flatMap((s) => s.simulations.map((e) => e.slug))).toEqual(['b']);
  });


  it('creates a page for a Mata Pel nobody listed in advance', () => {
    // The open set: adding a simulation with a new subject is the only change
    // needed for its landing page to exist.
    const catalog = [...CATALOG, entry({ slug: 'sejarah', subject: 'sejarah', order: 6 })];
    expect(landingPages(catalog).map((p) => p.path)).toContain('/smp/sejarah/');
  });

  it('creates a page for a new Kelas and a new Tingkat the same way', () => {
    const catalog = [
      ...CATALOG,
      entry({ slug: 'ekonomi', level: 'sma', grade: 11, subject: 'ekonomi', order: 6 }),
    ];
    const paths = landingPages(catalog).map((p) => p.path);
    expect(paths).toContain('/sma/');
    expect(paths).toContain('/sma/kelas-11/');
    expect(paths).toContain('/sma/ekonomi/');
  });

  it('returns nothing for an empty catalog', () => {
    // No simulations means no navigation to a page that would be empty, so
    // there is nothing to link to.
    expect(landingPages([])).toEqual([]);
  });

  it('puts each simulation on its own three landing pages and nowhere else', () => {
    const target = CATALOG.find((e) => e.slug === 'keliling')!;
    const pages = landingPages(CATALOG).filter((page) =>
      page.sections.some((section) => section.simulations.some((e) => e.slug === target.slug)),
    );
    expect(pages.map((page) => page.path).sort()).toEqual([
      '/smp/',
      '/smp/kelas-7/',
      '/smp/matematika/',
    ]);
  });

  it('puts a simulation on its landing pages even when two share an order', () => {
    // Order is validated as unique per class, but a landing page must not drop
    // a simulation because its order collided with another's.
    const catalog = [
      entry({ slug: 'a', order: 1 }),
      entry({ slug: 'b', order: 1 }),
    ];
    const page = landingPages(catalog).find((p) => p.path === '/smp/kelas-7/');
    expect(page?.sections[0]?.simulations.map((e) => e.slug).sort()).toEqual(['a', 'b']);
  });
});

describe('landingPageAt', () => {
  it('tells a Tingkat from a Kelas from a Mata Pelajaran by its segment', () => {
    expect(landingPageAt(CATALOG, 'smp', 'smp')?.kind).toBe('tingkat');
    expect(landingPageAt(CATALOG, 'smp', 'kelas-7')?.kind).toBe('kelas');
    expect(landingPageAt(CATALOG, 'smp', 'matematika')?.kind).toBe('mataPelajaran');
  });

  it('finds a page by the exact address the Katalog links to', () => {
    const path = '/smp/kelas-7/';
    const linked = landingPages(CATALOG).find((p) => p.path === path)!;
    expect(landingPageAt(CATALOG, 'smp', 'kelas-7')?.path).toBe(linked.path);
  });

  it('finds a Mata Pelajaran page under its own level', () => {
    expect(landingPageAt(CATALOG, 'sd', 'matematika')?.kind).toBe('mataPelajaran');
  });

  it('returns nothing for a segment the catalog does not contain', () => {
    // The route is dynamic, so it is asked about segments Astro generated.
    // Anything else must not be published as a page that lists nothing.
    expect(landingPageAt(CATALOG, 'smp', 'kelas-4')).toBeUndefined();
    expect(landingPageAt(CATALOG, 'smp', 'sma')).toBeUndefined();
    expect(landingPageAt(CATALOG, 'kimia', 'matematika')).toBeUndefined();
  });
});

describe('landingTitle and landingDescription', () => {
  it('gives every landing page a title no other landing page shares', () => {
    // Search results list titles side by side, so two pages sharing one would
    // make a reader unable to tell which class or subject they landed on.
    const titles = landingPages(CATALOG).map((page) => landingTitle(page));
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('gives every landing page a description no other landing page shares', () => {
    const descriptions = landingPages(CATALOG).map((page) => landingDescription(page));
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it('names the class and its school stage in a Kelas title', () => {
    expect(landingTitle(landingPages(CATALOG).find((p) => p.path === '/smp/kelas-7/')!)).toBe(
      'Simulasi SMP — Kelas 7 · Simula',
    );
  });

  it('names the subject and its level in a Mata Pelajaran title', () => {
    expect(landingTitle(landingPages(CATALOG).find((p) => p.path === '/smp/matematika/')!)).toBe(
      'Simulasi Matematika untuk SMP · Simula',
    );
  });

  it('names the stage in a Tingkat title', () => {
    expect(landingTitle(landingPages(CATALOG).find((p) => p.path === '/smp/')!)).toBe(
      'Simulasi SMP · Simula',
    );
  });

  it('writes every title and description in Bahasa Indonesia', () => {
    for (const page of landingPages(CATALOG)) {
      expect(landingTitle(page)).not.toMatch(/\b(Level|Grade|Subject|Simulations)\b/);
      expect(landingDescription(page)).not.toMatch(/\b(Learning|Explore|View)\b/);
      expect(landingDescription(page).length).toBeGreaterThan(40);
    }
  });

  it('says how many simulations a page holds', () => {
    const page = landingPages(CATALOG).find((p) => p.path === '/smp/kelas-7/')!;
    //sudut, keliling and gaya all belong to this class.
    expect(landingDescription(page)).toContain('3 simulasi');
  });

  it('describes a single simulation in the singular', () => {
    const catalog = [entry({ slug: 'a' })];
    expect(landingDescription(landingPages(catalog).find((p) => p.path === '/smp/kelas-7/')!)).toContain(
      '1 simulasi',
    );
  });

  it('gives a subject page the same description whichever level it is under', () => {
    // The two would differ only in the level name, which is not what the page is
    // about, so the description says what the subject holds.
    const page = landingPages(CATALOG).find((p) => p.path === '/smp/matematika/')!;
    expect(landingDescription(page)).toContain('Matematika');
  });
});

describe('landingHeading', () => {
  it('names the stage on a Tingkat page', () => {
    expect(landingHeading(landingPages(CATALOG).find((p) => p.path === '/smp/')!)).toBe('SMP');
  });

  it('names the stage and the class on a Kelas page', () => {
    expect(landingHeading(landingPages(CATALOG).find((p) => p.path === '/smp/kelas-7/')!)).toBe(
      'SMP — Kelas 7',
    );
  });

  it('names the subject and the stage on a Mata Pelajaran page', () => {
    expect(landingHeading(landingPages(CATALOG).find((p) => p.path === '/smp/matematika/')!)).toBe(
      'Matematika untuk SMP',
    );
  });

  it('gives every landing page a heading of its own', () => {
    const headings = landingPages(CATALOG).map(landingHeading);
    expect(new Set(headings).size).toBe(headings.length);
  });

  it('keeps a Mata Pelajaran heading readable whatever the subject segment is', () => {
    // A subject segment is an open set, so the heading is built from the label
    // rather than from the segment itself.
    const catalog = [entry({ slug: 'a', subject: 'ilmu-pengetahuan-alam' })];
    expect(landingHeading(landingPages(catalog).find((p) => p.kind === 'mataPelajaran')!)).toBe(
      'Ilmu Pengetahuan Alam untuk SMP',
    );
  });

  it('still gives a heading for a page whose sections are empty', () => {
    // The heading must not be read off the first section, or a page with no
    // simulations would lose its title.
    const page: LandingPage = {
      kind: 'kelas',
      level: 'smp',
      segment: 'kelas-7',
      path: '/smp/kelas-7/',
      sections: [],
    };
    expect(landingHeading(page)).toBe('SMP — Kelas 7');
  });
});

import { describe, it, expect } from 'vitest';
import {
  homeBatch,
  homeClassSections,
  homeStages,
  HOME_BATCH_SIZE,
  HOME_CLASS_PREVIEW_SIZE,
} from '../src/lib/home';
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

/** A catalog where every simulation is distinct and in a known order. */
function catalogOf(count: number, overrides: Partial<CatalogEntry> = {}): CatalogEntry[] {
  return Array.from({ length: count }, (_, i) =>
    entry({ slug: `sim-${i + 1}`, title: `Simulasi ${i + 1}`, order: i + 1, ...overrides }),
  );
}

describe('homeBatch', () => {
  it('offers a handful, not the whole catalog', () => {
    // The home page is an entrance, not a second Katalog. The Katalog is one
    // link away and this one has to stay short enough to read on a phone.
    const result = homeBatch(catalogOf(23));
    expect(result).toHaveLength(HOME_BATCH_SIZE);
  });

  it('never offers more than the catalog holds', () => {
    // Asking for six from a catalog of two must show two, not throw and not
    // pad: a catalog smaller than the batch is a site that is simply early.
    expect(homeBatch(catalogOf(2))).toHaveLength(2);
  });

  it('offers nothing from an empty catalog', () => {
    // The home page has to build before anything is published.
    expect(homeBatch([])).toEqual([]);
  });

  it('keeps display order inside the batch', () => {
    const result = homeBatch(catalogOf(10));
    const orders = result.map((e) => e.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('takes the end of the syllabus, not the beginning', () => {
    // The catalog holds no date, so "the latest simulations" cannot be answered
    // honestly by any date field. Display order is the one recency signal the
    // site has: the last material reached is what a class is working on now.
    // Taking the head instead would put the batch and the per-class previews on
    // the same simulations, since the previews start at the beginning.
    const result = homeBatch(catalogOf(10));
    expect(result.map((e) => e.slug)).toEqual([
      'sim-5',
      'sim-6',
      'sim-7',
      'sim-8',
      'sim-9',
      'sim-10',
    ]);
  });
});

describe('homeClassSections', () => {
  it('shows a few simulations from every populated class', () => {
    // Each class gets the same visual weight, so no class needs a prominence
    // field of its own and none can be pushed down the page by another.
    const catalog = [
      ...catalogOf(9, { level: 'smp', grade: 7 }),
      ...catalogOf(9, { level: 'smp', grade: 8 }).map((e, i) => ({ ...e, slug: `smp8-${i}` })),
    ];
    const sections = homeClassSections(catalog);
    expect(sections.map((s) => s.key)).toEqual(['smp/kelas-7', 'smp/kelas-8']);
    for (const section of sections) {
      expect(section.simulations).toHaveLength(HOME_CLASS_PREVIEW_SIZE);
    }
  });

  it('counts every simulation in the class, not only the ones previewed', () => {
    // The count is what tells a reader whether the preview is the whole class,
    // so it has to be the real total or the "lihat semua" link lies.
    const sections = homeClassSections(catalogOf(9));
    expect(sections[0].total).toBe(9);
    expect(sections[0].simulations).toHaveLength(HOME_CLASS_PREVIEW_SIZE);
  });

  it('takes the simulations a class starts with', () => {
    // The beginning of the syllabus is the order the class works through it, so
    // the preview is the first material rather than an arbitrary handful.
    const sections = homeClassSections(catalogOf(9));
    expect(sections[0].simulations.map((e) => e.order)).toEqual([1, 2, 3, 4]);
  });

  it('carries the address of the class page it previews', () => {
    // The section is a way into the class, so it needs somewhere to go.
    const sections = homeClassSections(catalogOf(3));
    expect(sections[0].path).toBe('/smp/kelas-7/');
  });

  it('shows a class with fewer simulations than the preview in full', () => {
    const sections = homeClassSections(catalogOf(2));
    expect(sections[0].simulations).toHaveLength(2);
    expect(sections[0].total).toBe(2);
  });

  it('groups the same grade at two stages separately', () => {
    // Grade 7 at SD and Grade 7 at SMP are different classes in different
    // books, so sharing one section would show a pupil another stage's work.
    const catalog = [
      ...catalogOf(3, { level: 'smp', grade: 7 }),
      ...catalogOf(3, { level: 'sma', grade: 7 }).map((e, i) => ({ ...e, slug: `sma7-${i}` })),
    ];
    const sections = homeClassSections(catalog);
    expect(sections.map((s) => s.key)).toEqual(['smp/kelas-7', 'sma/kelas-7']);
    expect(sections.every((s) => s.simulations.every((e) => e.level === s.level))).toBe(true);
  });

  it('offers nothing from an empty catalog', () => {
    expect(homeClassSections([])).toEqual([]);
  });
});

describe('homeStages', () => {
  it('lists every stage that has simulations', () => {
    const catalog = [
      ...catalogOf(3, { level: 'smp' }),
      ...catalogOf(3, { level: 'sma' }).map((e, i) => ({ ...e, slug: `sma-${i}` })),
    ];
    expect(homeStages(catalog).map((s) => s.path)).toEqual(['/smp/', '/sma/']);
  });

  it('never lists a stage with nothing in it', () => {
    // The catalog is the only source of stages here, so an empty stage cannot
    // be constructed at all. This pins that, so a later change that hard-codes
    // the four stages fails instead of showing an empty section.
    const stages = homeStages(catalogOf(3, { level: 'smp' }));
    expect(stages.map((s) => s.level)).toEqual(['smp']);
  });

  it('counts the simulations behind each stage', () => {
    const catalog = [
      ...catalogOf(3, { level: 'smp' }),
      ...catalogOf(5, { level: 'sma' }).map((e, i) => ({ ...e, slug: `sma-${i}` })),
    ];
    const stages = homeStages(catalog);
    expect(stages.find((s) => s.level === 'smp')?.count).toBe(3);
    expect(stages.find((s) => s.level === 'sma')?.count).toBe(5);
  });

  it('orders stages from primary upwards, not by URL segment', () => {
    // Sorting the segments would put "sma" before "smp" and read backwards.
    const catalog = ['sma', 'smp', 'sd'].flatMap((level, index) =>
      catalogOf(1, { level }).map((e) => ({ ...e, slug: `${level}-${index}` })),
    );
    expect(homeStages(catalog).map((s) => s.level)).toEqual(['sd', 'smp', 'sma']);
  });

  it('offers nothing from an empty catalog', () => {
    expect(homeStages([])).toEqual([]);
  });
});
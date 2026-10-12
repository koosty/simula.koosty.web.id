import { describe, it, expect } from 'vitest';
import { relatedSimulations, RELATED_COUNT } from '../src/lib/related';
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
  entry({ slug: 'a', title: 'A', order: 1 }),
  entry({ slug: 'b', title: 'B', order: 2 }),
  entry({ slug: 'c', title: 'C', order: 3 }),
  entry({ slug: 'd', title: 'D', order: 4 }),
  entry({ slug: 'e', title: 'E', order: 5 }),
  entry({ slug: 'f', title: 'F', order: 6 }),
  entry({ slug: 'g', title: 'G', order: 7 }),
];

describe('relatedSimulations', () => {
  it('offers a handful of neighbours, not the whole subject', () => {
    // The criterion is three to five. More turns the page into a list; fewer
    // and there is nowhere to go next from a short subject.
    const result = relatedSimulations(CATALOG, CATALOG[3]);
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('never offers the simulation the reader is already on', () => {
    const result = relatedSimulations(CATALOG, CATALOG[3]);
    expect(result.map((e) => e.slug)).not.toContain('d');
  });

  it('draws only from the same Mata Pelajaran', () => {
    // A suggestion a reader cannot use in this class is a wasted row.
    const catalog = [
      ...CATALOG,
      entry({ slug: 'ipa-1', subject: 'ipa', order: 8 }),
      entry({ slug: 'ipa-2', subject: 'ipa', order: 9 }),
    ];
    const result = relatedSimulations(catalog, CATALOG[3]);
    expect(result.every((e) => e.subject === 'matematika')).toBe(true);
  });

  it('draws from the same class before the same subject in another class', () => {
    // A teacher in a class is working through that class; the same subject
    // elsewhere is a weaker suggestion than a nearby topic in their own class.
    const catalog = [
      ...CATALOG,
      entry({ slug: 'lain-1', grade: 8, order: 10 }),
      entry({ slug: 'lain-2', grade: 8, order: 11 }),
    ];
    const result = relatedSimulations(catalog, CATALOG[3]);
    expect(result.slice(0, 2).every((e) => e.grade === 7)).toBe(true);
  });

  it('prefers the simulations on either side in display order', () => {
    // 'Sudut dalam Segitiga' should lead to what comes before and after it, so
    // the reader can move along the syllabus rather than restarting it.
    expect(relatedSimulations(CATALOG, CATALOG[3]).map((e) => e.slug)).toEqual([
      'e',
      'c',
      'f',
      'b',
      'g',
    ]);
  });

  it('falls back to the ones before when the reader is near the end', () => {
    expect(relatedSimulations(CATALOG, CATALOG[6]).map((e) => e.slug)).toEqual([
      'f',
      'e',
      'd',
      'c',
      'b',
    ]);
  });

  it('falls back to the ones after when the reader is near the start', () => {
    expect(relatedSimulations(CATALOG, CATALOG[0]).map((e) => e.slug)).toEqual([
      'b',
      'c',
      'd',
      'e',
      'f',
    ]);
  });

  it('offers nothing for a subject with only the simulation being read', () => {
    // There is no next one to offer, and inventing a suggestion from another
    // subject would be worse than showing none.
    expect(relatedSimulations([entry({ slug: 'satu' })], CATALOG[0])).toEqual([]);
  });

  it('offers everything there is when there are fewer than a handful', () => {
    const few = [entry({ slug: 'a', order: 1 }), entry({ slug: 'b', order: 2 })];
    expect(relatedSimulations(few, few[0]).map((e) => e.slug)).toEqual(['b']);
  });

  it('offers nothing for a simulation the catalog does not contain', () => {
    // The page is generated from the catalog, so this cannot arise from a build,
    // but a suggestion list must never include the page's own subject wrongly.
    expect(relatedSimulations(CATALOG, entry({ slug: 'asing', subject: 'ipa' }))).toEqual([]);
  });

  it('never offers a duplicate, even when two share an order', () => {
    // Order is validated as unique per class but only warns, so two entries can
    // tie and the list must still be five distinct simulations.
    const catalog = [
      entry({ slug: 'a', order: 1 }),
      entry({ slug: 'b', order: 1 }),
      entry({ slug: 'c', order: 2 }),
      entry({ slug: 'd', order: 3 }),
      entry({ slug: 'e', order: 4 }),
      entry({ slug: 'f', order: 5 }),
    ];
    const result = relatedSimulations(catalog, catalog[0]);
    expect(new Set(result.map((e) => e.slug)).size).toBe(result.length);
    expect(result).toHaveLength(RELATED_COUNT);
  });

  it('keeps a suggestion list inside one class when the subject spans classes', () => {
    const catalog = [
      ...CATALOG,
      entry({ slug: 'delapan', grade: 8, order: 8 }),
      entry({ slug: 'sembilan', grade: 8, order: 9 }),
    ];
    const result = relatedSimulations(catalog, CATALOG[3]);
    expect(new Set(result.map((e) => e.grade)).size).toBe(1);
  });
});

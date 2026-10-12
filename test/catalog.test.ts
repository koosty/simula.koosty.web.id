import { describe, it, expect } from 'vitest';
import { validateCatalog } from '../src/lib/catalog';
import type { CatalogEntry, SimulationMeta } from '../src/lib/types';

const SIM_META: Record<string, SimulationMeta> = {
  'sudut-dalam-segitiga.html': { level: 'Lower Secondary', grade: 7, title: 'Sudut dalam Segitiga' },
};

function entry(overrides: Partial<CatalogEntry> = {}): CatalogEntry {
  return {
    slug: 'sudut-dalam-segitiga',
    title: 'Sudut dalam Segitiga',
    description: 'Deskripsi.',
    level: 'smp',
    grade: 7,
    subject: 'matematika',
    order: 1,
    ...overrides,
  };
}

describe('catalog validation: hard failures', () => {
  it('fails when an entry names a simulation file that does not exist', () => {
    // The entry points at "sudut-dalam-segitiga.html", but only another file exists.
    const result = validateCatalog([entry()], {
      'lain.html': { level: 'Lower Secondary', grade: 7, title: 'Lain' },
    });
    expect(result.errors.some((e) => e.includes('sudut-dalam-segitiga.html'))).toBe(true);
  });

  it('fails when a simulation file has no catalog entry', () => {
    const orphan = 'tidak-ada-entri.html';
    const result = validateCatalog([entry()], {
      ...SIM_META,
      [orphan]: { level: 'Lower Secondary', grade: 7, title: 'X' },
    });
    expect(result.errors.some((e) => e.includes(orphan))).toBe(true);
  });

  it('fails when two entries produce the same slug', () => {
    // The loader cannot produce this state today, since entry files are named
    // after their slug. This pins the rule the catalog promises, so it still
    // holds if a slug field returns or the loader changes.
    const dupe = [entry({ order: 1 }), entry({ order: 2, title: 'Versi lain' })];
    const result = validateCatalog(dupe, SIM_META);
    expect(result.errors.some((e) => e.includes('slug'))).toBe(true);
  });

  it('passes cleanly when catalog and simulation files agree exactly', () => {
    const result = validateCatalog([entry()], SIM_META);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});

describe('catalog validation: warnings that must not fail the build', () => {
  it('warns when the entry grade disagrees with the simulation', () => {
    const result = validateCatalog([entry({ grade: 8 })], SIM_META);
    expect(result.errors).toEqual([]);
    expect(result.warnings.some((w) => w.includes('kelas'))).toBe(true);
  });

  it('warns when the entry level disagrees with the simulation', () => {
    const result = validateCatalog([entry()], {
      'sudut-dalam-segitiga.html': { level: 'Primary', grade: 7, title: 'Sudut dalam Segitiga' },
    });
    expect(result.errors).toEqual([]);
    expect(result.warnings.some((w) => w.includes('tingkat'))).toBe(true);
  });

  it('warns when two entries share a display order', () => {
    const same = [entry({ order: 3 }), entry({ slug: 'lain', order: 3 })];
    const result = validateCatalog(same, {
      ...SIM_META,
      'lain.html': { level: 'Lower Secondary', grade: 7, title: 'Lain' },
    });
    expect(result.errors).toEqual([]);
    expect(result.warnings.some((w) => w.includes('urutan'))).toBe(true);
  });
});
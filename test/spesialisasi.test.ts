import { describe, it, expect } from 'vitest';
import type { CatalogEntry } from '../src/lib/types';
import { simulasiUrl, simulasiUrlSegments } from '../src/lib/catalog';
import { groupByKelas, buildFilterFields } from '../src/lib/katalogFilter';
import { homeClassSections } from '../src/lib/home';
import { sheetPages } from '../src/lib/sheet';
import { tingkatLabel, TINGKAT } from '../src/lib/tingkat';

const entry = (over: Partial<CatalogEntry>): CatalogEntry => ({
  slug: 'contoh',
  title: 'Contoh',
  description: 'Contoh.',
  level: 'smp',
  grade: 7,
  subject: 'matematika',
  order: 1,
  ...over,
});

const spesialisasi = entry({
  slug: 'pemrograman-dasar',
  level: 'spesialisasi',
  grade: undefined,
  subject: 'informatika',
  order: 1,
});

describe('spesialisasi URLs', () => {
  it('has no class segment, so the address is spesialisasi/<mapel>/<slug>', () => {
    expect(simulasiUrl(spesialisasi)).toBe('/spesialisasi/informatika/pemrograman-dasar/');
  });

  it('keeps the class segment for a Tingkat entry', () => {
    expect(simulasiUrl(entry({ slug: 'sudut' }))).toBe('/smp/kelas-7/matematika/sudut/');
    const segments = simulasiUrlSegments(entry({}));
    expect('kelas' in segments && segments.kelas).toBe('kelas-7');
  });
});

describe('the locked Tingkat list', () => {
  it('is exactly sd, smp, sma, and does not contain smk', () => {
    expect([...TINGKAT]).toEqual(['sd', 'smp', 'sma']);
    expect(tingkatLabel('smk')).toBe('smk');
  });

  it('labels spesialisasi in words, not as a raw segment', () => {
    expect(tingkatLabel('spesialisasi')).toBe('Spesialisasi');
  });
});

describe('grouping', () => {
  it('gives spesialisasi one group with no grade, listed after every class', () => {
    const groups = groupByKelas([spesialisasi, entry({ grade: 8 }), entry({ grade: 7 })]);
    expect(groups.map((g) => g.key)).toEqual(['smp/kelas-7', 'smp/kelas-8', 'spesialisasi']);
    expect(groups[2].grade).toBeUndefined();
    expect(groups[2].label).toBe('Spesialisasi');
  });

  it('offers no Kelas choice for a catalog that only has spesialisasi', () => {
    const grade = buildFilterFields([spesialisasi]).find((f) => f.field === 'grade');
    expect(grade?.choices).toEqual([]);
  });
});

describe('home and printable sheets', () => {
  it('shows no class section and no sheet for spesialisasi', () => {
    const catalog = [spesialisasi];
    expect(homeClassSections(catalog)).toEqual([]);
    expect(sheetPages(catalog)).toEqual([]);
  });

  it('still gives a class section and sheet to a Tingkat entry beside it', () => {
    const catalog = [spesialisasi, entry({})];
    expect(homeClassSections(catalog).map((s) => s.key)).toEqual(['smp/kelas-7']);
    expect(sheetPages(catalog).map((p) => p.path)).toEqual(['/smp/kelas-7/cetak/']);
  });
});

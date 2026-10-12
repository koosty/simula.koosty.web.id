import { describe, it, expect } from 'vitest';
import {
  filterCatalog,
  searchCatalog,
  groupByKelas,
  buildFilterFields,
  subjectLabel,
  KATALOG_FILTER_FIELDS,
} from '../src/lib/katalogFilter';
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
  entry({ slug: 'sudut-dalam-segitiga', title: 'Sudut dalam Segitiga', order: 1 }),
  entry({ slug: 'keliling-segitiga', title: 'Keliling Segitiga', order: 2 }),
  entry({
    slug: 'gaya-pada-sudut',
    title: 'Gaya pada Sudut',
    description: 'Mengenal gaya yang bekerja pada suatu titik.',
    subject: 'ipa',
    order: 3,
  }),
  entry({ slug: 'pecahan-sederhana', title: 'Pecahan Sederhana', grade: 5, level: 'sd', order: 4 }),
  entry({ slug: 'segitiga-besar', title: 'Segitiga Besar', grade: 9, order: 5 }),
];

describe('filterCatalog', () => {
  it('returns everything when nothing is chosen', () => {
    expect(filterCatalog(CATALOG, {})).toHaveLength(CATALOG.length);
  });

  it('narrows to one Tingkat', () => {
    const result = filterCatalog(CATALOG, { level: 'smp' });
    expect(result).toHaveLength(4);
    expect(result.map((e) => e.slug)).not.toContain('pecahan-sederhana');
  });

  it('narrows to one Kelas', () => {
    const result = filterCatalog(CATALOG, { grade: 7 });
    expect(result).toHaveLength(3);
    expect(result.every((e) => e.grade === 7)).toBe(true);
  });

  it('narrows to one Mata Pelajaran', () => {
    const result = filterCatalog(CATALOG, { subject: 'ipa' });
    expect(result.map((e) => e.slug)).toEqual(['gaya-pada-sudut']);
  });

  it('keeps the choices composing rather than overriding', () => {
    // Choosing both must keep simulations matching both, not just the last one.
    const result = filterCatalog(CATALOG, { level: 'smp', subject: 'ipa' });
    expect(result.map((e) => e.slug)).toEqual(['gaya-pada-sudut']);
  });

  it('narrows by all three at once', () => {
    const result = filterCatalog(CATALOG, { level: 'smp', grade: 7, subject: 'ipa' });
    expect(result.map((e) => e.slug)).toEqual(['gaya-pada-sudut']);
  });

  it('narrows by each field on its own, not only in combination', () => {
    // A bug that ignored one field would hide here: each is checked alone.
    expect(filterCatalog(CATALOG, { level: 'sd' }).map((e) => e.slug)).toEqual(['pecahan-sederhana']);
    expect(filterCatalog(CATALOG, { grade: 5 }).map((e) => e.slug)).toEqual(['pecahan-sederhana']);
    expect(filterCatalog(CATALOG, { subject: 'ipa' }).map((e) => e.slug)).toEqual(['gaya-pada-sudut']);
  });

  it('narrows by nothing at all when a field is left unchosen', () => {
    // An unchosen field must not narrow by anything.
    expect(filterCatalog(CATALOG, { subject: 'matematika' })).toHaveLength(4);
  });

  it('returns nothing when the chosen filters contradict each other', () => {
    // A pupil on SD cannot pick a grade 7 matematika simulation.
    expect(filterCatalog(CATALOG, { level: 'sd', grade: 7 })).toEqual([]);
  });
});

describe('searchCatalog', () => {
  it('matches a partial title, ignoring case', () => {
    expect(searchCatalog(CATALOG, 'segit').map((e) => e.slug)).toEqual([
      'sudut-dalam-segitiga',
      'keliling-segitiga',
      'segitiga-besar',
    ]);
  });

  it('matches the description, not only the title', () => {
    expect(searchCatalog(CATALOG, 'gaya yang bekerja').map((e) => e.slug)).toEqual([
      'gaya-pada-sudut',
    ]);
  });

  it('ignores surrounding whitespace in the search term', () => {
    expect(searchCatalog(CATALOG, '  segitiga  ').map((e) => e.slug)).toEqual([
      'sudut-dalam-segitiga',
      'keliling-segitiga',
      'segitiga-besar',
    ]);
  });

  it('matches nothing for a term that appears nowhere', () => {
    expect(searchCatalog(CATALOG, 'foto gravitation')).toEqual([]);
  });

  it('treats an empty term as no search at all', () => {
    expect(searchCatalog(CATALOG, '')).toHaveLength(CATALOG.length);
  });
});
describe('search composed with filters', () => {
  it('looks only within the chosen Mata Pelajaran', () => {
    // Both a matematika and an ipa simulation mention "sudut", so this proves
    // the term was matched against the filtered set, not the whole catalog.
    const result = searchCatalog(filterCatalog(CATALOG, { subject: 'matematika' }), 'sudut');
    expect(result.map((e) => e.slug)).toEqual(['sudut-dalam-segitiga']);
  });

  it('reports nothing when the term only matches outside the filters', () => {
    // "gaya" only exists in ipa, so choosing matematika must hide it.
    expect(searchCatalog(filterCatalog(CATALOG, { subject: 'matematika' }), 'gaya')).toEqual([]);
  });

  it('looks only within the chosen Kelas', () => {
    const result = searchCatalog(filterCatalog(CATALOG, { grade: 9 }), 'segitiga');
    expect(result.map((e) => e.slug)).toEqual(['segitiga-besar']);
  });

  it('finds a match when a search is used with no filters chosen', () => {
    expect(searchCatalog(filterCatalog(CATALOG, {}), 'pecahan').map((e) => e.slug)).toEqual([
      'pecahan-sederhana',
    ]);
  });
});

describe('groupByKelas', () => {
  it('groups by Tingkat and Kelas, in ascending Kelas order', () => {
    expect(groupByKelas(CATALOG).map((g) => g.key)).toEqual([
      'sd/kelas-5',
      'smp/kelas-7',
      'smp/kelas-9',
    ]);
  });

  it('keeps each simulation in display order inside its Kelas', () => {
    const kelas7 = groupByKelas(CATALOG).find((g) => g.key === 'smp/kelas-7');
    expect(kelas7?.simulations.map((e) => e.order)).toEqual([1, 2, 3]);
  });


  it('orders a Kelas whose simulations arrived out of order', () => {
    // The catalog can arrive in any order, so the sort has to do the work
    // rather than relying on how the entries were read.
    const shuffled = [
      entry({ slug: 'keliling-segitiga', title: 'Keliling Segitiga', order: 2 }),
      entry({ slug: 'sudut-dalam-segitiga', title: 'Sudut dalam Segitiga', order: 1 }),
      entry({ slug: 'gaya-pada-sudut', title: 'Gaya pada Sudut', order: 3 }),
    ];
    const kelas7 = groupByKelas(shuffled).find((g) => g.key === 'smp/kelas-7');
    expect(kelas7?.simulations.map((e) => e.slug)).toEqual([
      'sudut-dalam-segitiga',
      'keliling-segitiga',
      'gaya-pada-sudut',
    ]);
  });

  it('orders stages at the same grade the way a pupil moves through school', () => {
    // Comparing the URL segments would put "sma" before "smp", which reads
    // backwards to an Indonesian reader.
    const stages = [
      entry({ slug: 'a', level: 'sma', grade: 7 }),
      entry({ slug: 'b', level: 'smp', grade: 7 }),
      entry({ slug: 'c', level: 'sd', grade: 7 }),
    ];
    expect(groupByKelas(stages).map((g) => g.level)).toEqual(['sd', 'smp', 'sma']);
  });

  it('places the Kelas groups in ascending order, not first-seen order', () => {
    const reversed = [...CATALOG].reverse();
    expect(groupByKelas(reversed).map((g) => g.key)).toEqual([
      'sd/kelas-5',
      'smp/kelas-7',
      'smp/kelas-9',
    ]);
  });

  it('labels each Kelas the way an Indonesian teacher reads it', () => {
    expect(groupByKelas(CATALOG).map((g) => g.label)).toEqual([
      'Sekolah Dasar — Kelas 5',
      'SMP — Kelas 7',
      'SMP — Kelas 9',
    ]);
  });

  it('returns no groups for an empty catalog', () => {
    expect(groupByKelas([])).toEqual([]);
  });
});

describe('buildFilterFields', () => {
  it('offers a filter for every field the ticket names', () => {
    expect(KATALOG_FILTER_FIELDS.map((f) => f.field)).toEqual(['level', 'grade', 'subject']);
  });

  it('offers only choices that have simulations behind them', () => {
    // The catalog has no sma simulation, so no SMA filter may be offered.
    const fields = buildFilterFields(CATALOG);
    const level = fields.find((f) => f.field === 'level');
    expect(level?.choices.map((c) => c.value)).toEqual(['sd', 'smp']);
  });

  it('orders Kelas choices numerically, not alphabetically', () => {
    const fields = buildFilterFields(CATALOG);
    const grade = fields.find((f) => f.field === 'grade');
    expect(grade?.choices.map((c) => c.value)).toEqual([5, 7, 9]);
  });

  it('labels every choice in Indonesian', () => {
    const fields = buildFilterFields(CATALOG);
    const subject = fields.find((f) => f.field === 'subject');
    expect(subject?.choices.map((c) => c.label)).toEqual(['IPA', 'Matematika']);
    const grade = fields.find((f) => f.field === 'grade');
    expect(grade?.choices.map((c) => c.label)).toEqual(['Kelas 5', 'Kelas 7', 'Kelas 9']);
  });

  it('gives an unknown Tingkat its own name rather than dropping it', () => {
    const fields = buildFilterFields([entry({ slug: 'x', level: 'smk' })]);
    const level = fields.find((f) => f.field === 'level');
    expect(level?.choices.map((c) => c.label)).toEqual(['smk']);
  });

  it('lists Tingkat in school order, not alphabetical', () => {
    // Alphabetical would give sd, sma, smp; a reader expects sd, smp, sma.
    const fields = buildFilterFields([
      entry({ slug: 'a', level: 'smp' }),
      entry({ slug: 'b', level: 'sma' }),
      entry({ slug: 'c', level: 'sd' }),
    ]);
    const level = fields.find((f) => f.field === 'level');
    expect(level?.choices.map((c) => c.value)).toEqual(['sd', 'smp', 'sma']);
  });

  it('offers no choices for a filter nothing satisfies', () => {
    const fields = buildFilterFields([]);
    expect(fields.every((f) => f.choices.length === 0)).toBe(true);
  });
});

describe('subjectLabel', () => {
  it('names a subject the way it is taught, wherever it is shown', () => {
    // The card and the filter that narrows to it must read the same word.
    expect(subjectLabel('matematika')).toBe('Matematika');
    expect(subjectLabel('ipa')).toBe('IPA');
  });

  it('shows an unknown subject rather than hiding it', () => {
    expect(subjectLabel('informatika')).toBe('Informatika');
  });

  it('turns a hyphenated segment into readable words', () => {
    // Subjects are an open set, so a new one may arrive hyphenated. A URL
    // segment reaching a heading unaltered would read as a slug, not a subject.
    expect(subjectLabel('ilmu-pengetahuan-alam')).toBe('Ilmu Pengetahuan Alam');
  });

  it('still abbreviates a hyphenated subject that is an abbreviation', () => {
    expect(subjectLabel('ipa-terpadu')).toBe('Ipa Terpadu');
  });
});

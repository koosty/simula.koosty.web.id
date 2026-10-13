import { describe, it, expect } from 'vitest';
import {
  sheetDescription,
  sheetItems,
  sheetPath,
  sheetPages,
  sheetTitle,
} from '../src/lib/sheet';
import type { CatalogEntry } from '../src/lib/types';

/** One catalog entry, overridable field by field. */
function entry(over: Partial<CatalogEntry> & { slug: string }): CatalogEntry {
  return {
    title: `Judul ${over.slug}`,
    description: `Deskripsi ${over.slug}.`,
    level: 'smp',
    grade: 7,
    subject: 'matematika',
    order: 1,
    ...over,
  };
}

describe('sheetPath', () => {
  it('sits under the class it lists, not beside it', () => {
    // A teacher who has the class page open has the sheet one click away,
    // and the sheet is never mistaken for the class page itself.
    expect(sheetPath('smp', 'kelas-7')).toBe('/smp/kelas-7/cetak/');
  });

  it('ends in a slash, since the site builds with trailingSlash always', () => {
    // Without it this names a different address from the page actually served.
    expect(sheetPath('smp', 'kelas-7').endsWith('/')).toBe(true);
  });

  it('names the segment the way a teacher would say it out loud', () => {
    // "cetak" is what a teacher says for print, and every other segment in a
    // URL here is Indonesian (docs/adr/0003).
    expect(sheetPath('smp', 'kelas-7')).toContain('/cetak/');
  });
});

describe('sheetPages', () => {
  it('builds one page per class that has simulations', () => {
    const pages = sheetPages([entry({ slug: 'a' }), entry({ slug: 'b', grade: 8, order: 2 })]);
    expect(pages.map((p) => p.path)).toEqual(['/smp/kelas-7/cetak/', '/smp/kelas-8/cetak/']);
  });

  it('builds no page for a class with no simulations', () => {
    // An empty sheet is a page a teacher prints and finds nothing on, which
    // reads as a broken site rather than as an unfinished one.
    expect(sheetPages([])).toEqual([]);
    expect(sheetPages([entry({ slug: 'a', grade: 8 })])).toHaveLength(1);
    expect(sheetPages([entry({ slug: 'a', grade: 8 })])[0].grade).toBe(8);
  });

  it('counts a page once however many simulations that class has', () => {
    // A class with 23 simulations gets one sheet, not 23. A class repeated per
    // entry would make the routes generate the same address 23 times and
    // Astro would either warn or silently keep the first.
    const pages = sheetPages([
      entry({ slug: 'a', grade: 7, order: 1 }),
      entry({ slug: 'b', grade: 7, order: 2 }),
      entry({ slug: 'c', grade: 7, order: 3 }),
    ]);
    expect(pages).toHaveLength(1);
    expect(pages[0].items).toHaveLength(3);
  });

  it('puts classes in the order a pupil moves through them', () => {
    const pages = sheetPages([
      entry({ slug: 'sma', level: 'sma', grade: 10, order: 3 }),
      entry({ slug: 'smp', level: 'smp', grade: 9, order: 2 }),
      entry({ slug: 'sd', level: 'sd', grade: 6, order: 1 }),
    ]);
    expect(pages.map((p) => p.grade)).toEqual([6, 9, 10]);
  });

  it('keeps one page per class when two stages teach the same grade', () => {
    // Grade 7 exists at more than one stage and they are different classes
    // with different material, so they get separate sheets.
    const pages = sheetPages([entry({ slug: 'smp', level: 'smp' }), entry({ slug: 'smk', level: 'smk' })]);
    expect(pages.map((p) => p.path)).toEqual(['/smp/kelas-7/cetak/', '/smk/kelas-7/cetak/']);
  });

  it('lists the simulations in syllabus order, not catalog or title order', () => {
    // The teacher works down the sheet in the order the material is taught.
    // Display order is the catalog's only statement of that.
    // The titles are deliberately in the reverse of their display order, so a
    // sheet sorted by title passes here only if it is not sorted by title.
    // Titles that happened to sort the same way as their order would let a
    // title sort through this check unnoticed.
    const pages = sheetPages([
      entry({ slug: 'ketiga', title: 'Alfa', order: 3 }),
      entry({ slug: 'pertama', title: 'Zulu', order: 1 }),
      entry({ slug: 'kedua', title: 'Bravo', order: 2 }),
    ]);
    expect(pages[0].items.map((item) => item.title)).toEqual(['Zulu', 'Bravo', 'Alfa']);
  });
});

describe('sheetItems', () => {
  it('carries the title, subject and description each entry needs', () => {
    // These three are what the ticket asks a printed sheet to show, and none of
    // them can be recovered by a reader holding only the paper.
    const [item] = sheetItems([entry({ slug: 'a', title: 'Sudut dalam Segitiga', description: 'Visualisasi 3D.' })]);
    expect(item.title).toBe('Sudut dalam Segitiga');
    expect(item.subject).toBe('Matematika');
    expect(item.description).toBe('Visualisasi 3D.');
  });

  it('labels a subject the way the rest of the site labels it', () => {
    // "matematika" on the sheet and "Matematika" on the class page would read
    // as two different subjects to anyone comparing them.
    const [item] = sheetItems([entry({ slug: 'a', subject: 'ipa' })]);
    expect(item.subject).toBe('IPA');
  });

  it('gives each entry the address of its Halaman Simulasi', () => {
    // Criterion: each entry links to its simulation on screen, and shows the
    // address on paper. Both come from the one function.
    const [item] = sheetItems([entry({ slug: 'sudut-dalam-segitiga' })]);
    expect(item.url).toBe('/smp/kelas-7/matematika/sudut-dalam-segitiga/');
  });

  it('lists nothing for a class with no simulations', () => {
    expect(sheetItems([])).toEqual([]);
  });
});

describe('sheetTitle', () => {
  it('names the class, so two sheets are tellable apart at a glance', () => {
    // A teacher with one sheet per class on the desk needs to know which is
    // which without reading to the bottom of the page.
    expect(sheetTitle({ level: 'smp', grade: 7 })).toContain('Kelas 7');
  });

  it('says the sheet is printable, since that is why it exists', () => {
    expect(sheetTitle({ level: 'smp', grade: 7 }).toLowerCase()).toContain('cetak');
  });

  it('gives two different classes two different titles', () => {
    expect(sheetTitle({ level: 'smp', grade: 7 })).not.toBe(sheetTitle({ level: 'smp', grade: 8 }));
  });

  it('gives two stages at the same grade two different titles', () => {
    // Grade 7 exists at more than one stage and the two are different classes,
    // so their sheets must not read the same in a list of tabs or bookmarks.
    expect(sheetTitle({ level: 'smp', grade: 7 })).not.toBe(sheetTitle({ level: 'smk', grade: 7 }));
  });
});
describe('sheetDescription', () => {
  it('says how many simulations the sheet holds', () => {
    // The count is what tells a teacher the sheet is the whole term's list and
    // not a summary, and it cannot be counted off a dark screen reliably.
    const items = sheetItems([entry({ slug: 'a' }), entry({ slug: 'b', order: 2 })]);
    expect(sheetDescription({ items })).toContain('2 simulasi');
  });

  it('says the sheet is meant to be printed', () => {
    // Otherwise a searcher landing here has no idea what the page is for.
    expect(sheetDescription({ items: [] })).toContain('dicetak');
  });

  it('reads the same for one simulation and for many', () => {
    // Indonesian does not pluralise this noun, so the sentence must not need
    // a special case that a future count would fall out of.
    const one = sheetDescription({ items: sheetItems([entry({ slug: 'a' })]) });
    const many = sheetDescription({ items: sheetItems([entry({ slug: 'a' }), entry({ slug: 'b', order: 2 })]) });
    expect(one.replace('1 simulasi', 'N')).toBe(many.replace('2 simulasi', 'N'));
  });
});

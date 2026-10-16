import type { CatalogEntry } from './types';
import { simulasiUrl } from './catalog';
import { groupByKelas, subjectLabel, type KelasGroup } from './katalogFilter';
import { kelasSegment, landingPath } from './landing';
import { tingkatLabel } from './tingkat';

/**
 * The path segment a printable sheet lives under.
 *
 * Indonesian rather than "print" or "sheet" because every other segment in a
 * URL here is Indonesian (docs/adr/0003), and a teacher looking for the sheet
 * types what they would say for it: "cetak", to print.
 */
// Exported so a test can tie it to the route directory below. Astro takes a
// page's address from the path of its file on disk, so this constant cannot
// itself move the route; the test is what notices when the two disagree.
export const SHEET_SEGMENT = 'cetak';

/**
 * One simulation as a printed sheet carries it.
 *
 * Everything here is read from the sheet with no screen to consult, which is
 * why the address is carried as text and not only as a link: a teacher holding
 * the paper cannot click it.
 */
export interface SheetItem {
  title: string;
  /** The Mata Pelajaran, as the rest of the site writes it. */
  subject: string;
  description: string;
  /** The Halaman Simulasi address: linked on screen, printed as text. */
  url: string;
}

/** One printable sheet: everything a class has, in the order it is taught. */
export interface SheetPage {
  /** The school stage segment, e.g. 'smp'. */
  level: string;
  grade: number;
  /** The address the sheet is served at, always with its trailing slash. */
  path: string;
  items: SheetItem[];
}

/**
 * The address one class's sheet is served at.
 *
 * It sits under the class page rather than beside it or at the top level, so
 * the sheet is one click from the page a teacher is already on and can never
 * be mistaken for that page. The segment is the class segment ('kelas-7') and
 * not a grade, because that is the shape the landing pages carry.
 */
export function sheetPath(level: string, classSegment: string): string {
  // Composed from the class page's own address rather than written out, so the
  // sheet cannot drift away from the page it sits under.
  return `${landingPath(level, classSegment)}${SHEET_SEGMENT}/`;
}

/**
 * Every class that has a sheet, in the order a pupil moves through the classes.
 *
 * A class with no simulations gets no sheet. An empty sheet is a page a
 * teacher prints, finds nothing on, and reads as a broken site rather than as
 * an unfinished one — and nothing in the catalog can describe a class that
 * holds nothing anyway.
 */
export function sheetPages(entries: CatalogEntry[]): SheetPage[] {
  // A printable sheet is per class, and spesialisasi has no class (docs/adr/0027).
  return groupByKelas(entries)
    .filter((group): group is KelasGroup & { grade: number } => group.grade !== undefined)
    .map((group) => ({
      level: group.level,
      grade: group.grade,
      path: sheetPath(group.level, kelasSegment(group.grade)),
      items: sheetItems(group.simulations),
    }));
}

/**
 * The entries of one class as a numbered list, in display order.
 *
 * The numbering restarts at one per class, so a sheet beginning at fourteen
 * because another class had thirteen does not read as a page torn out of a
 * longer document.
 */
export function sheetItems(entries: CatalogEntry[]): SheetItem[] {
  // Sorted here as well as in groupByKelas. The two sorts agree today, and
  // keeping one here means the function is right for whoever calls it next
  // rather than right only because its caller happened to sort first.
  const ordered = [...entries].sort((a, b) => a.order - b.order);

  // The position on the sheet is not a field. The page is an ordered list, so
  // the browser's own numbers are what a teacher ticks off, and they are the
  // ones that keep counting correctly if an entry is ever removed.
  return ordered.map((entry) => ({
    title: entry.title,
    subject: subjectLabel(entry.subject),
    description: entry.description,
    url: simulasiUrl(entry),
  }));
}

/**
 * The title of a sheet.
 *
 * It names the class, because a teacher with one sheet per class on the desk
 * has to tell them apart without reading to the bottom of the page, and it says
 * the sheet is printable, which is the reason the address exists at all.
 */
export function sheetTitle(page: Pick<SheetPage, 'level' | 'grade'>): string {
  return `Daftar Cetak ${tingkatLabel(page.level)} Kelas ${page.grade} · Simula`;
}
/**
 * The description of a sheet: what it holds and that it is meant to be printed.
 *
 * Indonesian does not pluralise this noun, so one simulation and many read the
 * same way here, as they do on the class page.
 */
export function sheetDescription(page: Pick<SheetPage, 'items'>): string {
  return `${page.items.length} simulasi untuk dicetak, disusun sesuai urutan materi pelajaran.`;
}
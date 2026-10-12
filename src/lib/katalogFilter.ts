import type { CatalogEntry } from './types';
import { tingkatLabel, tingkatProgression } from './tingkat';

/** Which simulations to show. An absent field means "do not narrow by this". */
export interface CatalogSelection {
  level?: string;
  grade?: number;
  subject?: string;
}

/** One offered filter choice, built from the catalog rather than a fixed list. */
export interface FilterOption {
  value: string | number;
  label: string;
}

/** The label and catalog field of one filter. */
export interface FilterField {
  field: 'level' | 'grade' | 'subject';
  label: string;
}

/**
 * The filters, in the order a reader works through them: which Tingkat, which
 * Kelas, which Mata Pelajaran.
 *
 * This names the filters only. The choices for each one come from
 * `buildFilterFields`, so the site never offers a filter with nothing behind it
 * and never needs a fixed list updated when content arrives (CONTEXT.md:
 * Mata Pelajaran is an open set).
 */
export const KATALOG_FILTER_FIELDS: FilterField[] = [
  { field: 'level', label: 'Tingkat' },
  { field: 'grade', label: 'Kelas' },
  { field: 'subject', label: 'Mata Pelajaran' },
];

/** One filter with the choices actually present in the catalog. */
export interface BuiltFilterField extends FilterField {
  choices: FilterOption[];
}

/**
 * Subjects that are abbreviations rather than words.
 *
 * The catalog stores the URL segment, which for these is written in lower
 * case ("ipa"), but a reader needs it as it is taught ("IPA"). A subject not
 * listed here is still shown, capitalised as an ordinary word, so the open set
 * stays open; this is only how a handful of existing ones are spelled.
 */
const SUBJECT_ABBREVIATIONS: Record<string, string> = {
  ipa: 'IPA',
  pkn: 'PKn',
  pai: 'PAI',
  fik: 'FIK',
};

/**
 * The Indonesian name of a Mata Pelajaran.
 *
 * Exported so a card and the filter that narrows to it read the same word: a
 * reader must not see "matematika" on the card and "Matematika" in the list
 * beside it.
 *
 * A subject that arrives hyphenated, as a new one in this open set may, has
 * its hyphens read as word breaks rather than reaching a heading as a slug.
 */
export function subjectLabel(subject: string): string {
  if (subject in SUBJECT_ABBREVIATIONS) return SUBJECT_ABBREVIATIONS[subject];
  return subject.split('-').map(capitalise).join(' ');
}

/** Upper-case a segment's first letter, leaving the rest as authored. */
function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * The Indonesian name of one filter choice, whether it is a Tingkat, a Kelas,
 * or a Mata Pelajaran.
 */
function optionLabel(field: FilterField['field'], value: string | number): string {
  if (field === 'level') return tingkatLabel(String(value));
  if (field === 'grade') return `Kelas ${value}`;
  return subjectLabel(String(value));
}

/**
 * Build each filter's choices from the catalog.
 *
 * Only choices with simulations behind them are offered, so choosing a filter
 * never produces an empty list by itself.
 */
export function buildFilterFields(entries: CatalogEntry[]): BuiltFilterField[] {
  return KATALOG_FILTER_FIELDS.map(({ field, label }) => {
    const seen = new Map<string | number, number>();
    for (const entry of entries) {
      const value = entry[field];
      seen.set(value, (seen.get(value) ?? 0) + 1);
    }

    const choices = [...seen.keys()].map((value) => ({ value, label: optionLabel(field, value) }));

    // Kelas reads as a sequence of numbers. Tingkat reads in school order,
    // which sorting the segments would get backwards (sd, sma, smp). Mata
    // Pelajaran sorts by the label the reader actually sees, so a mapping that
    // renames a subject does not reorder the list away from its own wording.
    if (field === 'grade') {
      choices.sort((a, b) => Number(a.value) - Number(b.value));
    } else if (field === 'level') {
      choices.sort((a, b) => tingkatProgression(String(a.value)) - tingkatProgression(String(b.value)));
    } else {
      choices.sort((a, b) => a.label.localeCompare(b.label, 'id'));
    }

    return { field, label, choices };
  });
}

/**
 * Keep only the simulations matching every chosen filter.
 *
 * Filters compose rather than override: choosing a Mata Pelajaran and a Kelas
 * keeps simulations matching both. Contradictory choices simply match nothing.
 */
export function filterCatalog(entries: CatalogEntry[], selection: CatalogSelection): CatalogEntry[] {
  return entries.filter(
    (entry) =>
      (selection.level === undefined || entry.level === selection.level) &&
      (selection.grade === undefined || entry.grade === selection.grade) &&
      (selection.subject === undefined || entry.subject === selection.subject),
  );
}

/**
 * Keep only the simulations whose title or description contain the term.
 *
 * An empty or whitespace-only term is treated as no search, so clearing the box
 * shows everything again rather than an empty list.
 */
export function searchCatalog(entries: CatalogEntry[], term: string): CatalogEntry[] {
  const needle = term.trim().toLowerCase();
  if (needle === '') return entries;
  return entries.filter(
    (entry) =>
      entry.title.toLowerCase().includes(needle) || entry.description.toLowerCase().includes(needle),
  );
}

/** The simulations of one Kelas, plus the Kelas's own heading. */
export interface KelasGroup {
  /** 'smp/kelas-7': stable, readable, and usable as an element id. */
  key: string;
  level: string;
  grade: number;
  /** The heading a reader sees, e.g. 'SMP — Kelas 7'. */
  label: string;
  simulations: CatalogEntry[];
}

/**
 * Group simulations by their Kelas, in ascending grade order.
 *
 * Within a Kelas the simulations keep their catalog display order, which the
 * build validates as unique, so two simulations never tie.
 */
export function groupByKelas(entries: CatalogEntry[]): KelasGroup[] {
  const byKey = new Map<string, KelasGroup>();

  for (const entry of entries) {
    const key = `${entry.level}/kelas-${entry.grade}`;
    let group = byKey.get(key);
    if (!group) {
      group = {
        key,
        level: entry.level,
        grade: entry.grade,
        label: `${tingkatLabel(entry.level)} — Kelas ${entry.grade}`,
        simulations: [],
      };
      byKey.set(key, group);
    }
    group.simulations.push(entry);
  }

  for (const group of byKey.values()) {
    group.simulations.sort((a, b) => a.order - b.order);
  }

  // Classes read from the lowest grade upwards, and at the same grade from the
  // lowest school stage upwards, which is the order a pupil moves through.
  return [...byKey.values()].sort((a, b) => {
    if (a.grade !== b.grade) return a.grade - b.grade;
    return tingkatProgression(a.level) - tingkatProgression(b.level);
  });
}
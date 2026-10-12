import type { CatalogEntry } from './types';

/** How many simulations a page offers to read next. */
export const RELATED_COUNT = 5;

/**
 * The simulations worth reading after this one.
 *
 * A teacher who likes one simulation should be able to keep going without going
 * back to a list, so the suggestions are its neighbours in display order: the
 * next one first, then the one before, then the one after that. That reads as
 * moving along the syllabus rather than restarting it.
 *
 * Drawn from the reader's own class first, since a teacher working through a
 * class is working through that class. A subject taught at more than one level
 * fills any remaining places with the same subject elsewhere, rather than with
 * another subject, which would not be usable in this class.
 *
 * Returns a short list rather than padding it: a subject with nothing else in it
 * has no next simulation, and a suggestion from an unrelated subject is worse
 * than showing none.
 */
export function relatedSimulations(
  entries: CatalogEntry[],
  current: CatalogEntry,
): CatalogEntry[] {
  // Pages are generated from the catalog, so the simulation being read is always
  // in it. Comparing by slug rather than by object identity means a caller that
  // rebuilt the entry still gets the right list, and a simulation the catalog
  // does not hold gets none rather than suggestions for a page that is not there.
  if (!entries.some((entry) => entry.slug === current.slug)) return [];

  const inClass = (entry: CatalogEntry): boolean =>
    entry.level === current.level && entry.grade === current.grade;

  const sameSubject = entries.filter((entry) => entry.subject === current.subject);

  // The current simulation stays in this list: its position is what the walk
  // outwards starts from.
  const classAll = sameSubject.filter(inClass).sort(byOrder);
  const elsewhere = sameSubject
    .filter((entry) => !inClass(entry) && entry.slug !== current.slug)
    .sort(byOrder);

  const position = classAll.findIndex((entry) => entry.slug === current.slug);

  // Walk outwards from the current simulation: the one after it, then the one
  // before, and so on. Stepping outwards rather than taking a slice either side
  // means a reader near the end of a class still gets suggestions, and one near
  // the start is not handed the far end of the syllabus first.
  const neighbours: CatalogEntry[] = [];
  // Bounded by the class length, since a step past either end yields nothing and
  // a loop that only stopped on a full list would never end.
  for (let step = 1; step < classAll.length && neighbours.length < RELATED_COUNT; step += 1) {
    for (const index of [position + step, position - step]) {
      const candidate = classAll[index];
      if (candidate && neighbours.length < RELATED_COUNT) neighbours.push(candidate);
    }
  }

  return [...neighbours, ...elsewhere].slice(0, RELATED_COUNT);
}

/** Display order, with the slug breaking a tie so the list is stable. */
function byOrder(a: CatalogEntry, b: CatalogEntry): number {
  if (a.order !== b.order) return a.order - b.order;
  return a.slug.localeCompare(b.slug);
}

import type { CatalogEntry } from './types';
import { groupByKelas } from './katalogFilter';
import { tingkatLabel, tingkatProgression } from './tingkat';
import { kelasSegment, landingPath } from './landing';

/**
 * How many simulations the home page's opening batch shows.
 *
 * Six is what fits on a phone screen without the reader having to scroll past
 * the batch to reach anything else.
 */
export const HOME_BATCH_SIZE = 6;

/** How many simulations one class is previewed by on the home page. */
export const HOME_CLASS_PREVIEW_SIZE = 4;

/**
 * The opening batch of simulations.
 *
 * The catalog records no date, so the latest simulations cannot be identified
 * by one and calling any set of them "the newest" would be a claim the build
 * cannot support. Display order is the only recency signal the site has, and it
 * is a real one: a class works through the syllabus front to back, so the last
 * material is what is being taught now.
 *
 * The end of the syllabus rather than the beginning, because each class's
 * previews below start at its beginning. Taking the head here too would put the
 * same simulations on screen twice under two different headings.
 */
export function homeBatch(entries: CatalogEntry[]): CatalogEntry[] {
  return displayOrder(entries).slice(-HOME_BATCH_SIZE);
}

/** One class previewed on the home page, with the way into the full class. */
export interface HomeClassSection {
  /** 'smp/kelas-7': stable and readable, as on the class page it links to. */
  key: string;
  level: string;
  /** The heading a reader sees, e.g. 'SMP — Kelas 7'. */
  label: string;
  /** Where the whole class is, so a preview can be a way in rather than a wall. */
  path: string;
  /** How many simulations the class has in all, including those not previewed. */
  total: number;
  /** The first few of them, which is where a class starts. */
  simulations: CatalogEntry[];
}

/**
 * Every populated class, in the order a pupil moves through school, each with
 * the first few of its simulations.
 *
 * Classes are built from the catalog rather than listed in advance, so a stage
 * with nothing published in it gets no section: a section a reader clicks into
 * and finds empty is worse than no section.
 */
export function homeClassSections(entries: CatalogEntry[]): HomeClassSection[] {
  return groupByKelas(entries).map((group) => ({
    key: group.key,
    level: group.level,
    label: group.label,
    path: landingPath(group.level, kelasSegment(group.grade)),
    total: group.simulations.length,
    simulations: group.simulations.slice(0, HOME_CLASS_PREVIEW_SIZE),
  }));
}

/** One school stage the home page links into, with what it holds. */
export interface HomeStage {
  level: string;
  /** The Indonesian name, so a pupil never reads a bare URL segment. */
  label: string;
  path: string;
  /** How many simulations sit behind the link. */
  count: number;
}

/**
 * Every stage holding at least one simulation, from primary upwards.
 *
 * A stage with nothing in it is absent rather than shown as empty, which is
 * what keeps the home page from advertising four stages and delivering one.
 */
export function homeStages(entries: CatalogEntry[]): HomeStage[] {
  const byLevel = new Map<string, number>();
  for (const entry of entries) {
    byLevel.set(entry.level, (byLevel.get(entry.level) ?? 0) + 1);
  }

  return [...byLevel.entries()]
    .sort(([a], [b]) => {
      const byProgression = tingkatProgression(a) - tingkatProgression(b);
      return byProgression !== 0 ? byProgression : a.localeCompare(b, 'id');
    })
    .map(([level, count]) => ({
      level,
      label: tingkatLabel(level),
      path: landingPath(level, level),
      count,
    }));
}

/**
 * The catalog in the order a reader works through it: class by class, and
 * within a class in syllabus order.
 *
 * groupByKelas owns display order, so it is reused rather than sorted again
 * here; a second sort over the same data is a second answer to a question that
 * already has one.
 */
function displayOrder(entries: CatalogEntry[]): CatalogEntry[] {
  return groupByKelas(entries).flatMap((group) => group.simulations);
}
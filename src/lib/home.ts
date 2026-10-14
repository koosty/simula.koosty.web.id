import type { CatalogEntry } from './types';
import { groupByKelas } from './katalogFilter';
import { tingkatLabel, tingkatProgression } from './tingkat';
import { kelasSegment, landingPath } from './landing';

/** How many simulations one class is previewed by on the home page. */
export const HOME_CLASS_PREVIEW_SIZE = 4;

/**
 * The simulation the home page opens with, live, on the first screen.
 *
 * The first in display order: a class works through the syllabus front to back,
 * so the start is where a pupil begins, and the page can say so plainly. Null
 * when the catalog is empty, so the page shows no frame rather than a broken one.
 */
export function homeFeatured<T extends CatalogEntry>(entries: T[]): T | null {
  const first = displayOrder(entries)[0];
  return entries.find((entry) => entry.slug === first?.slug) ?? null;
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
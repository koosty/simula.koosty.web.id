import type { CatalogEntry } from './types';
import { groupByKelas, subjectLabel } from './katalogFilter';
import { tingkatLabel } from './tingkat';

/**
 * What a landing page is about: one school stage, one class, or one subject.
 *
 * A subject page lives under a level because a subject is taught at more than
 * one of them, and a reader looking for the SMP material should not have to
 * guess which level it lives under from the subject name.
 */
export type LandingKind = 'tingkat' | 'kelas' | 'mataPelajaran';

/** One headed run of simulations on a page, which is always one Kelas. */
export interface LandingSection {
  /** 'smp/kelas-7': usable as an element id, and unique within the page. */
  key: string;
  /** The heading a reader sees, e.g. 'SMP — Kelas 7'. */
  label: string;
  simulations: CatalogEntry[];
}

/** The one landing page. Its address is what says which kind it is. */
export interface LandingPage {
  kind: LandingKind;
  /** The school stage segment, e.g. 'smp'. */
  level: string;
  /** The second path segment: the level itself, a class, or a subject. */
  segment: string;
  /** The address the page is served at, always with its trailing slash. */
  path: string;
  sections: LandingSection[];
}

/**
 * The address one landing page is served at.
 *
 * A stage's own page is one segment deep, because a reader who has bookmarked
 * /smp/ expects the stage there and not at /smp/smp/. A class and a subject
 * sit under the stage, since both are taught within one.
 *
 * The trailing slash is required: the site builds with
 * `trailingSlash: 'always'`, so a path without one names a different address
 * from the page that is actually published.
 */
export function landingPath(level: string, segment: string): string {
  return segment === level ? `/${level}/` : `/${level}/${segment}/`;
}

/**
 * The class segment a simulation URL already uses, read the same way here.
 *
 * A class landing page has to sit at the same segment as the simulation pages
 * below it, so this is deliberately the shape `simulasiUrlSegments` builds
 * rather than a bare number.
 */
export function kelasSegment(grade: number): string {
  return `kelas-${grade}`;
}

/**
 * What the second path segment means.
 *
 * All three kinds are served by one dynamic route, so the segment alone has to
 * say which kind is being asked for. A class is the one kind whose segment is
 * not free text: it is always 'kelas-' followed by the grade, which is what
 * keeps the three shapes from overlapping. A subject is any other segment, and
 * a stage is the one whose segment is its own level.
 */
export function landingKindOf(level: string, segment: string): LandingKind {
  if (segment === level) return 'tingkat';
  return /^kelas-\d+$/.test(segment) ? 'kelas' : 'mataPelajaran';
}

/** The grade inside a class segment, e.g. 7 from 'kelas-7'. */
function kelasGrade(segment: string): string {
  return segment.replace(/^kelas-/, '');
}

/** The heading a class is written with, e.g. 'Kelas 7'. */
function kelasHeading(segment: string): string {
  return `Kelas ${kelasGrade(segment)}`;
}

/**
 * Every landing page the catalog calls for, in the order a reader meets them:
 * a stage's own page, then its classes, then its subjects, each in the order
 * `groupByKelas` and `subjectLabel` sort them.
 *
 * Nothing is listed here in advance. A page exists because a simulation in the
 * catalog names the stage, class or subject it belongs to, so a subject nobody
 * has thought of yet gets its page by being added as content.
 */
export function landingPages(entries: CatalogEntry[]): LandingPage[] {
  const byPath = new Map<string, CatalogEntry[]>();

  const collect = (level: string, segment: string, entry: CatalogEntry): void => {
    const path = landingPath(level, segment);
    const collected = byPath.get(path);
    if (collected) collected.push(entry);
    else byPath.set(path, [entry]);
  };

  for (const entry of entries) {
    collect(entry.level, entry.level, entry);
    collect(entry.level, kelasSegment(entry.grade), entry);
    collect(entry.level, entry.subject, entry);
  }

  return [...byPath.keys()]
    .sort((a, b) => a.localeCompare(b, 'id'))
    .map((path) => {
      // A stage's own page is one segment deep and its only segment is the
      // stage, which is also how landingKindOf recognises it.
      const [level, segment = level] = path.split('/').filter(Boolean);
      return {
        kind: landingKindOf(level, segment),
        level,
        segment,
        path,
        // Grouped by Kelas rather than listed flat, so a page spanning more than
        // one class reads in the same order the Katalog does.
        sections: groupByKelas(byPath.get(path) ?? []).map(({ key, label, simulations }) => ({
          key,
          label,
          simulations,
        })),
      };
    });
}

/**
 * The landing page at one address, or nothing when the catalog holds no such
 * page.
 *
 * The route is dynamic, so it is asked about every address it generated. A
 * segment the catalog does not contain returns nothing rather than publishing a
 * page that lists nothing.
 */
export function landingPageAt(
  entries: CatalogEntry[],
  level: string,
  segment: string,
): LandingPage | undefined {
  return landingPages(entries).find((page) => page.path === landingPath(level, segment));
}

/**
 * The visible heading of a landing page.
 *
 * Built from the page's own level and segment rather than read off its first
 * section, so the heading survives a page whose simulations are all gone.
 */
export function landingHeading(page: LandingPage): string {
  switch (page.kind) {
    case 'tingkat':
      return tingkatLabel(page.level);
    case 'kelas':
      return `${tingkatLabel(page.level)} — ${kelasHeading(page.segment)}`;
    default:
      return `${subjectLabel(page.segment)} untuk ${tingkatLabel(page.level)}`;
  }
}

/**
 * The title of a landing page.
 *
 * Every page names what it holds, because two of these titles can sit side by
 * side in a list of search results and a reader has to be able to tell them
 * apart from the titles alone.
 */
export function landingTitle(page: LandingPage): string {
  switch (page.kind) {
    case 'tingkat':
      return `Simulasi ${tingkatLabel(page.level)} · Simula`;
    case 'kelas':
      return `Simulasi ${tingkatLabel(page.level)} — ${kelasHeading(page.segment)} · Simula`;
    default:
      return `Simulasi ${subjectLabel(page.segment)} untuk ${tingkatLabel(page.level)} · Simula`;
  }
}

/**
 * The description of a landing page: what it holds, how much of it there is,
 * and that it opens in a browser.
 *
 * Indonesian does not pluralise this noun, so one simulation and many read the
 * same way here.
 */
export function landingDescription(page: LandingPage): string {
  const count = page.sections.reduce((total, section) => total + section.simulations.length, 0);

  switch (page.kind) {
    case 'tingkat':
      return `${count} simulasi untuk tingkat ${tingkatLabel(page.level)}, disusun per kelas dan dapat langsung dibuka di peramban.`;
    case 'kelas':
      return `${count} simulasi untuk ${tingkatLabel(page.level)} kelas ${kelasGrade(page.segment)}, disusun sesuai urutan materi dan dapat langsung dibuka di peramban.`;
    default:
      return `${count} simulasi mata pelajaran ${subjectLabel(page.segment)} untuk ${tingkatLabel(page.level)}, disusun per kelas dan dapat langsung dibuka di peramban.`;
  }
}

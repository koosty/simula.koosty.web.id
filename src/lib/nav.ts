import type { CatalogEntry } from './types';
import { landingHeading, landingPages, type LandingKind } from './landing';
import { tingkatProgression } from './tingkat';

/** One link in the site navigation. */
export interface NavLink {
  /** The address, always with the trailing slash the site builds with. */
  path: string;
  /** The Bahasa Indonesia text a reader sees. */
  label: string;
  /** True on the page the reader is on. */
  current: boolean;
}

/**
 * The two links that exist whatever the catalog holds.
 *
 * The Katalog is here even before anything is published: it is where a reader
 * goes to find out what exists, so a site with nothing in it still answers.
 */
const ALWAYS: { path: string; label: string }[] = [
  { path: '/', label: 'Beranda' },
  { path: '/katalog/', label: 'Katalog' },
];

/**
 * Every link the site navigation offers.
 *
 * Built from the catalog rather than written out, so a new stage, class or
 * subject reaches the navigation by being added as content. An empty catalog
 * yields only the two pages that always exist, because a link to a page that
 * lists nothing is worse than no link.
 */
export function siteLinksFor(entries: CatalogEntry[]): NavLink[] {
  const pages = landingPages(entries);

  // The navigation reads stage by stage, in the order a pupil moves through
  // school, and within a stage lists the stage itself, then its classes, then
  // its subjects. Sorting by address instead would interleave the two, since
  // every subject segment happens to sort before "kelas-".
  const kindOrder: Record<LandingKind, number> = { tingkat: 0, kelas: 1, mataPelajaran: 2 };
  const byStage = [...pages].sort((a, b) => {
    if (a.level !== b.level) {
      const byProgression = tingkatProgression(a.level) - tingkatProgression(b.level);
      return byProgression !== 0 ? byProgression : a.level.localeCompare(b.level, 'id');
    }
    if (kindOrder[a.kind] !== kindOrder[b.kind]) return kindOrder[a.kind] - kindOrder[b.kind];
    return a.path.localeCompare(b.path, 'id');
  });

  const landing = byStage.map((page) => ({ path: page.path, label: landingHeading(page) }));
  return [...ALWAYS, ...landing].map((link) => ({ ...link, current: false }));
}
/**
 * The navigation for one page, with the page the reader is on marked.
 *
 * The trailing slash is put on both sides before comparing, so a reader who
 * arrived without one is still recognised rather than every link reading as
 * unvisited while the page itself is the current one.
 */
export function navLinksFor(entries: CatalogEntry[], pathname: string): NavLink[] {
  const here = withSlash(pathname);
  return siteLinksFor(entries).map((link) => ({ ...link, current: link.path === here }));
}

/** An address with the trailing slash the site builds with. */
function withSlash(pathname: string): string {
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

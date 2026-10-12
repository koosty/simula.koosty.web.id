import type { CatalogEntry, SimulationMeta, ValidationResult } from './types';
import { LEVEL_BY_SIMULATION_NAME } from './simulations';

/**
 * The path segments of a simulation's URL, in the site's Bahasa order
 * (docs/adr/0003): level, then class, then subject, then the slug.
 *
 * Astro wants these as a route's params and simulasiUrl wants the whole path,
 * so both are built from here rather than written out twice.
 */
export function simulasiUrlSegments(
  entry: Pick<CatalogEntry, 'level' | 'grade' | 'subject' | 'slug'>,
): { tingkat: string; kelas: string; mataPelajaran: string; slug: string } {
  return {
    tingkat: entry.level,
    // The class segment is "kelas-7", not a bare "7", so a URL reads as a
    // sentence to someone who has never seen the site.
    kelas: `kelas-${entry.grade}`,
    mataPelajaran: entry.subject,
    slug: entry.slug,
  };
}

/**
 * The full path a simulation is served at.
 *
 * The trailing slash is required: the site builds with `trailingSlash: 'always'`,
 * so a URL without one is a different address.
 */
export function simulasiUrl(entry: Pick<CatalogEntry, 'level' | 'grade' | 'subject' | 'slug'>): string {
  const s = simulasiUrlSegments(entry);
  return `/${s.tingkat}/${s.kelas}/${s.mataPelajaran}/${s.slug}/`;
}

/**
 * Where the simulation's raw file is served from.
 *
 * `level` is passed in rather than read off the catalog entry on purpose. The
 * build hook writes each file under the level its source folder implies, so
 * deriving the path from the same place is what keeps the iframe from pointing
 * at a file that was never written.
 */
export function simulasiFileUrl(entry: Pick<CatalogEntry, 'slug'>, level: string): string {
  return `/simulasi/${level}/${entry.slug}.html`;
}

/**
 * Map a simulation's own English level onto its Bahasa segment, for comparing a
 * catalog entry against the simulation it describes. An unknown level comes
 * back unchanged, so a mismatch is reported rather than quietly passing.
 */
function levelToSegment(level: string): string {
  const key = level.trim().toLowerCase();
  return LEVEL_BY_SIMULATION_NAME[key] ?? key;
}


/**
 * Cross-check the catalog against the simulation files.
 *
 * Three failures stop the build, because each means a published page would be
 * wrong or missing: an entry naming a file that is not there, a file with no
 * entry, and two entries claiming one slug. Everything else is a warning, since
 * the catalog is authoritative (docs/adr/0004) and a disagreement is a signal
 * to look, not a reason to stop the site from building.
 */
export function validateCatalog(
  entries: CatalogEntry[],
  simulations: Record<string, SimulationMeta>,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const files = Object.keys(simulations);

  // An entry pointing at a file that does not exist would publish a page whose
  // simulation is missing.
  for (const entry of entries) {
    const filename = `${entry.slug}.html`;
    if (!(filename in simulations)) {
      errors.push(`Katalog: entri "${entry.slug}" menunjuk ke berkas ${filename} yang tidak ada.`);
    }
  }

  // A simulation file nobody catalogued would be invisible and unlinked.
  const catalogued = new Set(entries.map((e) => `${e.slug}.html`));
  for (const file of files) {
    if (!catalogued.has(file)) {
      errors.push(`Katalog: berkas simulasi ${file} tidak punya entri katalog.`);
    }
  }


  // Two entries at one URL would make the site publish two pages at the same
  // address, and only one could ever be the real one. Today the loader makes
  // this unreachable: entries are files named <slug>.yaml, so two files mean two
  // slugs. The check stays because the guarantee belongs to the catalog, not to
  // one loader's behaviour, and ADR 0006 records that a separate slug field was
  // dropped. If a slug field ever comes back, or the loader changes, this is
  // what catches the site publishing two pages at one URL.
  const bySlug = new Map<string, CatalogEntry[]>();
  for (const entry of entries) {
    const seen = bySlug.get(entry.slug);
    if (seen) seen.push(entry);
    else bySlug.set(entry.slug, [entry]);
  }
  for (const [slug, group] of bySlug) {
    if (group.length > 1) {
      errors.push(`Katalog: ${group.length} entri memakai slug "${slug}" yang sama.`);
    }
  }

  // Warnings from here on. None of these stop a publish.
  for (const entry of entries) {
    const meta = simulations[`${entry.slug}.html`];
    if (!meta) continue;
    if (Number.isFinite(meta.grade) && meta.grade !== entry.grade) {
      warnings.push(
        `Katalog: entri "${entry.slug}" menulis kelas ${entry.grade}, ` +
          `tetapi simulasinya menulis kelas ${meta.grade}.`,
      );
    }
    if (meta.level && levelToSegment(meta.level) !== entry.level) {
      warnings.push(
        `Katalog: entri "${entry.slug}" menulis tingkat "${entry.level}", ` +
          `tetapi simulasinya menulis "${meta.level}".`,
      );
    }
  }

  const byOrder = new Map<number, string[]>();
  for (const entry of entries) {
    const group = byOrder.get(entry.order);
    if (group) group.push(entry.slug);
    else byOrder.set(entry.order, [entry.slug]);
  }
  for (const [order, slugs] of byOrder) {
    if (slugs.length > 1) {
      warnings.push(`Katalog: urutan ${order} dipakai oleh lebih dari satu entri: ${slugs.join(', ')}.`);
    }
  }

  return { errors, warnings };
}
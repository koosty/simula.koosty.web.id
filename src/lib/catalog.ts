import type { CatalogEntry, SimulationMeta, ValidationResult } from './types';

/**
 * The path a simulation is served at, in Bahasa segments.
 *
 * The source folder layout is English (`lower-secondary/grade-7/`), so this is
 * the one place that translates it. Level is the first segment, then class, then
 * subject, then the slug. Trailing slash is required: the site is built with
 * `trailingSlash: 'always'`, so a URL without one is a different address.
 */
export function simulasiUrl(entry: Pick<CatalogEntry, 'level' | 'grade' | 'subject' | 'slug'>): string {
  return `/${entry.level}/kelas-${entry.grade}/${entry.subject}/${entry.slug}/`;
}

/**
 * Where the simulation's raw file is served from.
 *
 * It must match exactly what src/integrations/copySimulations.ts writes:
 * /simulasi/<tingkat>/<slug>.html. Keeping the same path shape means the raw
 * file has no class or subject in it, which is fine, since it is noindex and
 * only ever linked from its Halaman Simulasi.
 */
export function simulasiFileUrl(entry: Pick<CatalogEntry, 'level' | 'slug'>): string {
  return `/simulasi/${entry.level}/${entry.slug}.html`;
}


const LEVEL_NAMES: Record<string, string> = {
  'lower secondary': 'smp',
  uppersecondary: 'sma',
  primary: 'sd',
  'middle school': 'smp',
};

/**
 * Map a simulation's own English level onto its Bahasa segment, for comparing a
 * catalog entry against the simulation it describes. Unknown levels return the
 * original so a mismatch is reported rather than silently passing.
 */
function levelToSegment(level: string): string {
  return LEVEL_NAMES[level.trim().toLowerCase()] ?? level.trim().toLowerCase();
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
  // address, and only one could ever be the real one.
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
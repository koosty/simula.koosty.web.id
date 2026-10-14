import { getCollection, type CollectionEntry } from 'astro:content';
import { resolve } from 'node:path';
import { validateCatalog } from './catalog';
import { discoverSimulations, simulationMetaOf, levelForSourceFolder } from './simulations';
import type { CatalogEntry, SimulationMeta } from './types';

export type SimulasiEntry = CollectionEntry<'simulasi'>;

/**
 * Where the tool writes its simulations, outside src/.
 *
 * Resolved from the working directory rather than this file's location: the
 * build bundles this module, so its own directory at run time is the emitted
 * chunk, not src/lib. Every build and dev command runs from the project root.
 */
export const SIMULATION_ROOT = resolve(process.cwd(), 'simulations');

/**
 * A catalog entry plus the one thing the catalog does not own: the level of the
 * source folder the simulation file actually came from.
 *
 * The build hook writes each simulation under the level its folder implies, so
 * the iframe path must be built from that same level. Deriving it from the
 * catalog entry instead would mean an entry naming the wrong level publishes a
 * page whose simulation 404s, since a level disagreement is only a warning.
 */
export interface CatalogItem extends CatalogEntry {
  /** The Indonesian level of the folder the simulation file was found in. */
  fileLevel: string;
}

/** The catalog entry as authored, before the file's own level is attached. */
function toCatalogEntry(entry: SimulasiEntry): CatalogEntry {
  return {
    slug: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    level: entry.data.level,
    grade: entry.data.grade,
    subject: entry.data.subject,
    order: entry.data.order,
  };
}

/**
 * Load the Katalog and hold the site to it.
 *
 * Every problem that would publish a wrong or missing page stops the build here,
 * rather than surfacing as a broken link. Warnings are printed and the build
 * continues, because the catalog is authoritative (docs/adr/0004) and a
 * disagreement is a signal to look, not a reason to block a publish.
 */
export async function loadCatalog(): Promise<CatalogItem[]> {
  const entries = (await getCollection('simulasi')).map(toCatalogEntry);
  const { found, unknownFolders } = discoverSimulations(SIMULATION_ROOT);

  for (const folder of unknownFolders) {
    throw new Error(
      `Folder simulasi "${folder}" tidak dikenal. Tambahkan pemetaannya di src/lib/simulations.ts ` +
        `atau pindahkan berkasnya ke folder yang sudah dipetakan.`,
    );
  }

  const simulations: Record<string, SimulationMeta> = {};
  const fileLevels: Record<string, string> = {};
  for (const sim of found) {
    const level = levelForSourceFolder(sim.sourceFolder.split('/')[0]);
    if (!level) continue;
    simulations[sim.filename] = simulationMetaOf(sim.html);
    fileLevels[sim.filename] = level;
  }

  const { errors, warnings } = validateCatalog(entries, simulations);

  for (const warning of warnings) {
    console.warn(`\x1b[33mPeringatan:\x1b[0m ${warning}`);
  }

  if (errors.length > 0) {
    throw new Error(
      `Katalog tidak konsisten dengan berkas simulasi:\n` +
        errors.map((e) => `  - ${e}`).join('\n'),
    );
  }

  return entries.map((entry) => ({
    ...entry,
    fileLevel: fileLevels[`${entry.slug}.html`],
  }));
}

/**
 * The catalog as the pages want it: the authored entries, without the build-only
 * level.
 *
 * Pages that have no use for the folder a simulation file came from should not
 * each repeat the destructure that drops it, because a second build-only field
 * would then mean editing every one of them.
 */
export async function loadCatalogEntries(): Promise<CatalogEntry[]> {
  return (await loadCatalog()).map(({ fileLevel: _fileLevel, ...entry }) => entry);
}

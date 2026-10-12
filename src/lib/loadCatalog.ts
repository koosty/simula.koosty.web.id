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
export const SIMULATION_ROOT = resolve(process.cwd(), 'example-simulations');

/**
 * Turn a collection entry into the flat record the rest of the site uses.
 *
 * The entry's id is the slug: the glob loader keys entries by filename without
 * its extension, and the entry's filename is its slug (docs/adr/0006). A file
 * named `sudut-dalam-segitiga.yaml` therefore describes the simulation at
 * `sudut-dalam-segitiga.html`, and the two cannot drift apart.
 */
export function toCatalogEntry(entry: SimulasiEntry): CatalogEntry {
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
export async function loadCatalog(): Promise<CatalogEntry[]> {
  const entries = (await getCollection('simulasi')).map(toCatalogEntry);
  const { found, unknownFolders } = discoverSimulations(SIMULATION_ROOT);

  for (const folder of unknownFolders) {
    throw new Error(
      `Folder simulasi "${folder}" tidak dikenal. Tambahkan pemetaannya di src/lib/simulations.ts ` +
        `atau pindahkan berkasnya ke folder yang sudah dipetakan.`,
    );
  }

  const simulations: Record<string, SimulationMeta> = {};
  for (const sim of found) {
    const meta = simulationMetaOf(sim.html);
    // A simulation in a folder the site does not serve has no page, so it must
    // not quietly count as catalogued.
    if (!levelForSourceFolder(sim.sourceFolder.split('/')[0])) continue;
    simulations[sim.filename] = meta;
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

  return entries;
}
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Dirent } from 'node:fs';
import type { SimulationMeta } from './types';

/** One simulation file the tool produced, with the English folder it came from. */
export interface DiscoveredSimulation {
  filename: string;
  /** English source folder, e.g. "lower-secondary/grade-7". */
  sourceFolder: string;
  html: string;
}

/** What a scan of the tool's output found, and what it could not place. */
export interface SimulationScan {
  found: DiscoveredSimulation[];
  /** Folders the site has no Indonesian segment for. Never dropped silently. */
  unknownFolders: string[];
}

/**
 * The tool writes English folders; the site serves Indonesian URLs
 * (docs/adr/0003). This is the one place that knows the mapping.
 */
const SOURCE_LEVEL: Record<string, string> = {
  primary: 'sd',
  'lower-secondary': 'smp',
  'middle-school': 'smp',
  'upper-secondary': 'sma',
};

/** The Indonesian segment for a tool folder, or null when the folder is unknown. */
export function levelForSourceFolder(folder: string): string | null {
  return SOURCE_LEVEL[folder] ?? null;
}

/**
 * Scan the tool's output for simulations.
 *
 * Folders are walked rather than listed, so a batch the tool adds later needs no
 * change here. An unknown folder is reported instead of skipped: ignoring it
 * would leave those simulations uncatalogued, and the catalog checks would never
 * get the chance to complain.
 */
export function discoverSimulations(root: string): SimulationScan {
  const found: DiscoveredSimulation[] = [];
  const unknownFolders: string[] = [];

  let stages: Dirent[];
  try {
    stages = readdirSync(root, { withFileTypes: true });
  } catch {
    // No simulation source yet. Not an error: the catalogue can be built before
    // the first batch of simulations arrives.
    return { found, unknownFolders };
  }

  for (const stage of stages) {
    if (!stage.isDirectory()) continue;

    if (!(stage.name in SOURCE_LEVEL)) {
      unknownFolders.push(stage.name);
      continue;
    }

    for (const grade of readdirSync(join(root, stage.name), { withFileTypes: true })) {
      if (!grade.isDirectory()) continue;

      const sourceFolder = `${stage.name}/${grade.name}`;
      for (const file of readdirSync(join(root, sourceFolder))) {
        if (!file.endsWith('.html')) continue;
        found.push({
          filename: file,
          sourceFolder,
          html: readFileSync(join(root, sourceFolder, file), 'utf8'),
        });
      }
    }
  }

  return { found, unknownFolders };
}

/**
 * Read what a simulation declares about itself.
 *
 * The catalog is authoritative (docs/adr/0004), so this is only used to warn
 * when the two disagree, never to fill a gap.
 */
export function simulationMetaOf(html: string): SimulationMeta {
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? '';
  const grade = html.match(/<meta\s+name="grade"\s+content="(\d+)"/)?.[1];
  return {
    // The title carries a course suffix after a middle dot; the simulation's own
    // name is what comes before it.
    title: title.split('\u00b7')[0].trim(),
    grade: grade ? Number(grade) : Number.NaN,
    level: html.match(/<meta\s+name="education_levels"\s+content="([^"]*)"/)?.[1]?.trim() ?? '',
  };
}
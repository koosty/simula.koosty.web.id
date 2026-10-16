import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Dirent } from 'node:fs';
import type { SimulationMeta } from './types';

/** One simulation file the tool produced, with the English folder it came from. */
export interface DiscoveredSimulation {
  filename: string;
  /** Source folder, e.g. "lower-secondary/grade-7/matematika". */
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

/** The Indonesian segment for a tool's folder, keyed by that folder's name. */

/**
 * The same mapping keyed by the wording a simulation uses in its own metadata,
 * which is different from the folder name it arrives in.
 */
export const LEVEL_BY_SIMULATION_NAME: Record<string, string> = {
  primary: 'sd',
  'lower secondary': 'smp',
  'middle school': 'smp',
  uppersecondary: 'sma',
  'upper secondary': 'sma',
};
const SOURCE_LEVEL: Record<string, string> = {
  primary: 'sd',
  'lower-secondary': 'smp',
  'middle-school': 'smp',
  'upper-secondary': 'sma',
  spesialisasi: 'spesialisasi',
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
  const seen = new Map<string, string>();

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

    // Spesialisasi has no class, so its folder holds subjects directly
    // (docs/adr/0027). Every other stage holds grades, then subjects.
    const groups = stage.name === 'spesialisasi'
      ? [{ name: '', isDirectory: () => true }]
      : readdirSync(join(root, stage.name), { withFileTypes: true });
    for (const grade of groups) {
      if (!grade.isDirectory()) continue;

      const gradeFolder = grade.name === '' ? stage.name : `${stage.name}/${grade.name}`;
      for (const entry of readdirSync(join(root, gradeFolder), { withFileTypes: true })) {
        // A simulation sits under its subject. One placed directly in the grade
        // folder has no subject, so it would be filed under whichever subject the
        // catalog happens to name. It is refused rather than guessed at.
        if (entry.isFile() && entry.name.endsWith('.html')) {
          throw new Error(
            `Berkas ${gradeFolder}/${entry.name} berada langsung di folder kelas. ` +
              `Pindahkan ke folder mata pelajarannya, misalnya ${gradeFolder}/matematika/.`,
          );
        }
        if (!entry.isDirectory()) continue;

        const sourceFolder = `${gradeFolder}/${entry.name}`;
        for (const file of readdirSync(join(root, sourceFolder))) {
          if (!file.endsWith('.html')) continue;

          // The copy step writes every simulation flat under its level, so a name
          // used twice would silently replace the first. Names must be unique across
          // every subject and every stage that maps to the same level.
          const earlier = seen.get(file);
          if (earlier) {
            throw new Error(
              `Berkas ${file} ada di ${earlier} dan ${sourceFolder}. ` +
                `Nama berkas harus unik di semua mata pelajaran, karena halaman simulasi memakai nama itu.`,
            );
          }
          seen.set(file, sourceFolder);
          found.push({
            filename: file,
            sourceFolder,
            html: readFileSync(join(root, sourceFolder, file), 'utf8'),
          });
        }
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
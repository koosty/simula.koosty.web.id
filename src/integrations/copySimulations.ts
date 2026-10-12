import type { AstroIntegration } from 'astro';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverSimulations, levelForSourceFolder } from '../lib/simulations';

/**
 * Where the tool writes its simulations, outside src/.
 *
 * Resolved from the working directory rather than this file's location: Astro
 * bundles this integration, so its own directory at run time is the emitted
 * chunk, not src/integrations. The build runs from the project root.
 */
const SIMULATION_ROOT = resolve(process.cwd(), 'example-simulations');

/**
 * Cloudflare Pages reads static response headers from `_headers`. A simulation
 * must stay byte-identical to what the tool produced, so its `noindex` is
 * delivered as a header rather than by editing the file (docs/adr/0005).
 */
const HEADERS = '/simulasi/*\n  X-Robots-Tag: noindex\n';

const NOINDEX_STUB =
  '<!doctype html><html lang="id"><head><meta charset="utf-8">' +
  '<title>Simulasi</title><meta name="robots" content="noindex"></head><body></body></html>';

/**
 * Copy the tool's simulation files into the build output, byte for byte.
 *
 * A simulation is served as its own raw file and framed by its Halaman
 * Simulasi (docs/adr/0005). Injecting a script so it could post its own height,
 * as a resizing library would, would mean editing the tool's output, which this
 * site never does.
 */
export function copySimulations(): AstroIntegration {
  return {
    name: 'copy-simulations',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        // Astro hands the output directory over as a URL object.
        const outDir = dir instanceof URL ? fileURLToPath(dir) : String(dir);
        const { found, unknownFolders } = discoverSimulations(SIMULATION_ROOT);

        for (const folder of unknownFolders) {
          throw new Error(
            `Folder simulasi "${folder}" tidak dikenal. Tambahkan pemetaannya di ` +
              `src/lib/simulations.ts atau pindahkan berkasnya ke folder yang sudah dipetakan.`,
          );
        }

        let copied = 0;
        for (const sim of found) {
          const level = levelForSourceFolder(sim.sourceFolder.split('/')[0]);
          if (!level) continue;

          const target = join(outDir, 'simulasi', level, basename(sim.filename));
          mkdirSync(dirname(target), { recursive: true });
          copyFileSync(join(SIMULATION_ROOT, sim.sourceFolder, sim.filename), target);
          copied += 1;
        }

        // The bare /simulasi/<level>/ directory needs a page of its own, and it
        // must not be indexed either.
        // An unknown level is already reported above, so anything left here has
        // a folder the site serves.
        const levels = new Set(
          found
            .map((s) => levelForSourceFolder(s.sourceFolder.split('/')[0]))
            .filter((level): level is string => level !== null),
        );
        for (const level of levels) {
          const stubDir = join(outDir, 'simulasi', level);
          mkdirSync(stubDir, { recursive: true });
          writeFileSync(join(stubDir, 'index.html'), NOINDEX_STUB);
        }

        writeFileSync(join(outDir, '_headers'), HEADERS);

        logger.info(`Menyalin ${copied} berkas simulasi tanpa mengubah isinya.`);
      },
    },
  };
}
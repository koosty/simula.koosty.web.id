import type { AstroIntegration } from 'astro';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Dirent } from 'node:fs';
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

/** The URL prefix a simulation is served under, matching `rawSimulationPath`. */
const SIMULATION_PREFIX = '/simulasi/';

/**
 * Find the file on disk behind a /simulasi/ request, or null when there is none.
 *
 * The build copies simulations into the output directory, but `astro:build:done`
 * never fires in dev — so in dev the whole directory is missing and every
 * Halaman Simulasi frames a 404. The page renders perfectly and the simulation is
 * simply absent, which is why this is worth resolving on demand rather than
 * waiting for the next build to notice.
 *
 * The request comes from the address bar, so it is treated as untrusted: it is
 * decoded, its shape is checked against the folder the tool writes, and the
 * result is confirmed to sit inside that folder before it is served.
 */
export function resolveSimulationRequest(
  urlPath: string,
  root: string = SIMULATION_ROOT,
): string | null {
  // Cheap rejection first, so an ordinary page request never reaches the
  // directory walk below. This is a speed guard, not a security one: every
  // request it turns away is also refused by the segment count two lines below,
  // which is why no test here can distinguish the two. Mutation testing
  // confirmed it — deleting this line fails nothing. It stays because it keeps
  // the cost of the common case at one string compare.
  if (!urlPath.startsWith(SIMULATION_PREFIX)) return null;

  // A browser normalises `..` before sending, but a hand-written request does
  // not have to, and `%2e%2e` would otherwise survive as a literal directory
  // name and be joined into a path that escapes the simulation folder.
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null; // a malformed escape sequence is not a path
  }
  if (decoded.includes('\0')) return null;

  const segments = decoded.slice(SIMULATION_PREFIX.length).split('/').filter(Boolean);
  // /simulasi/<level>/<file>, and the trailing slash is tolerated because both
  // spellings reach the address bar from a link or a typo.
  if (segments.length !== 2) return null;
  const [level, file] = segments;

  // The empty segment is dropped by `filter(Boolean)` above, so a trailing slash
  // has already been absorbed by the time the extension is checked: both
  // `/simulasi/smp/foo.html` and `/simulasi/smp/foo` reach this line as `foo`.
  if (!file.endsWith('.html') || file.startsWith('.')) return null;

  // The folder that holds this level's simulations is found by walking the
  // tool's own output rather than by rebuilding the mapping here: the folders
  // are English and the mapping is the one thing that knows how they become
  // Indonesian (docs/adr/0003), so it is asked rather than duplicated. A level
  // can have more than one source folder — `lower-secondary` and `middle-school`
  // are both `smp` — so every folder that maps to this level is tried.
  const rootDir = resolve(root);
  let stages: Dirent[];
  try {
    stages = readdirSync(rootDir, { withFileTypes: true });
  } catch {
    return null; // no simulations have been written yet
  }

  for (const stage of stages) {
    if (!stage.isDirectory() || levelForSourceFolder(stage.name) !== level) continue;
    for (const grade of readdirSync(join(rootDir, stage.name), { withFileTypes: true })) {
      if (!grade.isDirectory()) continue;
      // No further containment check is needed, and one here would be dead
      // code. `file` is a single segment that neither ends in anything but
      // `.html` nor starts with a dot, and the stage and grade names both come
      // from readdir rather than the request — so nothing left to join can
      // climb out. Checked by exhausting the shapes that reach this line; the
      // test asserts the outcome rather than a guard that cannot fail.
      const candidate = join(rootDir, stage.name, grade.name, file);
      if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
    }
  }
  return null;
}

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
      // `astro:build:done` never fires in dev, so the hook below does not run
      // there and /simulasi/ is empty: every Halaman Simulasi frames a 404
      // while the page around it looks complete. The middleware serves the same
      // files from source, so a simulation behaves in dev as it does deployed.
      //
      // Only registered for dev. In a build the copy is what serves them, and a
      // second route to the same bytes would be one more thing to keep true.
      'astro:config:setup': ({ command, addMiddleware }) => {
        if (command !== 'dev') return;
        addMiddleware({
          order: 'pre',
          entrypoint: fileURLToPath(new URL('./serveSimulations.ts', import.meta.url)),
        });
      },
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
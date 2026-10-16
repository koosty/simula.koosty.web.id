#!/usr/bin/env node
/**
 * Publish a batch of simulations from courses/ into this site.
 *
 * Reads each course's outline and its scene files under courses/ in this
 * repository, decides what each scene would do to the site, and writes the
 * simulation files and catalog entries (docs/adr/0026).
 *
 * Nothing here renames or deletes. A simulation whose content the tool rewrote
 * keeps its file name, its catalog entry and its URL (docs/adr/0007), so a
 * published link and its search ranking survive the correction.
 *
 * Run with --check it writes nothing and only reports, which is what a hook
 * should call to find out whether there is anything to publish.
 *
 *   npm run publish:check
 *   npm run publish
 *
 *   --tool    a course directory, to publish one that is not under courses/.
 *             Defaults to the courses/ folder of this repository.
 *   --check   decide and report, write nothing
 *   --trigger POST the deploy hook named by SIMULA_DEPLOY_HOOK when done
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { parse } from 'yaml';
import {
  planPublish,
  validateRenameIntent,
  catalogPathFor,
  simulationPathFor,
  subjectOf,
} from '../src/lib/publish.ts';
import { checkDeployHook } from '../src/lib/deployHook.ts';

/**
 * How long to wait for the hook to acknowledge a rebuild request.
 *
 * The hook answers as soon as the build is queued, not when it finishes, so
 * this only has to cover the round trip. It is here so that a hook which never
 * answers fails the publish instead of hanging it, with the batch already
 * written and nothing to show for the wait.
 */
const DEPLOY_HOOK_TIMEOUT_MS = 30_000;

const args = process.argv.slice(2);

function flag(name) {
  return args.includes(`--${name}`);
}

function option(name) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? null : args[index + 1];
}

const TRIGGER = flag('trigger');
const CHECK_ONLY = flag('check');

// Without --tool the repository root is searched, and findCourseDir looks in
// its courses/ folder. That folder is not tracked by Git (docs/adr/0026).
const toolArg = option('tool') ?? resolve('.');

if (!existsSync(toolArg)) {
  console.error(
    `Folder tidak ditemukan: ${toolArg}\n` +
      'Buat courses/<slug>/ di repo ini, atau beri path dengan --tool <path>.\n' +
      'Subject, stage dan grade dibaca dari nama course kalau namanya "<mapel>-<smp>-kelas-<vii>";\n' +
      'kalau tidak, isi flag-nya. Stage: primary, lower-secondary, upper-secondary.',
  );
  process.exit(2);
}

/** The course directory holding outline.yaml and scenes/. */
function findCourseDir(root) {
  if (existsSync(join(root, 'outline.yaml'))) return root;
  const coursesDir = join(root, 'courses');
  if (!existsSync(coursesDir)) return null;
  const found = readdirSync(coursesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(coursesDir, d.name))
    .filter((dir) => existsSync(join(dir, 'outline.yaml')));
  if (found.length === 0) return null;
  if (found.length > 1) {
    throw new Error(
      `Ada ${found.length} course di ${coursesDir}: ${found.map(basename).join(', ')}. ` +
        `Sebutkan course yang dimaksud dengan --tool <course-dir>.`,
    );
  }
  return found[0];
}

/**
 * The folder the site's simulation scanner looks in: stage, grade, then subject.
 *
 * Read from the course folder name when the name carries them: the tool names
 * a course "<mapel>-<tingkat>-kelas-<romawi>", so "smp" is in the name. Guessing
 * "lower-secondary" for every course would file an SMA scene under SMP and
 * publish it at an address that 404s.
 *
 * Not every course is named that way. "ipa-kelas-7-kurikulum-merdeka" says
 * neither the school level nor the level in the form the name uses, and there
 * is nothing in it to read a stage from, so --subject, --stage and --grade say
 * it instead. They override the name whatever it holds, so a course can be
 * published from a folder that spells the stage differently.
 */
function sourceFolderFor(courseFolder, outline, overrides) {
  const stage = { sd: 'primary', smp: 'lower-secondary', sma: 'upper-secondary', spesialisasi: 'spesialisasi' };
  // Spesialisasi is named "<mapel>-spesialisasi" with no class (docs/adr/0027).
  const named = courseFolder.match(/-(sd|smp|sma)-/) ?? courseFolder.match(/-(spesialisasi)$/);
  const fromName = named ? stage[named[1]] : null;
  const chosenStage = overrides.stage ?? fromName;

  if (!chosenStage) {
    throw new Error(
      `Nama course "${courseFolder}" tidak memuat tingkat sekolah, dan --stage tidak diisi. ` +
        `Isi --stage dengan salah satu dari: ${Object.values(stage).join(', ')}. ` +
        `Atau namai course "<mapel>-<sd|smp|sma>-kelas-<romawi>" agar tidak perlu flag.`,
    );
  }
  if (!Object.values(stage).includes(chosenStage)) {
    throw new Error(
      `--stage "${chosenStage}" tidak dikenal. Pilih salah satu dari: ` +
        `${Object.values(stage).join(', ')}.`,
    );
  }

  const chosenSubject = overrides.subject ?? subjectOf(courseFolder);
  if (!chosenSubject) {
    throw new Error(
      `Nama course "${courseFolder}" tidak memuat mata pelajaran, dan --subject tidak diisi. ` +
        `Isi --subject dengan nama mapel, misalnya "ipa". ` +
        `Atau namai course "<mapel>-<sd|smp|sma>-kelas-<romawi>" agar tidak perlu flag.`,
    );
  }

  // Spesialisasi has no class, so it has no grade and no grade folder (docs/adr/0027).
  if (chosenStage === 'spesialisasi') return `spesialisasi/${chosenSubject}`;

  const chosenGrade = overrides.grade ?? outline.grade;
  if (!Number.isInteger(chosenGrade) || chosenGrade <= 0) {
    throw new Error(
      `Outline "${outline.courseTitle ?? courseFolder}" tidak menulis grade yang bisa dibaca, ` +
        `dan --grade tidak diisi. Isi --grade dengan angka, misalnya 7.`,
    );
  }

  return `${chosenStage}/grade-${chosenGrade}/${chosenSubject}`;
}

const courseDir = findCourseDir(resolve(toolArg));
if (!courseDir) {
  console.error(`Tidak menemukan course dengan outline.yaml di ${toolArg}`);
  process.exit(1);
}

const outline = parse(readFileSync(join(courseDir, 'outline.yaml'), 'utf8'));
const courseFolder = basename(courseDir);
const sourceFolder = sourceFolderFor(courseFolder, outline, {
  subject: option('subject'),
  stage: option('stage'),
  grade: option('grade') === null ? null : Number(option('grade')),
});
// The planner reads the subject from the course folder name too, so the one
// resolved here goes with each scene rather than being derived twice.
const subject = basename(sourceFolder);
const scenesDir = join(courseDir, 'scenes');

/** The scenes the outline marks ready, in the order the outline lists them. */
const scenes = outline.scenes
  .filter((scene) => scene.status === 'ready')
  .map((scene) => {
    const file = join(scenesDir, `${scene.id}.html`);
    if (!existsSync(file)) {
      throw new Error(`Scene "${scene.id}" berstatus ready tetapi ${file} tidak ada.`);
    }
    const html = readFileSync(file, 'utf8');
    return {
      id: scene.id,
      title: scene.title,
      description: scene.description,
      html,
      sourceFolder,
      courseFolder,
      subject,
    };
  });

// What is already published, read from the catalog the site builds from.
const catalogDir = resolve('src/content/simulasi');
const existing = readdirSync(catalogDir)
  .filter((name) => name.endsWith('.yaml'))
  .map((name) => {
    const data = parse(readFileSync(join(catalogDir, name), 'utf8'));
    return { ...data, slug: name.replace(/\.yaml$/, '') };
  });

const plan = planPublish(scenes, existing);
const renameProblems = validateRenameIntent(plan, existing);

if (plan.errors.length > 0 || renameProblems.length > 0) {
  console.error('Batch tidak dapat diterbitkan:');
  for (const error of [...plan.errors, ...renameProblems]) console.error(`  - ${error}`);
  process.exit(1);
}

if (plan.added.length === 0 && plan.updated.length === 0) {
  console.log('Tidak ada perubahan. Semua scene sudah terbit.');
  process.exit(0);
}

/** The catalog entry as YAML, written in the same shape a human would. */
function toYaml(simulation) {
  return [
    `# Satu entri katalog per simulasi. Kunci adalah pengenal bahasa Inggris;`,
    `# nilainya Bahasa Indonesia karena menjadi bagian URL.`,
    `# Katalog adalah sumber kebenaran atas metadata simulasi (docs/adr/0004).`,
    `title: ${JSON.stringify(simulation.title)}`,
    `description: >-`,
    `  ${simulation.description}`,
    `level: ${simulation.level}`,
    // Spesialisasi has no class, so it has no grade line (docs/adr/0027).
    ...(simulation.grade === undefined ? [] : [`grade: ${simulation.grade}`]),
    `subject: ${simulation.subject}`,
    `order: ${simulation.order}`,
    `scene: ${JSON.stringify(simulation.scene)}`,
    '',
  ].join('\n');
}

const written = [];
for (const simulation of [...plan.added, ...plan.updated]) {
  // The simulation file the tool produced, copied byte for byte. This site
  // never edits it: its noindex is delivered as a header (docs/adr/0005).
  const target = simulationPathFor(sourceFolder, simulation.slug);
  written.push(`${CHECK_ONLY ? 'akan ditulis' : 'ditulis'}: ${target}`);
  written.push(`${CHECK_ONLY ? 'akan ditulis' : 'ditulis'}: ${catalogPathFor(simulation.slug)}`);

  if (CHECK_ONLY) continue;

  mkdirSync(dirname(resolve(target)), { recursive: true });
  copyFileSync(join(scenesDir, `${simulation.scene}.html`), resolve(target));
  mkdirSync(dirname(resolve(catalogPathFor(simulation.slug))), { recursive: true });
  writeFileSync(resolve(catalogPathFor(simulation.slug)), toYaml(simulation), 'utf8');
}

console.log(
  `${plan.added.length} baru, ${plan.updated.length} diperbarui dari ${scenes.length} scene.`,
);
for (const line of written) console.log(`  ${line}`);

if (CHECK_ONLY) {
  console.log('\nMode --check: tidak ada berkas yang ditulis.');
  process.exit(0);
}

if (TRIGGER) await triggerDeploy();

/**
 * Ask the host to rebuild.
 *
 * The hook URL is a credential and lives in the environment, not in this
 * repository. A missing one is reported rather than thrown, because the batch
 * has already been written and can still be pushed by hand.
 */
async function triggerDeploy() {
  const checked = checkDeployHook(process.env.SIMULA_DEPLOY_HOOK);
  if ('error' in checked) {
    // Unset is a normal run and only needs a warning, because the batch is on
    // disk and can be pushed by hand. A bad URL is a mistake and needs a person.
    if (!process.env.SIMULA_DEPLOY_HOOK) {
      console.warn(
        `\n${checked.error} Rebuild tidak dipicu. ` +
          'Commit hasil batch lalu push, atau setel hook tersebut.',
      );
      return;
    }
    console.error(`${checked.error} Batch sudah tertulis; push manual.`);
    process.exit(1);
  }

  // A rebuild that never answers would hang the publish forever with the batch
  // already on disk and no explanation, so the wait is bounded. Cloudflare
  // answers a deploy hook in well under this; the timeout is not a budget for
  // the build itself, which keeps running after this returns.
  try {
    const response = await fetch(checked.url, {
      method: 'POST',
      signal: AbortSignal.timeout(DEPLOY_HOOK_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.error(
        `Deploy hook menjawab ${response.status}. Batch sudah tertulis; push manual.`,
      );
      process.exit(1);
 }
  } catch (error) {
    console.error(
      `Deploy hook tidak menjawab: ${error instanceof Error ? error.message : String(error)}. ` +
        'Batch sudah tertulis; push manual.',
    );
    process.exit(1);
  }
  console.log('\nDeploy hook dipicu. Cloudflare Pages akan membangun ulang situs.');
}
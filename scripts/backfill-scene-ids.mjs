/**
 * One-off: record which tool scene each published simulation came from.
 *
 * The catalog gained a `scene` field so a published URL stays tied to a scene
 * rather than to a title (docs/adr/0007). The entries published before it
 * existed have no scene id, so they are matched here by the slug their own
 * title produces.
 *
 * An unmatched or ambiguous slug is reported and left alone rather than
 * guessed: a wrong scene id would make the next batch mistake one simulation
 * for another.
 *
 * Usage: npx vite-node scripts/backfill-scene-ids.mjs [--tool <path>] [--write]
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { slugifyTitle } from '../src/lib/publish.ts';

const args = process.argv.slice(2);
const toolArg = args.includes('--tool') ? args[args.indexOf('--tool') + 1] : null;
const WRITE = args.includes('--write');

if (!toolArg) {
  console.error('Usage: npx vite-node scripts/backfill-scene-ids.mjs --tool <path> [--write]');
  process.exit(2);
}

/** The course directory holding outline.yaml, searched under the tool root. */
function findCourseDir(root) {
  if (existsSyncOutline(root)) return root;
  const coursesDir = join(root, 'courses');
  if (!existsSync(coursesDir)) return null;
  const found = readdirSync(coursesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(coursesDir, d.name))
    .filter(existsSyncOutline);
  return found.length === 1 ? found[0] : null;
}

function existsSyncOutline(dir) {
  try {
    readFileSync(join(dir, 'outline.yaml'));
    return true;
  } catch {
    return false;
  }
}

const courseDir = findCourseDir(resolve(toolArg));
if (!courseDir) {
  console.error(`Tidak menemukan course dengan outline.yaml di ${toolArg}`);
  process.exit(1);
}

const outline = parse(readFileSync(join(courseDir, 'outline.yaml'), 'utf8'));
const catalogDir = resolve('src/content/simulasi');

// The slug each scene title reduces to. Two scenes reducing to one slug is a
// collision the publisher reports, and here it means neither can be matched.
const sceneBySlug = new Map();
const ambiguous = new Set();
for (const scene of outline.scenes) {
  const slug = slugifyTitle(scene.title);
  if (sceneBySlug.has(slug)) ambiguous.add(slug);
  else sceneBySlug.set(slug, scene.id);
}

let written = 0;
const unmatched = [];
const skipped = [];

for (const name of readdirSync(catalogDir).filter((n) => n.endsWith('.yaml'))) {
  const path = join(catalogDir, name);
  const raw = readFileSync(path, 'utf8');
  const data = parse(raw);

  if (data.scene) {
    skipped.push(`${name} (sudah punya scene)`);
    continue;
  }

  const slug = name.replace(/\.yaml$/, '');
  if (ambiguous.has(slug)) {
    unmatched.push(`${slug} (slug dipakai lebih dari satu scene)`);
    continue;
  }

  const scene = sceneBySlug.get(slug);
  if (!scene) {
    unmatched.push(`${slug} (tidak ada scene dengan slug itu)`);
    continue;
  }

  console.log(`${WRITE ? 'menulis' : 'akan menulis'} scene: ${scene} -> ${slug}`);
  if (WRITE) {
    writeFileSync(path, `${raw.trimEnd()}\nscene: ${JSON.stringify(scene)}\n`, 'utf8');
  }
  written += 1;
}

console.log(`\n${written} entri ${WRITE ? 'diperbarui' : 'akan diperbarui'}.`);
if (skipped.length > 0) console.log(`${skipped.length} sudah punya scene.`);
if (unmatched.length > 0) {
  console.log(`\n${unmatched.length} tidak bisa dicocokkan:`);
  for (const line of unmatched) console.log(`  - ${line}`);
  console.log('Periksa manual; menebak di sini akan salah target.');
}
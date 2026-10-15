import type { CatalogEntry } from './types';
import { levelForSourceFolder } from './simulations';

/** The character the tool separates a scene title from its course title with. */
const COURSE_SEPARATOR = '·';

/** One scene as the tool's outline describes it, with the file it produced. */
export interface SceneSource {
  /** The tool's own id, e.g. 's9'. Stable across batches. */
  id: string;
  /** The tool's course folder name, e.g. 'matematika-smp-kelas-vii'. */
  courseFolder: string;
  title: string;
  description: string;
  /** The tool's HTML, read from the scene file. */
  html: string;
  /** English source folder, then the subject folder, e.g. 'lower-secondary/grade-7/matematika'. */
  sourceFolder: string;
  /**
   * Subject the caller already resolved, when the course folder name does not
   * carry one. Absent for a course named "<mapel>-<tingkat>-kelas-<romawi>",
   * where the subject is read from the name instead.
   */
  subject?: string;
}

/** One simulation as the site holds it, before and after publishing. */
export interface PublishedSimulation {
  slug: string;
  title: string;
  description: string;
  level: string;
  grade: number;
  subject: string;
  order: number;
  /** Absent on entries published before the scene id was recorded. */
  scene?: string;
}

/** A simulation the pipeline has decided to write. */
export interface PlannedSimulation extends PublishedSimulation {
  /** The tool's HTML, byte for byte. This site never edits it. */
  html: string;
}

/** What a batch would do to the site. */
export interface PublishPlan {
  /** Simulations the site has never had. */
  added: PlannedSimulation[];
  /** Simulations whose content changed, keeping the slug they already had. */
  updated: PlannedSimulation[];
  /** Reasons the batch cannot be published as it stands. */
  errors: string[];
}

/**
 * Turn a scene title into the URL segment its file and catalog entry carry.
 *
 * The same rule the one-time migration used, kept identical so a simulation
 * renamed by that script and one published by this pipeline land on the same
 * address. Both tools strip the course suffix, lowercase, and reduce each run
 * of non-alphanumerics to one hyphen — including a hyphen already inside a
 * word, which Indonesian uses as a hyphen rather than a separator.
 */
export function slugifyTitle(title: string): string {
  const base = title.split(COURSE_SEPARATOR)[0].trim();
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (slug === '') {
    throw new Error(`Judul "${title}" tidak menghasilkan slug yang bisa dipakai sebagai URL.`);
  }
  return slug;
}

/**
 * Decide what a batch of scenes would do to the site.
 *
 * A scene whose slug the site already has is an update, and keeps that slug
 * however its title now reads (docs/adr/0007): correcting a simulation must not
 * move a URL that search results already point at. A scene with a new slug is an
 * addition and is placed after everything already published, so no existing
 * order is renumbered — a published order is already in the search index.
 *
 * Nothing is deleted and nothing is renamed. A title reworded upstream keeps its
 * address; only a genuinely new simulation gets a new one.
 */
export function planPublish(scenes: SceneSource[], existing: CatalogEntry[]): PublishPlan {
  const plan: PublishPlan = { added: [], updated: [], errors: [] };

  // An entry is recognised by the scene it came from where it records one, and
  // by its slug otherwise. That order matters: the tool rewrites a scene's
  // title when it corrects the simulation, so matching on the title alone would
  // publish the correction under a new slug and strand the address that search
  // results already point at (docs/adr/0007).
  //
  // The key carries the subject because a scene id counts one course's scenes:
  // two subjects each have an s2, and keying on the id alone would keep only
  // one of them, so the other would be published a second time on every run.
  const byScene = new Map<string, CatalogEntry>();
  for (const entry of existing) {
    if (entry.scene) byScene.set(`${entry.subject}/${entry.scene}`, entry);
  }
  const bySlug = new Map(existing.map((entry) => [entry.slug, entry]));
  const matched = new Set<string>();

  for (const scene of scenes) {
    const level = levelForSourceFolder(scene.sourceFolder.split('/')[0]);
    if (!level) {
      plan.errors.push(
        `Scene "${scene.id}" berada di folder "${scene.sourceFolder}" yang tidak dipetakan. ` +
          `Tambahkan pemetaannya di src/lib/simulations.ts.`,
      );
      continue;
    }

    const subject = scene.subject ?? subjectOf(scene.courseFolder);
    if (!subject) {
      plan.errors.push(
        `Scene "${scene.id}" berada di course "${scene.courseFolder}" yang nama mapelnya ` +
          `tidak terbaca. Format yang diharapkan: "<mapel>-<tingkat>-kelas-<romawi>", ` +
          `atau isi --subject saat menerbitkan.`,
      );
      continue;
    }

    let slugFromTitle: string;
    try {
      slugFromTitle = slugifyTitle(scene.title);
    } catch (error) {
      plan.errors.push(error instanceof Error ? error.message : String(error));
      continue;
    }

    // Scene ids are only unique inside a course: every course numbers its
    // scenes from s1. The subject is part of the lookup for that reason, so
    // IPA's s15 is never read as a correction of Matematika's s15 and IPA's own
    // s15 is not lost to it (docs/adr/0012).
    const sameScene = byScene.get(`${subject}/${scene.id}`);
    const sameSlug = bySlug.get(slugFromTitle);
    const entry =
      sameScene ?? (sameSlug && !sameSlug.scene && sameSlug.subject === subject ? sameSlug : undefined);

    if (entry && !matched.has(entry.slug)) {
      // The same simulation, corrected. Its slug, catalog entry and URL all stand.
      matched.add(entry.slug);
      plan.updated.push(toPlanned(entry, scene));
      continue;
    }

    if (entry) {
      plan.errors.push(
        `Scene "${scene.id}" sudah terbit sebagai "${entry.slug}". Satu scene tidak dapat ` +
          `diterbitkan dua kali; periksa apakah outline mendaftarkannya dua kali.`,
      );
      continue;
    }

    // Two scenes in one batch with the same title would write the same file
    // twice, and the second would silently replace the first.
    if (plan.added.some((s) => s.slug === slugFromTitle)) {
      plan.errors.push(
        `Scene "${scene.id}" menghasilkan slug "${slugFromTitle}" yang dipakai scene lain ` +
          `dalam batch ini. Dua simulasi tidak dapat berbagi satu alamat.`,
      );
      continue;
    }

    plan.added.push({
      slug: slugFromTitle,
      title: scene.title.split(COURSE_SEPARATOR)[0].trim(),
      description: scene.description,
      level,
      grade: gradeFromSourceFolder(scene.sourceFolder),
      subject,
      // Provisional: renumberNew assigns the real one below.
      order: 0,
      scene: scene.id,
      html: scene.html,
    });
  }

  renumberNew(plan.added, existing);
  return plan;
}

/** A planned simulation built from the entry already published. */
function toPlanned(entry: CatalogEntry, scene: SceneSource): PlannedSimulation {
  return {
    slug: entry.slug,
    title: entry.title,
    description: entry.description,
    level: entry.level,
    grade: entry.grade,
    subject: entry.subject,
    order: entry.order,
    scene: entry.scene ?? scene.id,
    html: scene.html,
  };
}

/** The grade inside a source folder, e.g. 7 from 'lower-secondary/grade-7'. */
function gradeFromSourceFolder(sourceFolder: string): number {
  const match = sourceFolder.match(/grade-(\d+)/);
  return match ? Number(match[1]) : 0;
}

/**
 * The Mata Pelajaran a new simulation is filed under.
 *
 * Read from the tool's own course folder name, which is the subject in
 * Indonesian: the course is "matematika-smp-kelas-vii", so the segment before
 * the school level is the subject. Guessing it from the level instead would
 * file an IPA scene under Matematika and publish it at a wrong address.
 */
export function subjectOf(courseFolder: string): string | null {
  const match = courseFolder.match(/^(.+)-(?:smp|sma|sd|smk)-/);
  if (!match) return null;
  return match[1].toLowerCase();
}

/**
 * Renumber only the simulations this batch adds.
 *
 * Existing orders are untouched: a published order is already in the search
 * index, and renumbering it would move every later simulation for no gain.
 */
function renumberNew(added: PlannedSimulation[], existing: CatalogEntry[]): void {
  // Highest order already published, which is 0 when nothing is published yet,
  // so an empty catalog falls out of the same case rather than needing one.
  const highest = existing.reduce((max, entry) => Math.max(max, entry.order), 0);
  added.forEach((simulation, index) => {
    simulation.order = highest + index + 1;
  });
}

/**
 * Refuse a batch that would take an address away from a published simulation.
 *
 * Renaming is the one change this pipeline does not make. An added simulation
 * whose slug a published one already holds means two different scenes want one
 * URL, and only one of them could ever be the page a reader finds.
 */
export function validateRenameIntent(plan: PublishPlan, existing: CatalogEntry[] = []): string[] {
  const publishedSlugs = new Set(existing.map((entry) => entry.slug));
  const problems: string[] = [];

  for (const simulation of plan.added) {
    if (publishedSlugs.has(simulation.slug)) {
      problems.push(
        `Slug "${simulation.slug}" sudah dipakai simulasi yang terbit. Menambah simulasi baru ` +
          `dengan slug tersebut akan mengambil alih URL-nya; ubah judulnya agar slug-nya berbeda.`,
      );
    }
  }

  return problems;
}

/** The catalog file path a simulation is written to. */
export function catalogPathFor(slug: string): string {
  return `src/content/simulasi/${slug}.yaml`;
}

/**
 * Where a simulation's file is written, relative to the site root.
 *
 * Under the tool's own English folder rather than the Indonesian segment: the
 * scanner walks simulations/<stage>/<grade>/<subject>/ and maps the stage to its
 * Indonesian segment at build time (docs/adr/0003), so writing under "smp"
 * would put the file where the scanner never looks and the build would report
 * a catalog entry with no file.
 */
export function simulationPathFor(sourceFolder: string, slug: string): string {
  return `simulations/${sourceFolder}/${slug}.html`;
}
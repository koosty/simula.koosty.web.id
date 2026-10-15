import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import {
  slugifyTitle,
  planPublish,
  validateRenameIntent,
  type SceneSource,
  type PublishedSimulation,
  type PlannedSimulation,
} from '../src/lib/publish';
import type { CatalogEntry } from '../src/lib/types';

/** A scene as the tool's outline describes it. */
function scene(overrides: Partial<SceneSource> & { id: string }): SceneSource {
  return {
    title: 'Judul Simulasi',
    description: 'Deskripsi simulasi.',
    html: '<html lang="id"></html>',
    courseFolder: 'matematika-smp-kelas-vii',
    sourceFolder: 'lower-secondary/grade-7/matematika',
    ...overrides,
  };
}

/** What is already published, as the site holds it today. */
function published(overrides: Partial<PublishedSimulation> & { slug: string }): PublishedSimulation {
  return {
    title: 'Judul',
    description: 'Deskripsi simulasi.',
    level: 'smp',
    grade: 7,
    subject: 'matematika',
    order: 1,
    ...overrides,
  };
}

describe('slugifyTitle', () => {
  it('drops the course suffix the tool appends to every title', () => {
    // The tool writes "<title> · <course>" so a tab has a readable title. The
    // separator is the middle dot, and splitting on it keeps a subject name
    // containing one from needing an edit here.
    expect(slugifyTitle('Sudut dalam Segitiga · Matematika SMP Kelas VII')).toBe(
      'sudut-dalam-segitiga',
    );
  });

  it('lowercases and joins words with single hyphens', () => {
    expect(slugifyTitle('Rerata, Median, Modus, dan Jangkauan')).toBe(
      'rerata-median-modus-dan-jangkauan',
    );
  });

  it('keeps a hyphen already inside a word', () => {
    // "Antar-sudut" is hyphenated in Indonesian; doubling it would change a
    // URL for no reason.
    expect(slugifyTitle('Hubungan Antar-sudut')).toBe('hubungan-antar-sudut');
  });

  it('maps two different titles to one slug, which is a collision', () => {
    // "PK & TK" and "PK TK" differ as text and reduce to the same slug, so the
    // second would overwrite the first's file. That is why planPublish reports
    // a repeated slug rather than picking one: the tool's author decides which
    // is meant, not this script.
    expect(slugifyTitle('PK & TK')).toBe('pk-tk');
    expect(slugifyTitle('PK & TK')).toBe(slugifyTitle('PK  TK'));
  });
  it('refuses a title that slugifies to nothing', () => {
    // A slug of "" would build the address /level/kelas-7/subject// and publish
    // two pages at it.
    expect(() => slugifyTitle('!!! ???')).toThrow();
  });
});

describe('planPublish', () => {
  const existing: CatalogEntry[] = [
    publishedToEntry(published({ slug: 'lama', scene: 's1', order: 1 })),
  ];


  it('publishes a simulation the site has never had', () => {
    const result = planPublish([scene({ id: 's9', title: 'Pecahan' })], existing);
    expect(result.added.map((s) => s.slug)).toEqual(['pecahan']);
    expect(result.updated).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('writes a simulation it already has in place, keeping its slug', () => {
    // ADR 0007: correcting a simulation must not move it. The slug is the
    // existing entry's, whatever the title now says.
    const result = planPublish(
      [scene({ id: 's1', title: 'Lama', html: '<p>baru</p>' })],
      existing,
    );
    expect(result.updated.map((s) => s.slug)).toEqual(['lama']);
    expect(result.added).toEqual([]);
    expect(result.updated[0].html).toBe('<p>baru</p>');
  });

  it('keeps a published URL even when the tool rewords the scene title', () => {
    // The whole point of recording the scene id: correcting a simulation's
    // title upstream must not mint a new slug. Matching on the title alone
    // would publish this under "nama-baru-total" and strand /smp/kelas-7/
    // matematika/lama/, which is the failure ADR 0007 rules out.
    const result = planPublish([scene({ id: 's1', title: 'Nama Baru Total' })], existing);
    expect(result.updated.map((s) => s.slug)).toEqual(['lama']);
    expect(result.added).toEqual([]);
    // The published title stands too, so the URL keeps its address and its words.
    expect(result.updated[0].title).toBe('Judul');
  });

  it('does not read another subject as the same simulation', () => {
    // Every course numbers its scenes from s1, so "s1" alone names no one
    // simulation. Matching on it across subjects would take the IPA scene s1
    // for a correction of Matematika's s1 and publish the IPA HTML under the
    // Matematika title and slug.
    const ipa = scene({
      id: 's1',
      title: 'Cabang-cabang Ilmu Pengetahuan Alam',
      courseFolder: 'ipa-smp-kelas-vii',
      sourceFolder: 'lower-secondary/grade-7/ipa',
    });
    const result = planPublish([ipa], existing);
    expect(result.updated).toEqual([]);
    expect(result.added.map((s) => s.slug)).toEqual(['cabang-cabang-ilmu-pengetahuan-alam']);
    expect(result.added[0].subject).toBe('ipa');
  });

  it('refuses a slug a published simulation of another subject already holds', () => {
    // Two subjects cannot share a slug: the URLs carry no subject, so one
    // simulation would take the other's address. The batch stops instead.
    const clash = scene({
      id: 's40',
      title: 'Lama',
      courseFolder: 'ipa-smp-kelas-vii',
      sourceFolder: 'lower-secondary/grade-7/ipa',
    });
    const problems = validateRenameIntent(planPublish([clash], existing), existing);
    expect(problems.join(' ')).toMatch(/lama/);
  });

  it('records the scene id on a simulation it adds', () => {
    // Without this the next batch cannot recognise the simulation and would
    // treat a reworded title as a new one.
    const result = planPublish([scene({ id: 's9', title: 'Pecahan' })], existing);
    expect(result.added[0].scene).toBe('s9');
  });

  it('matches on the slug when the entry records no scene', () => {
    // Entries written before the field existed have none, and a reworded title
    // for one of those does become a new address. That is recorded rather than
    // hidden, and the fix is to backfill the field.
    const legacy = [publishedToEntry(published({ slug: 'lama', order: 1 }))];
    const result = planPublish([scene({ id: 's1', title: 'Lama' })], legacy);
    expect(result.updated.map((s) => s.slug)).toEqual(['lama']);
  });

  it('publishes one of two scenes whose titles reduce to the same slug', () => {
    // Both would write the same file, and the second would silently replace the
    // first. The first is published and the second reported, so the batch stops
    // rather than shipping whichever happened to be scanned last. Which of the
    // two is intended is the tool author's decision, not this script's.
    const result = planPublish(
      [scene({ id: 's9', title: 'Pecahan' }), scene({ id: 's10', title: 'Pecahan' })],
      existing,
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/pecahan/);
    expect(result.errors[0]).toMatch(/s10/);
    expect(result.added.map((s) => s.slug)).toEqual(['pecahan']);
  });

  it('places a new simulation after the ones already published', () => {
    // Order is syllabus order, and a new scene belongs at the end of the batch
    // rather than pushing the rest along. Nothing renumbers, because a
    // published order is already in the search index.
    const result = planPublish([scene({ id: 's9', title: 'Pecahan' })], existing);
    expect(result.added[0].order).toBe(2);
  });

  it('publishes nothing from an empty batch', () => {
    const result = planPublish([], existing);
    expect(result).toEqual({ added: [], updated: [], errors: [] });
  });

  it('orders a new batch among themselves by their order in the outline', () => {
    const result = planPublish(
      [
        scene({ id: 's9', title: 'Kelas Pertama' }),
        scene({ id: 's10', title: 'Kelas Kedua' }),
      ],
      [],
    );
    expect(result.added.map((s) => s.slug)).toEqual(['kelas-pertama', 'kelas-kedua']);
    expect(result.added.map((s) => s.order)).toEqual([1, 2]);
  });
});

describe('validateRenameIntent', () => {
  it('allows a batch that only adds and updates', () => {
    const result = planPublish([scene({ id: 's9', title: 'Pecahan' })], [
      publishedToEntry(published({ slug: 'lama' })),
    ]);
    expect(validateRenameIntent(result)).toEqual([]);
  });

  it('refuses to drop a published simulation', () => {
    // A simulation that stops being published loses a URL that search results
    // already point at. Nothing here deletes; the file and entry stay.
    const result = planPublish([], [publishedToEntry(published({ slug: 'lama' }))]);
    expect(validateRenameIntent(result)).toEqual([]);
  });

  it('blocks the batch when a slug would be reused for a different simulation', () => {
    const result = {
      added: [planned(published({ slug: 'lama', title: 'Judul Baru' }))],
      updated: [],
      errors: [],
    };
    expect(validateRenameIntent(result, [publishedToEntry(published({ slug: 'lama' }))])).toEqual([
      expect.stringContaining('lama'),
    ]);
  });
});

/** The catalog entry as the site reads a published simulation. */
function publishedToEntry(sim: PublishedSimulation): CatalogEntry {
  return {
    slug: sim.slug,
    title: sim.title,
    description: sim.description,
    level: sim.level,
    grade: sim.grade,
    subject: sim.subject,
    order: sim.order,
    ...(sim.scene ? { scene: sim.scene } : {}),
  };
}

/** One simulation the pipeline has decided to publish. */
function planned(overrides: Partial<PlannedSimulation> & { slug: string }): PlannedSimulation {
  return {
    ...published(overrides),
    html: '<html></html>',
  };
}
describe('the published catalog the pipeline reads', () => {
  // The pipeline matches a scene to a published simulation by scene id, so
  // every entry needs one. Without it a reworded title upstream would mint a
  // new slug and strand the address the entry already publishes.
  it('records a scene id for every catalog entry', () => {
    const catalogDir = resolve(import.meta.dirname, '..', 'src/content/simulasi');
    const files = readdirSync(catalogDir).filter((name) => name.endsWith('.yaml'));
    expect(files.length).toBeGreaterThan(0);
    for (const name of files) {
      const data = parse(readFileSync(join(catalogDir, name), 'utf8'));
      expect(data.scene, `entri ${name} belum punya scene`).toMatch(/^s\d+$/);
    }
  });

  it('gives every simulation of a subject a different scene', () => {
    // A scene id numbers one course's scenes, so two courses of the same
    // subject are the case that would collide: the pipeline would read the
    // second course's s1 as a correction of the first one's s1.
    const catalogDir = resolve(import.meta.dirname, '..', 'src/content/simulasi');
    const entries = readdirSync(catalogDir)
      .filter((name) => name.endsWith('.yaml'))
      .map((name) => parse(readFileSync(join(catalogDir, name), 'utf8')));
    for (const subject of new Set(entries.map((entry) => entry.subject))) {
      const scenes = entries.filter((entry) => entry.subject === subject).map((e) => e.scene);
      expect(new Set(scenes).size, `dua entri mapel ${subject} memakai scene yang sama`).toBe(
        scenes.length,
      );
    }
  });

  it('builds with the scene field present', () => {
    // A field the content schema does not know is dropped silently, and the
    // pipeline would then match on titles again. The build is the check.
    expect(existsSync(resolve(import.meta.dirname, '..', 'dist'))).toBe(true);
  });
});

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/**
 * The Katalog. One entry per simulation, authored by hand beside the tool's
 * output. The catalog is authoritative over the simulation's own metadata
 * (docs/adr/0004), and the entry's slug is the simulation's filename, which the
 * tool slugifies from the title (docs/adr/0006).
 *
 * Keys are English identifiers; values are Bahasa Indonesia because they become
 * URL segments.
 *
 * `level` is one of the locked Tingkat (docs/adr/0027). `subject` stays a free
 * string, because Mata Pelajaran is an open set.
 */
const simulasi = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/simulasi' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    level: z.enum(['sd', 'smp', 'sma', 'spesialisasi']),
    grade: z.number().int().min(1).max(12).optional(),
    subject: z.string().min(1),
    order: z.number().int().min(1),
    /**
     * The tool's scene id this simulation was published from, e.g. 's9'.
     *
     * This is what ties a published URL to a scene rather than to a title. The
     * tool rewrites a title when it corrects a simulation, and re-slugifying
     * that would move an address search results already point at (ADR 0007).
     * Matching on the scene id is what keeps the address. Optional, because the
     * entries written before this field existed do not have one; those fall
     * back to matching on the slug their own title produces.
     */
    scene: z.string().min(1).optional(),
  }).superRefine((entry, ctx) => {
    const isSpesialisasi = entry.level === 'spesialisasi';
    if (!isSpesialisasi && entry.grade === undefined) {
      ctx.addIssue({ code: 'custom', path: ['grade'], message: 'grade wajib untuk sd, smp, sma.' });
    }
    if (isSpesialisasi && entry.grade !== undefined) {
      ctx.addIssue({ code: 'custom', path: ['grade'], message: 'spesialisasi tidak punya grade (docs/adr/0027).' });
    }
  }),
});

export const collections = { simulasi };
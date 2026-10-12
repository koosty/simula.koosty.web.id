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
 * `level` and `subject` are free-form strings rather than enums. Mata Pelajaran
 * is an open set, and a fixed list would fail the build the first time a new
 * subject arrived.
 */
const simulasi = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/simulasi' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    level: z.string().min(1),
    grade: z.number().int().min(1).max(12),
    subject: z.string().min(1),
    order: z.number().int().min(1),
  }),
});

export const collections = { simulasi };
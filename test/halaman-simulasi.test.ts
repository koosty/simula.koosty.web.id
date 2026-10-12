import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeAll } from 'vitest';

const DIST = resolve(import.meta.dirname, '..', 'dist');
const SIMS = resolve(import.meta.dirname, '..', 'example-simulations/lower-secondary/grade-7');
const PAGE = 'smp/kelas-7/matematika/sudut-dalam-segitiga/index.html';

describe('the first Halaman Simulasi', () => {
  let html: string;

  beforeAll(() => {
    if (!existsSync(resolve(DIST, PAGE))) {
      throw new Error(`dist/${PAGE} is missing. Run \`npm run build\` before \`npm test\`.`);
    }
    html = readFileSync(resolve(DIST, PAGE), 'utf8');
  });

  it('is served at the Bahasa URL', () => {
    expect(existsSync(resolve(DIST, 'smp/kelas-7/matematika/sudut-dalam-segitiga/index.html'))).toBe(
      true,
    );
  });

  it('has a title that ends in the site name', () => {
    expect(html.match(/<title>(.*?)<\/title>/)?.[1]).toBe('Sudut dalam Segitiga · Simula');
  });

  it('carries the catalog description as its metadata', () => {
    // The catalog is authoritative, so the page description is the catalog's,
    // not whatever the simulation happens to declare.
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
    expect(description).toContain('Visualisasi 3D interaktif');
  });

  it('points its canonical link at itself', () => {
    const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1];
    expect(canonical).toBe(
      'https://simula.koosty.web.id/smp/kelas-7/matematika/sudut-dalam-segitiga/',
    );
  });

  it('is indexable, unlike the raw simulation it frames', () => {
    // Only the Halaman Simulasi is the real page; the raw file is noindex.
    expect(html).not.toMatch(/name="robots"[^>]*noindex/);
  });

  it('frames the simulation and labels the frame for a screen reader', () => {
    const frame = html.match(/<iframe[^>]*>/)?.[0];
    expect(frame).toBeDefined();
    expect(frame).toContain('title="Sudut dalam Segitiga"');
  });

  it('offers a plain link to the simulation for devices that block frames', () => {
    const raw = html.match(/href="(\/simulasi\/[^"]*\.html)"/)?.[1];
    expect(raw).toBe('/simulasi/smp/sudut-dalam-segitiga.html');
  });


  it('frames a file the build actually wrote', () => {
    // The frame points at the level the simulation file lives under, not the
    // one the catalog entry claims, so a level disagreement cannot publish a
    // page whose simulation 404s.
    const frameSrc = html.match(/<iframe[^>]+src="([^"]*)"/)?.[1];
    expect(frameSrc).toBe('/simulasi/smp/sudut-dalam-segitiga.html');
    expect(existsSync(resolve(DIST, 'simulasi/smp/sudut-dalam-segitiga.html'))).toBe(true);
  });
  it('does not load a client-side framework runtime', () => {
    expect(html).not.toMatch(/astro-island/);
  });
});

describe('the copied simulation files', () => {
  it('copies every simulation without changing a byte', () => {
    const copied = resolve(DIST, 'simulasi/smp/sudut-dalam-segitiga.html');
    const source = resolve(SIMS, 'sudut-dalam-segitiga.html');
    expect(existsSync(copied)).toBe(true);
    expect(statSync(copied).size).toBe(statSync(source).size);
    expect(readFileSync(copied, 'utf8')).toBe(readFileSync(source, 'utf8'));
  });

  it('tells crawlers not to index the raw simulations', () => {
    // The simulation must stay byte-identical, so noindex is delivered as a
    // header rather than by editing the file.
    const headers = readFileSync(resolve(DIST, '_headers'), 'utf8');
    expect(headers).toContain('/simulasi/*');
    expect(headers).toContain('X-Robots-Tag: noindex');
  });
});
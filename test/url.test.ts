import { describe, it, expect } from 'vitest';
import { simulasiUrl } from '../src/lib/catalog';
import { simulationMetaOf } from '../src/lib/simulations';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('simulasiUrl', () => {
  it('builds the Bahasa path from level, class, subject and slug', () => {
    expect(
      simulasiUrl({ level: 'smp', grade: 7, subject: 'matematika', slug: 'sudut-dalam-segitiga' }),
    ).toBe('/smp/kelas-7/matematika/sudut-dalam-segitiga/');
  });

  it('keeps each level on its own first path segment', () => {
    expect(simulasiUrl({ level: 'smp', grade: 7, subject: 'ipa', slug: 'gaya' })).toBe(
      '/smp/kelas-7/ipa/gaya/',
    );
    expect(simulasiUrl({ level: 'sma', grade: 11, subject: 'fisika', slug: 'gerak' })).toBe(
      '/sma/kelas-11/fisika/gerak/',
    );
    expect(simulasiUrl({ level: 'sd', grade: 5, subject: 'matematika', slug: 'pecahan' })).toBe(
      '/sd/kelas-5/matematika/pecahan/',
    );
  });
});

describe('simulationMetaOf', () => {
  const SIMS = resolve(import.meta.dirname, '..', 'example-simulations/lower-secondary/grade-7');

  it('reads level, grade and title out of a real simulation file', () => {
    const meta = simulationMetaOf(readFileSync(resolve(SIMS, 'sudut-dalam-segitiga.html'), 'utf8'));
    expect(meta.title).toBe('Sudut dalam Segitiga');
    expect(meta.grade).toBe(7);
    expect(meta.level).toBe('Lower Secondary');
  });

  it('drops the course suffix from the simulation title', () => {
    const meta = simulationMetaOf(readFileSync(resolve(SIMS, 'laju-perubahan.html'), 'utf8'));
    expect(meta.title).toBe('Laju Perubahan');
  });

  it('reports an absent title rather than throwing', () => {
    expect(simulationMetaOf('<html><head></head><body></body></html>').title).toBe('');
  });
});
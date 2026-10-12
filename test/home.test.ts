import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeAll } from 'vitest';

// These tests read the built output in dist/, not the source. What ships is
// what matters, so asserting on the emitted HTML catches a mistake that unit
// tests on the component would miss.
const DIST = resolve(import.meta.dirname, '..', 'dist');

describe('the built home page', () => {
  let html: string;

  beforeAll(() => {
    if (!existsSync(resolve(DIST, 'index.html'))) {
      throw new Error('dist/index.html is missing. Run `npm run build` before `npm test`.');
    }
    html = readFileSync(resolve(DIST, 'index.html'), 'utf8');
  });

  it('declares Bahasa Indonesia as its language', () => {
    // A crawler reading lang="id" serves the page to Indonesian speakers.
    expect(html).toMatch(/<html[^>]*\slang="id"/);
  });

  it('has a title that names the site', () => {
    const title = html.match(/<title>(.*?)<\/title>/)?.[1];
    expect(title).toBeDefined();
    expect(title).toContain('Simula');
  });

  it('tells a visitor the catalogue is still coming, in Bahasa Indonesia', () => {
    // The page is a real page, not a 404 stub: it has to say what this is and
    // what is not here yet.
    expect(html).toMatch(/Katalog/);
    expect(html).toMatch(/segera|datang|belum/i);
  });

  it('loads no client-side framework runtime', () => {
    // ADR 0001: the catalogue is plain HTML, so a React or similar bundle here
    // would mean the build had started shipping an app.
    expect(html).not.toMatch(/<script[^>]+type="module"[^>]*src=/);
    expect(html).not.toMatch(/astro-island/);
    expect(html).not.toMatch(/\/_astro\/[^"]*\.js/);
  });

  it('points its canonical link at the production domain', () => {
    const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1];
    expect(canonical).toBe('https://simula.koosty.web.id/');
  });
});
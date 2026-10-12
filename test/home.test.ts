import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, beforeAll } from 'vitest';

// These tests read the built output in dist/, not the source. What ships is
// what matters, so asserting on the emitted HTML catches a mistake that unit
// tests on the component would miss.
const DIST = resolve(import.meta.dirname, '..', 'dist');

describe('the built home page', () => {
  let html: string;
  // The visible text with tags stripped, so a claim about wording is checked
  // against what a reader actually sees.
  let text: string;

  beforeAll(() => {
    if (!existsSync(resolve(DIST, 'index.html'))) {
      throw new Error('dist/index.html is missing. Run `npm run build` before `npm test`.');
    }
    html = readFileSync(resolve(DIST, 'index.html'), 'utf8');
    text = html
      .replace(/<style[\s\S]*?<\/style>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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

  it('says in Bahasa Indonesia what the site is and how much is published', () => {
    // Asserting whole sentences, not keywords. A keyword check passes on
    // "Katalog Lorem ipsum", which is a page nobody should be able to ship.
    // The page has to be a real page, not a 404 stub: it says what the site is,
    // and it says how many simulations are available.
    expect(text).toContain('Katalog simulasi pembelajaran interaktif untuk murid dan guru');
    expect(text).toMatch(/\d+ simulasi sudah tersedia/);
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
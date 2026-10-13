import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';
import { parse } from 'yaml';
import { simulasiUrl } from '../src/lib/catalog';
import { homeBatch, homeClassSections, homeStages } from '../src/lib/home';
import type { CatalogEntry } from '../src/lib/types';

const ROOT = resolve(import.meta.dirname, '..');

// These tests read the built output in dist/, not the source. What ships is
// what matters, so asserting on the emitted HTML catches a mistake that unit
// tests on the component would miss.
const DIST = resolve(ROOT, 'dist');
const CATALOG_DIR = resolve(ROOT, 'src/content/simulasi');
if (!existsSync(resolve(DIST, 'index.html'))) {
  throw new Error('dist/index.html is missing. Run `npm run build` before `npm test`.');
}

const homeHtml = readFileSync(resolve(DIST, 'index.html'), 'utf8');

// The visible text with tags stripped, so a claim about wording is checked
// against what a reader actually sees.
const text = homeHtml
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// The catalog as the build read it, read from the catalog files rather than
// written down: simulations arrive through the deploy hook with nobody in the
// middle, so a pinned number would fail on the next delivery.
const CATALOG: CatalogEntry[] = readdirSync(CATALOG_DIR)
  .filter((name) => name.endsWith('.yaml'))
  .map((name) => {
    const data = parse(readFileSync(resolve(CATALOG_DIR, name), 'utf8'));
    return { ...data, slug: name.replace(/\.yaml$/, '') };
  });

describe('the built home page', () => {
  const html = homeHtml;

  it('says in Bahasa Indonesia what the site is and how much is published', () => {
    // Asserting whole sentences, not keywords. A keyword check passes on
    // "Katalog Lorem ipsum", which is a page nobody should be able to ship.
    // The page has to be a real page, not a 404 stub: it says what the site is,
    // it says what a simulation is for a pupil, and it says how many there are.
    expect(text).toContain(
      'Simula menyimpan simulasi pembelajaran yang bisa langsung dibuka di peramban',
    );
    expect(text).toContain('tanpa memasang aplikasi apa pun');
    expect(text).toMatch(/Saat ini ada \d+ simulasi/);
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

describe('the built home page lists what exists', () => {
  const html = homeHtml;

  it('shows a batch of simulations as cards linking to their page', () => {
    // Checked against the catalog, not a number written here: simulations
    // arrive through the deploy hook with nobody in the middle.
    for (const entry of homeBatch(CATALOG)) {
      expect(html).toMatch(new RegExp(`href="${simulasiUrl(entry)}"`));
      expect(text).toContain(entry.title);
    }
  });

  it('shows a few simulations from every populated class', () => {
    for (const section of homeClassSections(CATALOG)) {
      expect(text).toContain(section.label);
      expect(text).toContain(`Lihat ${section.total} simulasi di ${section.label}`);
      for (const entry of section.simulations) {
        expect(html).toMatch(new RegExp(`href="${simulasiUrl(entry)}"`));
      }
    }
  });

  it('links to the Katalog and to every stage holding simulations', () => {
    expect(html).toMatch(/href="\/katalog\/"/);
    for (const stage of homeStages(CATALOG)) {
      expect(html).toMatch(new RegExp(`href="${stage.path}"`));
      expect(text).toContain(stage.label);
    }
  });

  it('never shows a stage or class with nothing behind it', () => {
    // A section is a promise that there is something to click into. Every one
    // is built from the catalog, so the check is that each heading the page
    // shows corresponds to a class the catalog actually holds.
    const shown = [...html.matchAll(/Lihat (\d+) simulasi di ([^<]+)</g)].map((m) => m[2].trim());
    const populated = homeClassSections(CATALOG);
    expect(shown.length).toBeGreaterThan(0);
    for (const label of shown) {
      const match = populated.find((section) => section.label === label);
      expect(match, `halaman menampilkan "${label}" yang tidak ada di katalog`).toBeDefined();
      // A count of zero would advertise a class the reader finds empty.
      expect(match?.total).toBeGreaterThan(0);
    }
    // Every stage linked in the stage list must be one the catalog holds, with
    // simulations behind it. Scoped to that list: the Katalog and the class
    // links are <a> tags too, and a pattern loose enough to catch them would be
    // asserting on the whole page instead of the list under test.
    const stageList = html.match(/<ul class="stage-list"[^>]*>([\s\S]*?)<\/ul>/)?.[1] ?? '';
    const linkedStages = [...stageList.matchAll(/href="(\/[a-z]+\/)"/g)];
    expect(linkedStages.length).toBeGreaterThan(0);
    for (const [, path] of linkedStages) {
      const stage = homeStages(CATALOG).find((s) => s.path === path);
      expect(stage, `halaman menautkan tahap "${path}" yang katalog tidak punya`).toBeDefined();
      expect(stage?.count, `tahap "${path}" ditautkan tanpa simulasi`).toBeGreaterThan(0);
    }
  });

  it('reaches the home page from the bare domain root with no scripting', () => {
    // The build emits index.html at the root and the page carries no client-side
    // framework, so there is nothing to execute for it to be readable.
    expect(existsSync(resolve(DIST, 'index.html'))).toBe(true);
    expect(html).not.toMatch(/astro-island/);
    expect(html).not.toMatch(/<script[^>]+type="module"[^>]*src=/);
  });

  it('serves the home page at the bare domain root, and nothing else does', () => {
    // The root address is / and the build puts the home page there. A second
    // HTML file at the root would answer the same address, splitting the search
    // ranking between two pages and leaving neither reliably the indexed one.
    const htmlAtRoot = readdirSync(DIST).filter((name) => name.endsWith('.html'));
    expect(htmlAtRoot).toEqual(['index.html']);
  });
});
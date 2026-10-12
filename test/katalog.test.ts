import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = resolve(ROOT, 'dist');
const page = readFileSync(resolve(DIST, 'katalog/index.html'), 'utf8');

/**
 * How many simulations the catalog holds.
 *
 * Read from the catalog files rather than written down, since simulations
 * arrive through the deploy hook with nobody in the middle. A test that pinned
 * today's number would fail on the next delivery looking like a rendering bug.
 */
const SIMULATION_COUNT = readdirSync(resolve(ROOT, 'src/content/simulasi')).filter((name) =>
  name.endsWith('.yaml'),
).length;

describe('the Katalog page is built', () => {
  it('lists every simulation as a card', () => {
    const cards = page.match(/class="card"/g) ?? [];
    expect(cards).toHaveLength(SIMULATION_COUNT);
  });

  it('links every card to a Halaman Simulasi that exists', () => {
    const hrefs = [...page.matchAll(/<a href="(\/smp\/kelas-7\/matematika\/[^"]+)"/g)].map((m) => m[1]);
    expect(hrefs).toHaveLength(SIMULATION_COUNT);
    for (const href of hrefs) {
      expect(existsSync(resolve(DIST, href.slice(1), 'index.html'))).toBe(true);
    }
  });

  it('gives every card a title, a Kelas, a Mata Pelajaran and a description', () => {
    // A reader choosing a simulation needs all four to recognise it.
    const cards = [...page.matchAll(/<li class="card"[\s\S]*?<\/li>/g)].map((m) => m[0]);
    expect(cards).toHaveLength(SIMULATION_COUNT);
    for (const card of cards) {
      expect(card).toMatch(/<a href="\/smp\/kelas-7\/matematika\/[^"]+"[^>]*>[^<]+<\/a>/);
      expect(card).toMatch(/<p class="card-meta"[^>]*>[^<]*Kelas 7[^<]*<\/p>/);
      expect(card).toMatch(/<p class="card-description"[^>]*>.{20,}<\/p>/);
    }
  });

  it('keeps simulations in display order inside their class', () => {
    const order = [...page.matchAll(/data-slug="([^"]+)"/g)].map((m) => m[1]);
    expect(order.slice(0, 3)).toEqual([
      'angka-bulat-dan-garis-bilangan',
      'operasi-hitung-bilangan-bulat',
      'bilangan-bulat-dalam-kehidupan-sehari-hari',
    ]);
  });

  it('gives each card a slug that agrees with the link on it', () => {
    // The browser-side filter matches on data-slug and the reader clicks the
    // href. If the two disagree, filtering shows a card that leads elsewhere.
    const cards = [...page.matchAll(/data-slug="([^"]+)"[\s\S]*?<a href="([^"]+)"/g)];
    expect(cards.length).toBeGreaterThan(0);
    for (const [, slug, href] of cards) {
      expect(href.endsWith(`/${slug}/`)).toBe(true);
    }
  });

  it('offers a filter for each of Tingkat, Kelas and Mata Pelajaran', () => {
    for (const field of ['level', 'grade', 'subject']) {
      expect(page).toContain(`data-filter="${field}"`);
    }
  });


  it('says so in Indonesian when nothing matches, rather than showing an empty list', () => {
    // The message ships hidden, so the script revealing it is the whole
    // behaviour. Checking only that the sentence exists would pass even with
    // the reveal deleted, leaving every reader with a silent empty list.
    expect(page).toContain('Tidak ada simulasi yang cocok');
    expect(page).toMatch(/<p class="no-match"[^>]*hidden/);
    // The reveal is the one place the visible count is turned into "nothing
    // matched": the message shows only when that count is zero.
    const bundle = page.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1] ?? '';
    expect(bundle).toMatch(/\.hidden=[A-Za-z_$][\w$]*!==0/);
  });

  it('offers only choices the catalog can satisfy', () => {
    // The catalog is all SMP grade 7 matematika, so no other choice may appear.
    const options = [...page.matchAll(/<option[^>]*>([^<]*)<\/option>/g)].map((m) => m[1].trim());
    expect(options).toContain('SMP');
    expect(options).toContain('Kelas 7');
    expect(options).toContain('Matematika');
    expect(options).not.toContain('SMA');
    expect(options).not.toContain('Sekolah Dasar');
  });

  it('removes the controls when scripting is unavailable', () => {
    // The filters cannot work without scripting, so the noscript style hides
    // them rather than leaving controls on screen that do nothing.
    const noscript = page.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1] ?? '';
    expect(noscript).toMatch(/#filters\s*\{[^}]*display:\s*none/);
  });

  it('never hides a card before the script runs', () => {
    // The script only hides cards that are already on the page, which is what
    // lets the page work without it. A card shipping with `hidden` would be
    // missing from a reader with scripting unavailable.
    const hidden = page.match(/<li class="card"[^>]*\shidden/g) ?? [];
    expect(hidden).toEqual([]);
  });

  it('is reachable from the home page', () => {
    const home = readFileSync(resolve(DIST, 'index.html'), 'utf8');
    expect(home).toContain('href="/katalog/"');
  });

  it('has a canonical link to itself and an Indonesian description', () => {
    expect(page).toContain('<link rel="canonical" href="https://simula.koosty.web.id/katalog/"');
    expect(page).toMatch(/<meta name="description" content="[^"]*saring[^"]*"/i);
  });
});
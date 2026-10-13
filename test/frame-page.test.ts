import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { relatedSimulations, RELATED_COUNT } from '../src/lib/related';
import { FALLBACK_HEIGHT, UNMEASURABLE_HEIGHT } from '../src/lib/frame';
import type { CatalogEntry } from '../src/lib/types';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = resolve(ROOT, 'dist');
const CATALOG_DIR = resolve(ROOT, 'src/content/simulasi');

const CATALOG: CatalogEntry[] = readdirSync(CATALOG_DIR)
  .filter((name) => name.endsWith('.yaml'))
  .map((name) => {
    const data = parse(readFileSync(resolve(CATALOG_DIR, name), 'utf8'));
    return { ...data, slug: name.replace(/\.yaml$/, '') };
  });

/** The simulation page for one slug, by the address its catalog entry gives it. */
function pageFor(slug: string): string {
  const entry = CATALOG.find((item) => item.slug === slug)!;
  return `/${entry.level}/kelas-${entry.grade}/${entry.subject}/${slug}/`;
}

function htmlAt(path: string): string {
  return readFileSync(resolve(DIST, path.slice(1), 'index.html'), 'utf8');
}

/** The frame element as built, without Astro's per-element attribute. */
function frameOf(html: string): string {
  return html.match(/<iframe[^>]*>/)?.[0] ?? '';
}

describe('the frame is set up to be measured, not to be a fixed size', () => {
  const html = htmlAt(pageFor('sudut-dalam-segitiga'));

  it('starts at a small fixed height, so its own height cannot inflate the measurement', () => {
    // A frame sized to its content measures the frame, not the simulation, so
    // it has to start small and grow. The value it starts at is in the markup
    // for the script to read, rather than written twice.
    const fallback = frameOf(html).match(/data-fallback-height="(\d+)"/)?.[1];
    expect(fallback).toBe(String(FALLBACK_HEIGHT));
    expect(Number(fallback)).toBeLessThan(800);
  });

  it('carries the height to fall back to when the simulation cannot be read', () => {
    const unmeasurable = frameOf(html).match(/data-unmeasurable-height="(\d+)"/)?.[1];
    expect(unmeasurable).toBe(String(UNMEASURABLE_HEIGHT));
    // Tall enough to show a simulation, and it scrolls internally rather than
    // the frame collapsing or rendering blank.
    expect(Number(unmeasurable)).toBeGreaterThan(1000);
  });

  it('has a height in the stylesheet rather than relying on the script alone', () => {
    // Without scripting the frame still needs a height, or the simulation
    // renders in a strip. Astro scopes the selector with an attribute, so only
    // the declaration itself is matched rather than the whole rule.
    expect(html).toMatch(/iframe[^{]*\{[^}]*height:\s*\d+px/);
  });

  it('starts at the same height the script starts from', () => {
    // The stylesheet height is a literal, because an Astro <style> block does
    // not interpolate a constant, so the two could drift apart. A frame that
    // jumps on load is the visible symptom.
    const declared = html.match(/iframe[^{]*\{[^}]*height:\s*(\d+)px/)?.[1];
    expect(declared).toBe(String(FALLBACK_HEIGHT));
  });
  it('gives the frame an id the script can find', () => {
    expect(frameOf(html)).toContain('id="simulation-frame"');
  });

  it('ships the measuring script with the page', () => {
    // The frame only grows if the script arrived; a page with a frame and no
    // script shows a permanently fixed height.
    expect(html).toMatch(/<script[^>]*type="module"/);
  });

  it('names the simulation for a screen reader', () => {
    expect(frameOf(html)).toContain('title="Sudut dalam Segitiga"');
  });

  it('does not sandbox the frame without allow-same-origin', () => {
    // Removing same-origin would stop the simulation running, as well as stop
    // the parent measuring it.
    expect(frameOf(html)).not.toContain('sandbox');
  });

  it('loads no library to do the resizing', () => {
    // A resizer library needs a script injected into the simulation files,
    // which this project never does, so the measurement is all hand-written.
    expect(html).not.toMatch(/iframe-resizer|iframeResizer/i);
  });

  it('frames a file the build actually wrote', () => {
    const src = frameOf(html).match(/src="([^"]*)"/)?.[1];
    expect(existsSync(resolve(DIST, src!.slice(1)))).toBe(true);
  });
});

describe('a simulation page shows where it is and how to leave it', () => {
  it('shows a breadcrumb from the home page down to the simulation', () => {
    const html = htmlAt(pageFor('sudut-dalam-segitiga'));
    expect(html).toMatch(/aria-label="Lokasi"/);
    for (const [label, href] of [
      ['Beranda', '/'],
      ['Katalog', '/katalog/'],
      ['SMP', '/smp/'],
    ]) {
      expect(html).toMatch(new RegExp(`href="${href}"[^>]*>${label}</a>`));
    }
    // Every step of the breadcrumb is a page the site serves.
    for (const href of [...html.matchAll(/class="breadcrumb"[\s\S]*?<\/nav>/g)].flatMap((m) =>
      [...m[0].matchAll(/href="([^"]+)"/g)].map((h) => h[1]),
    )) {
      expect(existsSync(resolve(DIST, href.slice(1), 'index.html'))).toBe(true);
    }
  });

  it('marks where the reader is in the breadcrumb', () => {
    expect(htmlAt(pageFor('sudut-dalam-segitiga'))).toMatch(/aria-current="page"/);
  });

  it('offers a link that opens the simulation in a new tab', () => {
    const link = htmlAt(pageFor('sudut-dalam-segitiga')).match(
      /<a href="(\/simulasi\/[^"]+)"[^>]*target="_blank"[^>]*>/,
    );
    expect(link).not.toBeNull();
    expect(link![1]).toBe('/simulasi/smp/sudut-dalam-segitiga.html');
  });

  it('keeps the new tab link from reaching back into this page', () => {
    // Without noopener the opened page gets a handle to this one.
    const html = htmlAt(pageFor('sudut-dalam-segitiga'));
    const tag = html.match(/<a href="\/simulasi\/[^"]+"[^>]*target="_blank"[^>]*>/)?.[0] ?? '';
    expect(tag).toContain('rel="noopener"');
  });

  it('does not make the new tab link the way to reach the simulation', () => {
    // The frame is the page's subject; the link is there for a device that
    // blocks frames, so it is worded as a fallback rather than as the way in.
    const html = htmlAt(pageFor('sudut-dalam-segitiga'));
    expect(html).toMatch(/Buka simulasi ini di tab baru<\/a>\s*(jika|<)/);
  });
});

describe('a simulation page offers what to read next', () => {
  it('offers three to five simulations on every page', () => {
    for (const entry of CATALOG) {
      const related = relatedSimulations(CATALOG, entry);
      expect(related.length).toBeGreaterThanOrEqual(3);
      expect(related.length).toBeLessThanOrEqual(5);
    }
  });

  it('offers exactly the simulations the related logic chose', () => {
    // The markup and the module must agree, or a reader is sent somewhere the
    // build did not mean to offer.
    const entry = CATALOG.find((item) => item.slug === 'sudut-dalam-segitiga')!;
    const expected = relatedSimulations(CATALOG, entry);
    const html = htmlAt(pageFor(entry.slug));
    const links = [...(html.match(/<nav class="related"[\s\S]*?<\/nav>/)?.[0] ?? '').matchAll(
      /href="([^"]+)"/g,
    )].map((m) => m[1]);
    expect(links).toEqual(expected.map((item) => `/${item.level}/kelas-${item.grade}/${item.subject}/${item.slug}/`));
  });

  it('links every simulation it offers to a page that exists', () => {
    for (const entry of CATALOG) {
      const section = htmlAt(pageFor(entry.slug)).match(/<nav class="related"[\s\S]*?<\/nav>/)?.[0] ?? '';
      const links = [...section.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
      expect(links.length).toBe(RELATED_COUNT);
      for (const href of links) {
        expect(existsSync(resolve(DIST, href.slice(1), 'index.html'))).toBe(true);
      }
    }
  });

  it('never offers the simulation the reader is already on', () => {
    for (const entry of CATALOG) {
      const section = htmlAt(pageFor(entry.slug)).match(/<nav class="related"[\s\S]*?<\/nav>/)?.[0] ?? '';
      expect(section).not.toContain(`/${entry.slug}/`);
    }
  });

  it('names the subject the suggestions come from', () => {
    expect(htmlAt(pageFor('sudut-dalam-segitiga'))).toContain('Simulasi lain di Matematika');
  });
});

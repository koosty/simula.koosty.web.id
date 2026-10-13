import type { APIRoute } from 'astro';
import { loadCatalog } from '../lib/loadCatalog';
import { renderSitemapXml, DEFAULT_SITE } from '../lib/sitemap';

/**
 * The sitemap, written from the catalog at build time.
 *
 * Built here rather than by walking the output directory so it cannot drift
 * from the URLs the pages are served at: both read the same catalog, and a
 * simulation in the catalog is in the sitemap because the page and the sitemap
 * were produced from one list.
 *
 * A static endpoint needs no parameters, so Astro emits it once at the root.
 */
export const GET: APIRoute = async ({ site }) => {
  const catalog = (await loadCatalog()).map(({ fileLevel: _fileLevel, ...entry }) => entry);
  const body = renderSitemapXml(catalog, String(site ?? DEFAULT_SITE));

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
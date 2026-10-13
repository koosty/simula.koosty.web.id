import type { APIRoute } from 'astro';
import { renderRobots, DEFAULT_SITE } from '../lib/sitemap';

/**
 * robots.txt, at the only address crawlers look for it.
 *
 * It allows crawling and names the sitemap. The raw simulation files are not
 * blocked here: they already carry X-Robots-Tag: noindex (docs/adr/0005), which
 * keeps them out of the index while still letting a crawler follow them.
 */
export const GET: APIRoute = ({ site }) => {
  const body = renderRobots(String(site ?? DEFAULT_SITE));

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
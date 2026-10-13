import { readFileSync } from 'node:fs';
import type { MiddlewareHandler } from 'astro';
import { resolveSimulationRequest } from './copySimulations';

/**
 * Serve a simulation from source in dev, as the build serves it from dist.
 *
 * This is the dev half of the copy hook in `copySimulations`, which only runs
 * for a build. Without it, a Halaman Simulasi in dev frames a 404 that is easy
 * to mistake for a broken link rather than a missing dev-only route.
 *
 * Every other request is passed straight through: the simulation folder is a
 * prefix, so anything else — including the site's own pages — belongs to Astro.
 */
export const onRequest: MiddlewareHandler = async (context, next) => {
  const url = context.url.pathname;
  const file = resolveSimulationRequest(url);
  if (!file) return next();

  // The same bytes the build copies, untouched: this site never edits a
  // simulation's contents (docs/adr/0005). The noindex matches the header the
  // deployed site sends through `_headers`, so a dev server exposed beyond
  // localhost is as unindexable as production.
  return new Response(readFileSync(file), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex',
    },
  });
};
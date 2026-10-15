# Serve the static site from a Worker

`docs/adr/0002` chose Cloudflare Pages for the custom domain, the build on push, and above all the deploy hook the publish script POSTs to. The hosting moves to Workers serving static assets, which keeps all three and is what the project's dashboard settings were built against.

The reason is that Pages projects are being retired in favour of Workers, so new projects are created as Workers by default. The first deploy failed before any file was uploaded: `npx astro add cloudflare` writes a `public/.assetsignore` and a `wrangler.jsonc` for Workers projects, wrangler required the first of those, and this repository has no `public/` directory because it needs none. Naming the assets directory in `wrangler.jsonc` removes the requirement entirely, so no `.assetsignore` is created and none is needed. That was checked rather than assumed: wrangler read all 236 assets with no ignore file present.

Nothing about the site changed. `output: 'static'` stands, no adapter is added, and there is no Worker script, so the Worker does nothing but serve files Astro already wrote.

Two settings in `wrangler.jsonc` are load-bearing, and both were found by serving the built site through `wrangler dev` and reading the responses rather than by reading the documentation first.

`html_handling` stays on its default of `auto-trailing-slash`. That default answers a raw simulation URL such as `/simulasi/smp/x.html` with a redirect to the same path without the extension, which looks like a change to an address `docs/adr/0007` holds fixed. It is not: Cloudflare documents this as the normal behaviour for a static site, and Pages performs the same clean-URL redirect, so the two hosts behave alike. Setting it to `none` was tried and is wrong in a way that is not obvious from its name: it disables folder index resolution as well, and every page URL on the site then returns 404, while the raw `.html` URLs it was meant to protect return 200. The default serves 121 page URLs correctly and redirects 71 raw ones that still resolve.

`not_found_handling` is also left alone. The site has no `404` page, so there is nothing for `404-page` to serve; asking for it would only change which 404 body appears.

The deploy hook needed no change. Workers Builds publishes its hooks under `api.cloudflare.com/client/v4/workers/builds/deploy_hooks/`, and `src/lib/deployHook.ts` checks the scheme and host rather than the path, so the URL it already expects is the right one for either host.

One coupling is worth knowing because it fails silently. Wrangler falls back to `.gitignore` when an assets directory carries no `.assetsignore`, so a pattern added to `.gitignore` that matches a built file would delete that file from the deploy with no warning. A `*.html` line added to tidy up the repository root would take all 71 simulations off the live site.
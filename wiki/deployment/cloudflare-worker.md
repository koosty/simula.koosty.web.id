<details>
<summary>Relevant source files</summary>

The following files were used as context for generating or updating this documentation page:

- [`wrangler.jsonc`](../../wrangler.jsonc)
- [`astro.config.mjs`](../../astro.config.mjs)
- [`package.json`](../../package.json)
- [`src/integrations/copySimulations.ts`](../../src/integrations/copySimulations.ts)
- [`src/integrations/serveSimulations.ts`](../../src/integrations/serveSimulations.ts)
- [`src/lib/deployHook.ts`](../../src/lib/deployHook.ts)
- [`scripts/publish-batch.mjs`](../../scripts/publish-batch.mjs)
- [`README.md`](../../README.md)
- [`.github/workflows/verify.yml`](../../.github/workflows/verify.yml)
- [`docs/adr/0002-cloudflare-pages-hosting.md`](../../docs/adr/0002-cloudflare-pages-hosting.md)
- [`docs/adr/0013-security-headers-that-cannot-break-a-simulation.md`](../../docs/adr/0013-security-headers-that-cannot-break-a-simulation.md)
- [`docs/adr/0014-serve-the-static-site-from-a-worker.md`](../../docs/adr/0014-serve-the-static-site-from-a-worker.md)
</details>

# Cloudflare Deployment

The site is static: Astro writes every page into `dist/` and there is no server code, so the Worker exists only to serve those files. The site builds on push to the main branch, and the publish script can ask Cloudflare to rebuild through a deploy hook. See [Build Pipeline](../architecture/build-pipeline.md) for what a build produces.

## Hosting

```jsonc
{
  "name": "simula",
  "compatibility_date": "2026-10-15",

  "assets": {
    "directory": "./dist"
  }
}
```

Sources: [wrangler.jsonc:1-25]()

ADR 0002 chose Cloudflare for the custom domain, the build on push, and above all the deploy hook the publish script POSTs to. ADR 0014 moves the hosting to Workers serving static assets, keeping all three.

Sources: [docs/adr/0014-serve-the-static-site-from-a-worker.md:1-3](), [docs/adr/0002-cloudflare-pages-hosting.md:1-3]()

`html_handling` and `not_found_handling` are left at their defaults on purpose. The default `auto-trailing-slash` is what Cloudflare documents for a static site: a file like `simulasi/smp/x.html` is answered with a redirect to the same path without the extension, and a folder index is served with the trailing slash Astro already emits.

Sources: [wrangler.jsonc:6-18]()

Setting `html_handling` to `none` was tried and is wrong: it disables folder index resolution too, and every page URL on the site then returns 404.

Sources: [wrangler.jsonc:16-18](), [README.md:94-95]()

Wrangler falls back to `.gitignore` when an assets directory carries no `.assetsignore`, so a pattern added to `.gitignore` that matches a built file would delete it from the deploy with no warning. Nothing there may gain a pattern like `*.html`.

Sources: [wrangler.jsonc:19-22]()

## Setting up

| Step | Where | Notes |
|---|---|---|
| 1. Push the repository | GitHub | No remote is configured yet: `git remote add origin <url>` then `git push -u origin main`. |
| 2. Create the project | Cloudflare dashboard, Workers & Pages | Build command `npm run build`; deploy command `npx wrangler deploy`; Node version from `.nvmrc`. |
| 3. Attach the domain | Custom Domains | Add `simula.koosty.web.id`; Cloudflare adds the DNS record when the zone is on the same account. |
| 4. Verify | Browser | The home page answers over HTTPS with `lang="id"`. |

Sources: [README.md:64-104]()

A push also runs `.github/workflows/verify.yml`, which is `npm run verify`. It gates nothing on its own, but it is the same work the deploy does, so a red run is a build that would have failed.

Sources: [README.md:73-77](), [.github/workflows/verify.yml:1-7]()

## Response headers

```ts
const HEADERS = [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  X-Frame-Options: SAMEORIGIN',
  '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
  '',
  '/simulasi/*',
  '  X-Robots-Tag: noindex',
  '',
].join('\n');
```

Sources: [src/integrations/copySimulations.ts:38-48]()

The build writes this to `dist/_headers` at the end of the copy hook, so it ships with the assets.

Sources: [src/integrations/copySimulations.ts:203-205]()

The first block applies to the whole site and holds only headers that cannot change what a reader sees. `SAMEORIGIN` still lets a Halaman Simulasi frame its own simulation, because both are served from this one origin.

Sources: [src/integrations/copySimulations.ts:24-32]()

There is deliberately **no Content-Security-Policy**: the simulations ship their own inline scripts and styles, so a policy strict enough to be worth having would blank every one of them until each was given a nonce or a hash.

Sources: [src/integrations/copySimulations.ts:32-37](), [docs/adr/0013-security-headers-that-cannot-break-a-simulation.md:1-3]()

The second block is per-path. A simulation must stay byte-identical to what the tool produced, so its `noindex` is delivered as a header rather than by editing the file.

Sources: [src/integrations/copySimulations.ts:29-38]()

The dev middleware sends the same `X-Robots-Tag: noindex` for a simulation served from source, so a dev server exposed beyond localhost is as unindexable as production.

Sources: [src/integrations/serveSimulations.ts:15-29]()

## Deploy hook

```ts
export function checkDeployHook(raw: string | undefined): { url: URL } | { error: string } {
```

Sources: [src/lib/deployHook.ts:23]()

The hook URL is a credential, so it belongs in the environment and not in the repository:

```
SIMULA_DEPLOY_HOOK=https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/<uuid>
```

Sources: [README.md:160-176]()

| Variable | Read by | Purpose |
|---|---|---|
| `SIMULA_DEPLOY_HOOK` | `scripts/publish-batch.mjs` via `checkDeployHook` | POST after a batch is written. |
| `SIMULA_TOOL_REPO` | `scripts/publish-batch.mjs` | Default for `--tool`, so a hook needs no argument. |

Sources: [scripts/publish-batch.mjs:62-64](), [README.md:110-113]()

The URL is checked before anything is sent: it must be `https` and must name `api.cloudflare.com`. A URL that fails the check is reported and the script exits; the batch is already written either way, so nothing is lost. The request gives up after 30 seconds rather than hanging the publish.

Sources: [src/lib/deployHook.ts:1-11](), [src/lib/deployHook.ts:28-45](), [README.md:168-181]()

With the hook set, `npm run publish` writes the batch and asks Cloudflare to rebuild. Without it the batch is still written and the script says so; commit and push it by hand instead.

Sources: [README.md:178-181]()

## Locally

| Command | What it does |
|---|---|
| `npm run dev` | Dev server; simulations are served from source by the middleware. |
| `npm run preview` | Serves the built output locally. |
| `npm run deploy:preview` | Builds, then serves `dist/` through wrangler as Cloudflare will. |

Sources: [package.json:9-21](), [README.md:13-24]()

## Related pages

- [Build Pipeline](../architecture/build-pipeline.md)
- [Publishing Simulations](../development/publishing-simulations.md)
- [Simulation Discovery](../content/simulation-discovery.md)
- [Architecture Decisions](../architecture/decisions.md)

<details>
<summary>Relevant source files</summary>

The following files were used as context for generating or updating this documentation page:

- [`package.json`](../../package.json)
- [`README.md`](../../README.md)
- [`.github/workflows/verify.yml`](../../.github/workflows/verify.yml)
- [`eslint.config.mjs`](../../eslint.config.mjs)
- [`test/theme.test.ts`](../../test/theme.test.ts)
- [`test/chrome-built.test.ts`](../../test/chrome-built.test.ts)
- [`test/sitemap-built.test.ts`](../../test/sitemap-built.test.ts)
- [`test/publish.test.ts`](../../test/publish.test.ts)
- [`test/copy-simulations.test.ts`](../../test/copy-simulations.test.ts)
- [`test/frame-height.test.ts`](../../test/frame-height.test.ts)
- [`src/lib/theme.ts`](../../src/lib/theme.ts)
</details>

# Testing

Twenty-three Vitest files, 4,524 lines, run with `npm test`, which builds first and then runs the suite against the emitted HTML in `dist/`. `npm run verify` runs `check`, `lint` and the tests in that order; it is what a change must pass before it is pushed.

## Running

| Command | What it does | Sources |
|---|---|---|
| `npm test` | `npm run build && vitest run` | [package.json:15]() |
| `npm run check` | `astro check` — typecheck Astro and TypeScript sources | [package.json:13]() |
| `npm run lint` | `eslint .`, including the inside of `.astro` files | [package.json:14]() |
| `npm run verify` | check, then lint, then test | [package.json:16]() |

Sources: [package.json:9-21](), [README.md:11-24]()

Tests read the emitted HTML in `dist/` rather than the source, because what ships is what matters. Building first means a stale `dist/` cannot make them pass.

Sources: [README.md:26-29]()

Node 22.12 or newer is required, which is what Astro needs.

Sources: [README.md:29-30](), [package.json:6-8]()

## Two kinds of test

Files fall into two groups by name. The four `*-built` files — `test/chrome-built.test.ts`, `test/nav-built.test.ts`, `test/sheet-built.test.ts` and `test/sitemap-built.test.ts` — read the emitted HTML out of `dist/` and cross-check it against the catalog.

```ts
const ROOT = resolve(import.meta.dirname, '..');
const DIST = resolve(ROOT, 'dist');
const CATALOG_DIR = resolve(ROOT, 'src/content/simulasi');
```

Sources: [test/sitemap-built.test.ts:10-12](), [test/chrome-built.test.ts:1-12]()

The remaining files import from `src/lib/` or `src/pages/` and exercise behaviour directly: `test/landing.test.ts`, `test/katalogFilter.test.ts`, `test/related.test.ts`, `test/nav.test.ts`, `test/home.test.ts`, `test/home-logic.test.ts`, `test/sheet.test.ts`, `test/sitemap.test.ts`, `test/publish.test.ts`, `test/catalog.test.ts`, `test/url.test.ts`, `test/theme.test.ts`, `test/deploy-hook.test.ts`, `test/discover-simulations.test.ts`, `test/copy-simulations.test.ts`, `test/frame-height.test.ts`, `test/frame-page.test.ts`, `test/halaman-simulasi.test.ts`, `test/katalog.test.ts`, `test/landing-page.test.ts`.

Several of these also read `dist/` — a page test asserting on the served markup, or a test building a temporary tree under `dist/` as a fixture — so the name suffix marks the intent, not an absolute rule.

`test/frame-height.test.ts` covers `contentHeight` as a pure function, which is why the height arithmetic lives in `src/lib/frame.ts` separated from the DOM reading that produces its input.

Sources: [`test/`](../../test/), [src/lib/frame.ts:186-196](), [src/lib/frame.ts:200-224]()


## Continuous integration

```yaml
on:
  push:
    branches: [master]
  pull_request:

concurrency:
  group: verify-${{ github.ref }}
  cancel-in-progress: true
```

Sources: [.github/workflows/verify.yml:8-15]()

The job checks out, sets up Node from `.nvmrc` with npm caching, runs `npm ci`, then `npm run verify`. A newer push to the same branch cancels a running check.

Sources: [.github/workflows/verify.yml:17-32]()

The workflow does not deploy. Cloudflare builds and publishes on push, so a second deploy path here would be one more thing that can disagree.

Sources: [.github/workflows/verify.yml:1-7](), [docs/adr/0002-cloudflare-pages-hosting.md:1-3]()

## Linting

There is no autoformatter; code is formatted by hand, so `npm run lint` reports and a person fixes.

Sources: [README.md:31-33]()

ESLint uses `eslint-plugin-astro`, which reads a whole `.astro` file — frontmatter, template and `<script>` together. That is the reason for choosing it, since a linter reading only the frontmatter calls every variable the template uses unused. Simulation files under `simulations/` are skipped, because the external tool produces them.

Sources: [README.md:35-37](), [eslint.config.mjs]()

## What the suite holds the design to

| Test file | What it protects | Sources |
|---|---|---|
| `test/theme.test.ts` | Every text role meets `AA_NORMAL_TEXT` (4.5:1) on both surfaces; `AA_NON_TEXT` is 3. | [src/lib/theme.ts:110-111](), [src/lib/theme.ts:218-225]() |
| `test/chrome-built.test.ts` | The built pages carry the palette's values, not literals. | [test/chrome-built.test.ts:9-16]() |
| `test/frame-height.test.ts` | `contentHeight` returns the tallest non-fixed bottom edge plus scroll, or `null`. | [src/lib/frame.ts:174-183]() |
| `test/sitemap-built.test.ts` | `sitemap.xml` and `robots.txt` exist at their declared paths and match the catalog. | [src/lib/sitemap.ts:6](), [src/lib/sitemap.ts:9]() |
| `test/sheet.test.ts` | `SHEET_SEGMENT` and the `cetak` route directory agree. | [src/lib/sheet.ts:14-17]() |
| `test/publish.test.ts` | Slug matching, scene-id matching within a subject, and the refusal to rename. | [src/lib/publish.ts:86-186](), [src/lib/publish.ts:238-259]() |
| `test/copy-simulations.test.ts` | `resolveSimulationRequest` refuses traversal and serves same-origin files. | [src/integrations/copySimulations.ts:70-124]() |
| `test/deploy-hook.test.ts` | Only an `https` `api.cloudflare.com` hook URL is accepted. | [src/lib/deployHook.ts:23-45]() |

## Related pages

- [Build Pipeline](../architecture/build-pipeline.md)
- [Site Theming](theming.md)
- [Publishing Simulations](publishing-simulations.md)
- [Architecture Decisions](../architecture/decisions.md)

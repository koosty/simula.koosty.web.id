# Wiki Structure

The inventory of [`wiki/`](README.md): what each section is for, which pages exist, which source files each one rests on, and what is still uncovered.

A page is listed as **Written** only when its file exists and has been reviewed against the current source. **Planned** pages have no file yet.

## Sections

| Section | Purpose |
|---|---|
| `architecture/` | How the site is put together and how a build runs. |
| `content/` | The Katalog and the simulation files — the two inputs everything else derives from. |
| `features/` | One page per user-visible page or surface. |
| `development/` | Tooling, theming and testing. |
| `deployment/` | Hosting and the deploy hook. |

## Page inventory

### `architecture/`

| Page | Status | Importance | Primary sources | Related pages |
|---|---|---|---|---|
| `overview.md` | Written | High | `astro.config.mjs`, `package.json`, `src/content.config.ts`, `src/lib/loadCatalog.ts`, `src/lib/simulations.ts`, `src/lib/catalog.ts`, `src/lib/types.ts`, `src/integrations/copySimulations.ts`, `src/integrations/serveSimulations.ts`, `src/lib/icons.ts`, `src/components/Icon.astro`, `src/layouts/Base.astro`, `wrangler.jsonc`, `CONTEXT.md` | everything below |
| `build-pipeline.md` | Written | High | `astro.config.mjs`, `src/integrations/copySimulations.ts`, `src/integrations/serveSimulations.ts`, `src/lib/loadCatalog.ts`, `src/lib/simulations.ts`, `src/lib/catalog.ts`, `src/content.config.ts`, `package.json`, `wrangler.jsonc` | `content/*`, `development/testing.md` |
| `decisions.md` | Written | High | all 25 files in `docs/adr/`, `CONTEXT.md`, `src/lib/theme.ts`, `src/layouts/Base.astro`, `src/lib/icons.ts`, `test/simulation-externals.test.ts` | `deployment/*`, `development/theming.md` |

### `content/`

| Page | Status | Importance | Primary sources | Related pages |
|---|---|---|---|---|
| `catalog-model.md` | Written | High | `src/content.config.ts`, `src/lib/types.ts`, `src/lib/loadCatalog.ts`, `src/lib/catalog.ts`, `src/lib/simulations.ts`, `src/lib/publish.ts`, one entry file, ADRs 0004/0006 | `content/simulation-discovery.md`, `features/*` |
| `simulation-discovery.md` | Written | High | `src/lib/simulations.ts`, `src/lib/loadCatalog.ts`, `src/integrations/copySimulations.ts`, `src/integrations/serveSimulations.ts`, `src/lib/catalog.ts`, `src/lib/publish.ts`, `scripts/publish-batch.mjs`, ADRs 0003/0011 | `architecture/build-pipeline.md` |

### `features/`

| Page | Status | Importance | Primary sources | Related pages |
|---|---|---|---|---|
| `home-page.md` | Written | Medium | `src/pages/index.astro`, `src/lib/home.ts`, `src/lib/katalogFilter.ts`, `src/lib/landing.ts`, `src/lib/tingkat.ts`, `src/lib/catalog.ts`, `src/lib/loadCatalog.ts`, `src/layouts/Base.astro`, `src/components/Icon.astro`, ADRs 0010/0017 | `features/site-navigation.md`, `features/simulation-page.md` |
| `site-navigation.md` | Written | Medium | `src/layouts/Base.astro`, `src/components/Icon.astro`, `src/lib/icons.ts`, `src/lib/nav.ts`, `src/lib/landing.ts`, `src/lib/tingkat.ts`, `src/lib/loadCatalog.ts`, `src/lib/theme.ts`, `src/pages/katalog.astro`, `public/favicon.svg`, ADRs 0022/0024/0025 | `features/home-page.md`, `development/theming.md` |
| `landing-pages.md` | Written | High | `src/lib/landing.ts`, `src/components/LandingPage.astro`, `src/pages/[tingkat]/index.astro`, `src/pages/[tingkat]/[segmen]/index.astro`, `src/lib/katalogFilter.ts`, `src/lib/nav.ts`, `src/lib/tingkat.ts`, `src/lib/catalog.ts`, `src/layouts/Base.astro`, ADR 0003 | `features/katalog-page.md`, `features/printable-class-sheet.md` |
| `katalog-page.md` | Written | High | `src/pages/katalog.astro`, `src/lib/katalogFilter.ts`, `src/lib/landing.ts`, `src/lib/tingkat.ts`, `src/lib/catalog.ts`, `src/lib/loadCatalog.ts`, `src/lib/types.ts`, `src/layouts/Base.astro`, `CONTEXT.md` | `content/catalog-model.md`, `features/landing-pages.md` |
| `simulation-page.md` | Written | High | `src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro`, `src/lib/frame.ts`, `src/lib/catalog.ts`, `src/lib/related.ts`, `src/lib/loadCatalog.ts`, `src/layouts/Base.astro`, `src/components/Icon.astro`, `simulations/lower-secondary/grade-7/matematika/angka-bulat-dan-garis-bilangan.html`, ADRs 0005/0007/0018/0020 | `content/catalog-model.md`, `features/landing-pages.md` |
| `printable-class-sheet.md` | Written | Medium | `src/lib/sheet.ts`, `src/components/Sheet.astro`, `src/pages/[tingkat]/[segmen]/cetak/index.astro`, `src/components/LandingPage.astro`, `src/lib/landing.ts`, `src/lib/katalogFilter.ts`, `src/lib/catalog.ts`, `src/layouts/Base.astro`, ADR 0008 | `features/landing-pages.md`, `features/sitemap-and-robots.md` |
| `sitemap-and-robots.md` | Written | Medium | `src/lib/sitemap.ts`, `src/pages/sitemap.xml.ts`, `src/pages/robots.txt.ts`, `src/pages/sitemap.astro`, `src/lib/landing.ts`, `src/lib/catalog.ts`, `src/lib/loadCatalog.ts`, `src/integrations/copySimulations.ts`, ADR 0005 | `deployment/cloudflare-worker.md` |

### `development/`

| Page | Status | Importance | Primary sources | Related pages |
|---|---|---|---|---|
| `publishing-simulations.md` | Written | High | `scripts/publish-batch.mjs`, `src/lib/publish.ts`, `src/lib/deployHook.ts`, `scripts/backfill-scene-ids.mjs`, `src/lib/simulations.ts`, `src/lib/loadCatalog.ts`, `src/content.config.ts`, `package.json`, ADRs 0007/0012 | `content/*`, `deployment/*` |
| `theming.md` | Written | Medium | `src/lib/theme.ts`, `src/layouts/Base.astro`, `src/lib/frame.ts`, `src/components/Sheet.astro`, the simulation page route, `src/integrations/copySimulations.ts`, `simulations/` (one file), `test/theme.test.ts`, ADRs 0009/0010/0015/0017/0019/0023 | `features/site-navigation.md`, `development/testing.md` |
| `testing.md` | Written | Medium | `package.json`, `README.md`, `.github/workflows/verify.yml`, `eslint.config.mjs`, `test/theme.test.ts`, `test/chrome-built.test.ts`, `test/sitemap-built.test.ts`, `test/publish.test.ts`, `test/copy-simulations.test.ts`, `test/frame-height.test.ts`, `test/simulation-externals.test.ts`, `src/lib/theme.ts`, `src/lib/frame.ts` | all feature pages |

### `deployment/`

| Page | Status | Importance | Primary sources | Related pages |
|---|---|---|---|---|
| `cloudflare-worker.md` | Written | High | `wrangler.jsonc`, `astro.config.mjs`, `package.json`, `src/integrations/copySimulations.ts`, `src/integrations/serveSimulations.ts`, `src/lib/deployHook.ts`, `scripts/publish-batch.mjs`, `README.md`, `.github/workflows/verify.yml`, ADRs 0002/0013/0014 | `architecture/build-pipeline.md`, `development/publishing-simulations.md` |

## Source coverage

Every source file under `src/`, `scripts/` and `test/` is referenced by at least one page.

| Source file | Covered by |
|---|---|
| `src/content.config.ts` | `content/catalog-model.md`, `architecture/build-pipeline.md` |
| `src/components/Icon.astro` | `features/site-navigation.md`, `features/home-page.md`, `features/simulation-page.md`, `architecture/overview.md` |
| `src/components/LandingPage.astro` | `features/landing-pages.md`, `features/printable-class-sheet.md` |
| `src/components/Sheet.astro` | `features/printable-class-sheet.md`, `development/theming.md` |
| `src/lib/catalog.ts` | `content/catalog-model.md`, `content/simulation-discovery.md`, `features/simulation-page.md`, `features/landing-pages.md`, `features/katalog-page.md`, `features/printable-class-sheet.md`, `features/sitemap-and-robots.md` |
| `src/lib/deployHook.ts` | `development/publishing-simulations.md`, `deployment/cloudflare-worker.md`, `development/testing.md` |
| `src/lib/frame.ts` | `features/simulation-page.md`, `development/theming.md`, `development/testing.md`, `architecture/overview.md` |
| `src/lib/home.ts` | `features/home-page.md` |
| `src/lib/icons.ts` | `features/site-navigation.md`, `architecture/overview.md`, `architecture/decisions.md` |
| `src/lib/katalogFilter.ts` | `features/katalog-page.md`, `features/landing-pages.md`, `features/home-page.md`, `features/sitemap-and-robots.md`, `features/printable-class-sheet.md` |
| `src/lib/landing.ts` | `features/landing-pages.md`, `features/katalog-page.md`, `features/home-page.md`, `features/site-navigation.md`, `features/sitemap-and-robots.md`, `features/printable-class-sheet.md` |
| `src/lib/loadCatalog.ts` | `architecture/overview.md`, `architecture/build-pipeline.md`, `content/catalog-model.md`, `content/simulation-discovery.md` |
| `src/lib/nav.ts` | `features/site-navigation.md`, `features/landing-pages.md` |
| `src/lib/publish.ts` | `development/publishing-simulations.md`, `content/catalog-model.md`, `content/simulation-discovery.md` |
| `src/lib/related.ts` | `features/simulation-page.md` |
| `src/lib/sheet.ts` | `features/printable-class-sheet.md` |
| `src/lib/simulations.ts` | `content/simulation-discovery.md`, `content/catalog-model.md`, `architecture/build-pipeline.md` |
| `src/lib/sitemap.ts` | `features/sitemap-and-robots.md` |
| `src/lib/theme.ts` | `development/theming.md`, `features/site-navigation.md`, `development/testing.md`, `architecture/decisions.md` |
| `src/lib/tingkat.ts` | `features/landing-pages.md`, `features/katalog-page.md`, `features/site-navigation.md` |
| `src/lib/types.ts` | `content/catalog-model.md`, `features/katalog-page.md`, `architecture/overview.md` |
| `src/integrations/copySimulations.ts` | `architecture/build-pipeline.md`, `content/simulation-discovery.md`, `deployment/cloudflare-worker.md`, `development/theming.md` |
| `src/integrations/serveSimulations.ts` | `architecture/build-pipeline.md`, `content/simulation-discovery.md`, `deployment/cloudflare-worker.md` |
| `src/layouts/Base.astro` | `features/site-navigation.md`, `development/theming.md`, and every feature page |
| `src/pages/*.astro`, `src/pages/*/*.astro`, `src/pages/*/*/*/*.astro` | `features/*`, one page per route |
| `scripts/publish-batch.mjs` | `development/publishing-simulations.md`, `deployment/cloudflare-worker.md` |
| `scripts/backfill-scene-ids.mjs` | `development/publishing-simulations.md` |
| `test/*.ts` | `development/testing.md`, plus a per-feature test list on each feature page |
| `public/favicon.svg`, `public/favicon.ico`, `public/apple-touch-icon.png`, `public/fonts/` | `features/site-navigation.md`, `development/theming.md`, `architecture/overview.md` |
| `simulations/**/*.html` | Not documented per file. One file is cited in `development/theming.md`, `features/simulation-page.md` and `architecture/decisions.md` as the example of the palette and layout rules. |
| `docs/adr/*.md` | `architecture/decisions.md`, cited from the page each decision shapes |
| `CONTEXT.md` | `architecture/overview.md`, `architecture/decisions.md`, `wiki/README.md` |
| `README.md` | `development/testing.md`, `development/publishing-simulations.md`, `deployment/cloudflare-worker.md` |
| `wrangler.jsonc`, `astro.config.mjs`, `package.json`, `eslint.config.mjs`, `.github/workflows/verify.yml` | `architecture/build-pipeline.md`, `deployment/cloudflare-worker.md`, `development/testing.md` |

Deliberately not documented: the 71 files under `simulations/` and the 71 catalog entries under `src/content/simulasi/`. The simulation files are data, not design. They were hand-edited for the site's palette and arcade styling (ADR 0023), which is recorded in [Site Theming](development/theming.md) and [Architecture Overview](architecture/overview.md). One entry is quoted in `content/catalog-model.md` to show the on-disk shape.

## Coverage gaps and open questions

| Gap | Status |
|---|---|
| Simulation HTML files under `simulations/` are not documented individually. | Out of scope by design — the tool produces them. The repository edits them by hand (ADR 0023); the rules are documented, not each file. |
| The external generator's template still produces the pre-ADR 0023 files. The next publish overwrites the hand edits. | Open — a change outside this repository. Noted in `architecture/overview.md` and `development/theming.md`. |
| `src/pages/index.astro` frames the featured simulation with no frame-resizing script, no theme sync and no `data-*` heights, unlike the Halaman Simulasi. | Open — the source does not say whether this is deliberate. Noted in `features/home-page.md`. |
| `src/lib/frame.ts:4-9` quotes a height range measured across 23 simulations. The repository holds 71. | Open — the range has not been measured again. Noted in `features/simulation-page.md`. |
| `docs/adr/0002-cloudflare-pages-hosting.md` is superseded by 0014 for hosting, but `.github/workflows/verify.yml` line 4 still says Cloudflare Pages builds on push. | Open — a source comment inconsistency. Noted in `architecture/decisions.md`. |

## Related pages

- [Wiki index](README.md)
- [Architecture Overview](architecture/overview.md)
- [Architecture Decisions](architecture/decisions.md)

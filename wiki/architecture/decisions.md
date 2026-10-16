<details>
<summary>Relevant source files</summary>

The following files were used as context for generating or updating this documentation page:

- [`docs/adr/0001-astro-as-static-site-generator.md`](../../docs/adr/0001-astro-as-static-site-generator.md)
- [`docs/adr/0002-cloudflare-pages-hosting.md`](../../docs/adr/0002-cloudflare-pages-hosting.md)
- [`docs/adr/0005-embed-simulations-in-iframe.md`](../../docs/adr/0005-embed-simulations-in-iframe.md)
- [`docs/adr/0009-chrome-paints-with-the-simulations-palette.md`](../../docs/adr/0009-chrome-paints-with-the-simulations-palette.md)
- [`docs/adr/0010-site-keeps-its-own-dark-palette.md`](../../docs/adr/0010-site-keeps-its-own-dark-palette.md)
- [`docs/adr/0014-serve-the-static-site-from-a-worker.md`](../../docs/adr/0014-serve-the-static-site-from-a-worker.md)
- [`docs/adr/0015-neo-arcade-stem-palette.md`](../../docs/adr/0015-neo-arcade-stem-palette.md)
- [`docs/adr/0016-tab-navigation-and-card-grids.md`](../../docs/adr/0016-tab-navigation-and-card-grids.md)
- [`docs/adr/0017-stitch-arcade-prototype-is-the-v1-design.md`](../../docs/adr/0017-stitch-arcade-prototype-is-the-v1-design.md)
- [`docs/adr/0018-simulation-page-workspace-beside-the-frame.md`](../../docs/adr/0018-simulation-page-workspace-beside-the-frame.md)
- [`docs/adr/0019-site-has-a-light-and-a-dark-palette.md`](../../docs/adr/0019-site-has-a-light-and-a-dark-palette.md)
- [`docs/adr/0020-simulation-frame-takes-the-page-width.md`](../../docs/adr/0020-simulation-frame-takes-the-page-width.md)
- [`docs/adr/0021-simulations-may-load-pinned-cdn-libraries.md`](../../docs/adr/0021-simulations-may-load-pinned-cdn-libraries.md)
- [`docs/adr/0022-icons-are-lucide-inline-svg.md`](../../docs/adr/0022-icons-are-lucide-inline-svg.md)
- [`docs/adr/0023-every-simulation-follows-the-site-palette-and-arcade-style.md`](../../docs/adr/0023-every-simulation-follows-the-site-palette-and-arcade-style.md)
- [`src/lib/theme.ts`](../../src/lib/theme.ts)
- [`src/layouts/Base.astro`](../../src/layouts/Base.astro)
- [`src/lib/icons.ts`](../../src/lib/icons.ts)
- [`test/simulation-externals.test.ts`](../../test/simulation-externals.test.ts)
- [`CONTEXT.md`](../../CONTEXT.md)
</details>

# Architecture Decisions

Twenty-three architecture decision records live in [`docs/adr/`](../../docs/adr/). They record why the site has the shape it has; the wiki pages record what the code does. This page is the index between them, and marks which decisions have been superseded or amended.

Each record is a single Markdown file numbered from `0001`. Where an ADR is cited in source, the citation is by filename, e.g. `docs/adr/0007`.

## Index

| # | Decision | Status | Where it is implemented |
|---|---|---|---|
| 0001 | [Astro as the static site generator](../../docs/adr/0001-astro-as-static-site-generator.md) | Current | [astro.config.mjs](../../astro.config.mjs), [src/content.config.ts](../../src/content.config.ts) |
| 0002 | [Host on Cloudflare Pages](../../docs/adr/0002-cloudflare-pages-hosting.md) | Partly superseded by 0014 | [wrangler.jsonc](../../wrangler.jsonc), `.github/workflows/verify.yml` |
| 0003 | [URLs use Bahasa Indonesia path segments](../../docs/adr/0003-bahasa-url-path-segments.md) | Current | [src/lib/simulations.ts](../../src/lib/simulations.ts), [src/lib/catalog.ts](../../src/lib/catalog.ts) |
| 0004 | [The catalog file is authoritative](../../docs/adr/0004-catalog-file-is-authoritative.md) | Current | [src/lib/loadCatalog.ts](../../src/lib/loadCatalog.ts), [src/lib/catalog.ts](../../src/lib/catalog.ts) |
| 0005 | [Simulations are embedded in an iframe](../../docs/adr/0005-embed-simulations-in-iframe.md) | Current, amended by `0021` | [src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro](../../src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro), [src/lib/frame.ts](../../src/lib/frame.ts) |
| 0006 | [The catalog file carries description, order, and the simulation's filename](../../docs/adr/0006-catalog-file-carries-slug-order-and-trigger.md) | Current | [src/content.config.ts](../../src/content.config.ts), [src/lib/types.ts](../../src/lib/types.ts) |
| 0007 | [Replacing a simulation keeps its URL](../../docs/adr/0007-replacement-keeps-the-url.md) | Current | [src/lib/publish.ts](../../src/lib/publish.ts), `scene` in the catalog schema |
| 0008 | [A printable sheet per class, kept out of the index](../../docs/adr/0008-printable-sheet-per-class.md) | Current | [src/lib/sheet.ts](../../src/lib/sheet.ts), [src/components/Sheet.astro](../../src/components/Sheet.astro) |
| 0009 | [The chrome paints with the simulations' palette](../../docs/adr/0009-chrome-paints-with-the-simulations-palette.md) | **Superseded by 0010** for the palette | [src/lib/theme.ts](../../src/lib/theme.ts) |
| 0010 | [The site keeps its own dark palette](../../docs/adr/0010-site-keeps-its-own-dark-palette.md) | **Superseded by 0015** for the palette, **by 0016** for layout | [src/lib/theme.ts](../../src/lib/theme.ts) |
| 0011 | [Simulations are grouped by subject on disk](../../docs/adr/0011-simulations-are-grouped-by-subject-on-disk.md) | Current | [src/lib/simulations.ts](../../src/lib/simulations.ts), [src/integrations/copySimulations.ts](../../src/integrations/copySimulations.ts) |
| 0012 | [A scene id names one simulation within its subject](../../docs/adr/0012-a-scene-id-names-one-simulation-within-its-subject.md) | Current | [src/lib/publish.ts](../../src/lib/publish.ts) |
| 0013 | [Security headers that cannot break a simulation](../../docs/adr/0013-security-headers-that-cannot-break-a-simulation.md) | Current | [src/integrations/copySimulations.ts](../../src/integrations/copySimulations.ts) |
| 0014 | [Serve the static site from a Worker](../../docs/adr/0014-serve-the-static-site-from-a-worker.md) | Current | [wrangler.jsonc](../../wrangler.jsonc) |
| 0015 | [The site and simulations use the Neo-Arcade STEM palette](../../docs/adr/0015-neo-arcade-stem-palette.md) | **Values superseded by 0017** | [src/lib/theme.ts](../../src/lib/theme.ts), [public/fonts/](../../public/fonts/) |
| 0016 | [The site uses tab navigation and card grids](../../docs/adr/0016-tab-navigation-and-card-grids.md) | **Superseded by 0017** | [src/layouts/Base.astro](../../src/layouts/Base.astro), [src/pages/index.astro](../../src/pages/index.astro) |
| 0017 | [The Stitch arcade prototype is the v1.0.0 design](../../docs/adr/0017-stitch-arcade-prototype-is-the-v1-design.md) | Current, amended by `0021` and `0023` | [src/lib/theme.ts](../../src/lib/theme.ts), [src/layouts/Base.astro](../../src/layouts/Base.astro), [src/pages/index.astro](../../src/pages/index.astro) |
| 0018 | [The simulation page places an information column beside the frame](../../docs/adr/0018-simulation-page-workspace-beside-the-frame.md) | Superseded by `0020` | [src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro](../../src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro) |
| 0019 | [The site has a light and a dark palette](../../docs/adr/0019-site-has-a-light-and-a-dark-palette.md) | Current, extended by `0023` | [src/lib/theme.ts](../../src/lib/theme.ts), [src/layouts/Base.astro](../../src/layouts/Base.astro), [test/theme.test.ts](../../test/theme.test.ts) |
| 0020 | [The simulation frame takes the page width](../../docs/adr/0020-simulation-frame-takes-the-page-width.md) | Current | [src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro](../../src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro), [simulations/lower-secondary/grade-7/matematika/angka-bulat-dan-garis-bilangan.html](../../simulations/lower-secondary/grade-7/matematika/angka-bulat-dan-garis-bilangan.html) |
| 0021 | [Simulations may load pinned libraries from a CDN, with integrity hashes](../../docs/adr/0021-simulations-may-load-pinned-cdn-libraries.md) | Current, amends `0005` and `0017` | [test/simulation-externals.test.ts](../../test/simulation-externals.test.ts), [simulations/](../../simulations/) |
| 0022 | [Icons are Lucide paths drawn as inline SVG](../../docs/adr/0022-icons-are-lucide-inline-svg.md) | Current | [src/lib/icons.ts](../../src/lib/icons.ts), [src/components/Icon.astro](../../src/components/Icon.astro), [src/layouts/Base.astro](../../src/layouts/Base.astro) |
| 0023 | [Every simulation follows the site palette and arcade style](../../docs/adr/0023-every-simulation-follows-the-site-palette-and-arcade-style.md) | Current, amends `0017` and `0019` | [simulations/](../../simulations/), [src/lib/frame.ts](../../src/lib/frame.ts) |

Sources: [docs/adr/](../../docs/adr/), [docs/adr/0009-chrome-paints-with-the-simulations-palette.md](../../docs/adr/0009-chrome-paints-with-the-simulations-palette.md), [docs/adr/0010-site-keeps-its-own-dark-palette.md](../../docs/adr/0010-site-keeps-its-own-dark-palette.md)

## Superseded and amended decisions

ADR 0016 supersedes ADR 0010 for layout: the home page's list of rows and the plain navigation list. ADR 0017 supersedes 0016 for layout and 0015 for the palette values: the arcade bar, the hero with stat cards, and the card grids follow the Stitch prototype. Figures that look like live game data (credits, streaks, leaderboard) are not used, because the site has no accounts or scores.

Sources: [docs/adr/0009-chrome-paints-with-the-simulations-palette.md:1-3](../../docs/adr/0009-chrome-paints-with-the-simulations-palette.md), [docs/adr/0010-site-keeps-its-own-dark-palette.md:1-3](../../docs/adr/0010-site-keeps-its-own-dark-palette.md), [CONTEXT.md:43-45](../../CONTEXT.md)

ADR 0019 adds the light palette and the header switch to the dark palette of 0017. ADR 0020 replaces the information column of 0018 with a frame that takes the full page width. ADR 0021 allows simulations to load pinned libraries from two CDN hosts, which amends 0005 (no external loads) and 0017. ADR 0023 extends 0019 and 0017 to the simulations: all 71 files carry their own light and dark palette blocks and the arcade styling.

Sources: [docs/adr/0019-site-has-a-light-and-a-dark-palette.md](../../docs/adr/0019-site-has-a-light-and-a-dark-palette.md), [docs/adr/0020-simulation-frame-takes-the-page-width.md](../../docs/adr/0020-simulation-frame-takes-the-page-width.md), [docs/adr/0021-simulations-may-load-pinned-cdn-libraries.md](../../docs/adr/0021-simulations-may-load-pinned-cdn-libraries.md), [docs/adr/0023-every-simulation-follows-the-site-palette-and-arcade-style.md](../../docs/adr/0023-every-simulation-follows-the-site-palette-and-arcade-style.md)

ADR 0014 keeps the deploy hook working that ADR 0002 established. The dashboard settings the project was built against are Workers settings.

Sources: [docs/adr/0014-serve-the-static-site-from-a-worker.md:1-3](../../docs/adr/0014-serve-the-static-site-from-a-worker.md)

## Decisions still live in code

Two rules are recorded in comments rather than in an ADR:

- **The Katalog's `scene` field is optional**, because entries published before it existed do not have one and fall back to matching on the slug their own title produces.
  Sources: [src/content.config.ts:27-37](../../src/content.config.ts), [src/lib/types.ts:14-22](../../src/lib/types.ts)
- **The catalog is read again per page rather than cached**, because Astro already holds the content collection for the build and a cache would only add a path no test could exercise.
  Sources: [src/layouts/Base.astro:17-21](../../src/layouts/Base.astro)

## Vocabulary

The domain terms the ADRs and the code share are defined once in [`CONTEXT.md`](../../CONTEXT.md): Simulasi, Katalog, Halaman Simulasi, Tingkat, Kelas, Mata Pelajaran, Konsep, Slug, Daftar Cetak, Palet.

Sources: [CONTEXT.md:5-45](../../CONTEXT.md)

## Related pages

- [Architecture Overview](overview.md)
- [Build Pipeline](build-pipeline.md)
- [Cloudflare Deployment](../deployment/cloudflare-worker.md)
- [Site Theming](../development/theming.md)
- [Simulation Page](../features/simulation-page.md)

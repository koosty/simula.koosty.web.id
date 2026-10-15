<details>
<summary>Relevant source files</summary>

The following files were used as context for generating or updating this documentation page:

- [`docs/adr/0001-astro-as-static-site-generator.md`](../../docs/adr/0001-astro-as-static-site-generator.md)
- [`docs/adr/0002-cloudflare-pages-hosting.md`](../../docs/adr/0002-cloudflare-pages-hosting.md)
- [`docs/adr/0003-bahasa-url-path-segments.md`](../../docs/adr/0003-bahasa-url-path-segments.md)
- [`docs/adr/0004-catalog-file-is-authoritative.md`](../../docs/adr/0004-catalog-file-is-authoritative.md)
- [`docs/adr/0005-embed-simulations-in-iframe.md`](../../docs/adr/0005-embed-simulations-in-iframe.md)
- [`docs/adr/0006-catalog-file-carries-slug-order-and-trigger.md`](../../docs/adr/0006-catalog-file-carries-slug-order-and-trigger.md)
- [`docs/adr/0007-replacement-keeps-the-url.md`](../../docs/adr/0007-replacement-keeps-the-url.md)
- [`docs/adr/0008-printable-sheet-per-class.md`](../../docs/adr/0008-printable-sheet-per-class.md)
- [`docs/adr/0009-chrome-paints-with-the-simulations-palette.md`](../../docs/adr/0009-chrome-paints-with-the-simulations-palette.md)
- [`docs/adr/0010-site-keeps-its-own-dark-palette.md`](../../docs/adr/0010-site-keeps-its-own-dark-palette.md)
- [`docs/adr/0011-simulations-are-grouped-by-subject-on-disk.md`](../../docs/adr/0011-simulations-are-grouped-by-subject-on-disk.md)
- [`docs/adr/0012-a-scene-id-names-one-simulation-within-its-subject.md`](../../docs/adr/0012-a-scene-id-names-one-simulation-within-its-subject.md)
- [`docs/adr/0013-security-headers-that-cannot-break-a-simulation.md`](../../docs/adr/0013-security-headers-that-cannot-break-a-simulation.md)
- [`docs/adr/0014-serve-the-static-site-from-a-worker.md`](../../docs/adr/0014-serve-the-static-site-from-a-worker.md)
- [`CONTEXT.md`](../../CONTEXT.md)
</details>

# Architecture Decisions

Fourteen architecture decision records live in [`docs/adr/`](../../docs/adr/). They record why the site has the shape it has; the wiki pages record what the code does. This page is the index between them, and marks which decisions have been superseded.

Each record is a single Markdown file numbered from `0001`. Where an ADR is cited in source, the citation is by filename, e.g. `docs/adr/0007`.

## Index

| # | Decision | Status | Where it is implemented |
|---|---|---|---|
| 0001 | [Astro as the static site generator](../../docs/adr/0001-astro-as-static-site-generator.md) | Current | [astro.config.mjs](../../astro.config.mjs), [src/content.config.ts](../../src/content.config.ts) |
| 0002 | [Host on Cloudflare Pages](../../docs/adr/0002-cloudflare-pages-hosting.md) | Partly superseded by 0014 | [wrangler.jsonc](../../wrangler.jsonc), `.github/workflows/verify.yml` |
| 0003 | [URLs use Bahasa Indonesia path segments](../../docs/adr/0003-bahasa-url-path-segments.md) | Current | [src/lib/simulations.ts](../../src/lib/simulations.ts), [src/lib/catalog.ts](../../src/lib/catalog.ts) |
| 0004 | [The catalog file is authoritative](../../docs/adr/0004-catalog-file-is-authoritative.md) | Current | [src/lib/loadCatalog.ts](../../src/lib/loadCatalog.ts), [src/lib/catalog.ts](../../src/lib/catalog.ts) |
| 0005 | [Simulations are embedded in an iframe](../../docs/adr/0005-embed-simulations-in-iframe.md) | Current | [src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro](../../src/pages/[tingkat]/[kelas]/[mataPelajaran]/[slug].astro), [src/lib/frame.ts](../../src/lib/frame.ts) |
| 0006 | [The catalog file carries description, order, and the simulation's filename](../../docs/adr/0006-catalog-file-carries-slug-order-and-trigger.md) | Current | [src/content.config.ts](../../src/content.config.ts), [src/lib/types.ts](../../src/lib/types.ts) |
| 0007 | [Replacing a simulation keeps its URL](../../docs/adr/0007-replacement-keeps-the-url.md) | Current | [src/lib/publish.ts](../../src/lib/publish.ts), `scene` in the catalog schema |
| 0008 | [A printable sheet per class, kept out of the index](../../docs/adr/0008-printable-sheet-per-class.md) | Current | [src/lib/sheet.ts](../../src/lib/sheet.ts), [src/components/Sheet.astro](../../src/components/Sheet.astro) |
| 0009 | [The chrome paints with the simulations' palette](../../docs/adr/0009-chrome-paints-with-the-simulations-palette.md) | **Superseded by 0010** for the palette | [src/lib/theme.ts](../../src/lib/theme.ts) |
| 0010 | [The site keeps its own dark palette](../../docs/adr/0010-site-keeps-its-own-dark-palette.md) | **Superseded by 0015** for the palette | [src/lib/theme.ts](../../src/lib/theme.ts) |
| 0011 | [Simulations are grouped by subject on disk](../../docs/adr/0011-simulations-are-grouped-by-subject-on-disk.md) | Current | [src/lib/simulations.ts](../../src/lib/simulations.ts), [src/integrations/copySimulations.ts](../../src/integrations/copySimulations.ts) |
| 0012 | [A scene id names one simulation within its subject](../../docs/adr/0012-a-scene-id-names-one-simulation-within-its-subject.md) | Current | [src/lib/publish.ts](../../src/lib/publish.ts) |
| 0013 | [Security headers that cannot break a simulation](../../docs/adr/0013-security-headers-that-cannot-break-a-simulation.md) | Current | [src/integrations/copySimulations.ts](../../src/integrations/copySimulations.ts) |
| 0014 | [Serve the static site from a Worker](../../docs/adr/0014-serve-the-static-site-from-a-worker.md) | Current | [wrangler.jsonc](../../wrangler.jsonc) |
| 0015 | [The site and simulations use the Neo-Arcade STEM palette](../../docs/adr/0015-neo-arcade-stem-palette.md) | Current | [src/lib/theme.ts](../../src/lib/theme.ts), [public/fonts/](../../public/fonts/) |

Sources: [docs/adr/](), [docs/adr/0009-chrome-paints-with-the-simulations-palette.md:1-3](), [docs/adr/0010-site-keeps-its-own-dark-palette.md:1-3]()

## Superseded decisions

ADR 0010 supersedes ADR 0009 for the palette, and ADR 0015 supersedes ADR 0010 for the palette. The rest of 0009 and 0010 still holds: the site builds its chrome from `src/lib/theme.ts`, and a page writes `var(--text-muted)` rather than a literal.

Sources: [docs/adr/0009-chrome-paints-with-the-simulations-palette.md:1-3](), [docs/adr/0010-site-keeps-its-own-dark-palette.md:1-3](), [CONTEXT.md:43-45]()

ADR 0014 keeps the deploy hook working that ADR 0002 established. The dashboard settings the project was built against are Workers settings.

Sources: [docs/adr/0014-serve-the-static-site-from-a-worker.md:1-3]()

## Decisions still live in code

Two rules are recorded in comments rather than in an ADR:

- **The Katalog's `scene` field is optional**, because entries published before it existed do not have one and fall back to matching on the slug their own title produces.
  Sources: [src/content.config.ts:27-37](), [src/lib/types.ts:14-22]()
- **The catalog is read again per page rather than cached**, because Astro already holds the content collection for the build and a cache would only add a path no test could exercise.
  Sources: [src/layouts/Base.astro:16-21]()

## Vocabulary

The domain terms the ADRs and the code share are defined once in [`CONTEXT.md`](../../CONTEXT.md): Simulasi, Katalog, Halaman Simulasi, Tingkat, Kelas, Mata Pelajaran, Konsep, Slug, Daftar Cetak, Palet.

Sources: [CONTEXT.md:5-45]()

## Related pages

- [Architecture Overview](overview.md)
- [Build Pipeline](build-pipeline.md)
- [Cloudflare Deployment](../deployment/cloudflare-worker.md)
- [Site Theming](../development/theming.md)

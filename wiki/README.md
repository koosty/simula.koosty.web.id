# Simula — Technical Wiki

Documentation of the Simula repository: what the code does, why it is shaped that way, and where each decision is written down.

Simula is a static, Bahasa Indonesia catalogue of interactive learning simulations. Simulations are produced by an external tool as self-contained HTML files and are copied into the site verbatim; everything the site publishes around them is generated at build time from a directory of catalog YAML files.

Start with [Architecture Overview](architecture/overview.md).

## Reading order

1. [Architecture Overview](architecture/overview.md) — what the site is, how a build runs, the two trust boundaries.
2. [Architecture Decisions](architecture/decisions.md) — the fourteen ADRs and which are superseded.
3. [Catalog Model](content/catalog-model.md) — the one source of truth and its validation rules.
4. [Simulation Discovery](content/simulation-discovery.md) — how the tool's English folders become Indonesian URLs.

## Contents

### Architecture

| Page | What it covers | Importance |
|---|---|---|
| [Architecture Overview](architecture/overview.md) | The site's shape, technology choices, the build in one pass, trust boundaries. | High |
| [Build Pipeline](architecture/build-pipeline.md) | Every command, the two integration hooks, what lands in `dist/`. | High |
| [Architecture Decisions](architecture/decisions.md) | Index of `docs/adr/` with status and implementation pointers. | High |

### Content model

| Page | What it covers | Importance |
|---|---|---|
| [Catalog Model](content/catalog-model.md) | The seven catalog fields, the Zod schema, error-versus-warning validation rules, derived URLs. | High |
| [Simulation Discovery](content/simulation-discovery.md) | On-disk layout, the two level mappings, what stops a build. | High |

### Features

| Page | What it covers | Importance |
|---|---|---|
| [Home Page](features/home-page.md) | The bench layout, the featured simulation, stage and class previews. | Medium |
| [Site Navigation and Layout](features/site-navigation.md) | `Base.astro`, the document head, how nav links are built. | Medium |
| [Landing Pages](features/landing-pages.md) | Stage, class and subject pages, and the addresses that select them. | High |
| [Katalog Page](features/katalog-page.md) | The full list, its three filters, and the client script that hides cards. | High |
| [Simulation Page](features/simulation-page.md) | The Halaman Simulasi, the iframe, and the frame measurement lifecycle. | High |
| [Printable Class Sheet](features/printable-class-sheet.md) | The Daftar Cetak, its print CSS and its `noindex`. | Medium |
| [Sitemap and Robots](features/sitemap-and-robots.md) | `/sitemap.xml`, `/robots.txt` and the Peta Situs page. | Medium |

### Development

| Page | What it covers | Importance |
|---|---|---|
| [Publishing Simulations](development/publishing-simulations.md) | `publish-batch.mjs`, planning, refusals, the deploy hook, the backfill script. | High |
| [Site Theming](development/theming.md) | The Palet tokens, how they are emitted, and the contrast arithmetic. | Medium |
| [Testing](development/testing.md) | Commands, the two kinds of test, CI, and what the suite holds the design to. | Medium |

### Deployment

| Page | What it covers | Importance |
|---|---|---|
| [Cloudflare Deployment](deployment/cloudflare-worker.md) | Worker assets config, setup steps, `_headers`, the deploy hook. | High |

## Vocabulary

The project fixes its own domain terms in [`CONTEXT.md`](../CONTEXT.md): **Simulasi**, **Katalog**, **Halaman Simulasi**, **Tingkat**, **Kelas**, **Mata Pelajaran**, **Konsep**, **Slug**, **Daftar Cetak**, **Palet**. Each entry names what to call it and what not to. This wiki uses those words throughout.

## Repository at a glance

| Area | Location |
|---|---|
| Routes and components | [`src/pages/`](../src/pages/), [`src/components/`](../src/components/), [`src/layouts/`](../src/layouts/) |
| Shared logic | [`src/lib/`](../src/lib/) |
| Astro integration | [`src/integrations/`](../src/integrations/) |
| Catalog entries | [`src/content/simulasi/`](../src/content/simulasi/) — 71 files |
| Simulation files | [`simulations/`](../simulations/) — 71 files |
| Tooling scripts | [`scripts/`](../scripts/) |
| Tests | [`test/`](../test/) — 23 files |
| Decisions | [`docs/adr/`](../docs/adr/) — 14 records |

## Known coverage gaps

- **No page documents the individual simulation HTML files.** They are the external tool's output and this repository never edits them; what is documented is how they are discovered, copied and framed.
- **Stale counts in existing prose.** `README.md:53-61` and `src/lib/theme.ts:77-78` say all 23 simulations are hardcoded to dark and ship a light palette; the repository now holds 71. `src/integrations/copySimulations.ts:31-37` already says 71.
- **`src/pages/index.astro:69-72`** frames the featured simulation without the frame-resizing script; whether that is deliberate or a gap is not stated in the source.
- **No page covers `eslint.config.mjs` in detail**, beyond the note in [Testing](development/testing.md) about which files are skipped.

See [Wiki Structure](wiki-structure.md) for the page inventory, source coverage and open questions.

# Simula — Technical Wiki

Documentation of the Simula repository: what the code does, why it is shaped that way, and where each decision is written down.

Simula is a static, Bahasa Indonesia catalogue of interactive learning simulations. Simulations are produced by an external tool as self-contained HTML files and are copied into the site; everything the site publishes around them is generated at build time from a directory of catalog YAML files.

Start with [Architecture Overview](architecture/overview.md).

## Reading order

1. [Architecture Overview](architecture/overview.md) — what the site is, how a build runs, the two trust boundaries.
2. [Architecture Decisions](architecture/decisions.md) — the twenty-five ADRs and which are superseded or amended.
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
| [Home Page](features/home-page.md) | The hero, stat cards, the featured simulation, stage and class previews. | Medium |
| [Site Navigation and Layout](features/site-navigation.md) | `Base.astro`, the document head, the header and its light and dark switch, the logo, icons, favicon and footer. | Medium |
| [Landing Pages](features/landing-pages.md) | Stage, class and subject pages, and the addresses that select them. | High |
| [Katalog Page](features/katalog-page.md) | The full list, its three filters, and the client script that hides cards. | High |
| [Simulation Page](features/simulation-page.md) | The Halaman Simulasi, the full-width iframe, the frame measurement and theme sync. | High |
| [Printable Class Sheet](features/printable-class-sheet.md) | The Daftar Cetak, its print CSS and its `noindex`. | Medium |
| [Sitemap and Robots](features/sitemap-and-robots.md) | `/sitemap.xml`, `/robots.txt` and the Peta Situs page. | Medium |

### Development

| Page | What it covers | Importance |
|---|---|---|
| [Publishing Simulations](development/publishing-simulations.md) | `publish-batch.mjs`, planning, refusals, the deploy hook, the backfill script. | High |
| [Site Theming](development/theming.md) | The Palet tokens for both palettes, how they are emitted, the contrast arithmetic, and how simulations follow them. | Medium |
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
| Static assets, fonts and favicon | [`public/`](../public/) |
| Catalog entries | [`src/content/simulasi/`](../src/content/simulasi/) — 71 files |
| Simulation files | [`simulations/`](../simulations/) — 71 files |
| Tooling scripts | [`scripts/`](../scripts/) |
| Tests | [`test/`](../test/) — 25 files |
| Decisions | [`docs/adr/`](../docs/adr/) — 25 records |

## Known coverage gaps

- **No page documents the individual simulation HTML files.** They are the external tool's output. The repository does edit them by hand (ADR 0023), so what is documented is how they are discovered, copied, framed and themed, not their content.
- **The next publish overwrites the hand edits to the simulation files.** ADR 0023 accepts this; the generator template outside this repository has not been changed to match.
- **`src/pages/index.astro`** frames the featured simulation without the frame-resizing script and without the theme sync. The source does not say whether that is deliberate. See [Home Page](features/home-page.md).
- **`src/lib/frame.ts:4-9`** quotes a height range measured across 23 simulations. The repository holds 71, and the range has not been measured again. See [Simulation Page](features/simulation-page.md).
- **No page covers `eslint.config.mjs` in detail**, beyond the note in [Testing](development/testing.md) about which files are skipped.

See [Wiki Structure](wiki-structure.md) for the page inventory, source coverage and open questions.

# Tingkat is locked to SD, SMP and SMA; specialisation has no class

Amends `0003`, `0004`, and `0011`. `0026` is unchanged.

## Decision

- The Tingkat (`level`) of a simulation is one of `sd`, `smp`, `sma`. Nothing else is a Tingkat. `smk` is removed from `src/lib/tingkat.ts` and from the publish pattern in `src/lib/publish.ts`.
- Subjects that do not belong to a class in these Tingkat are filed under `spesialisasi`. Specialisation is a subject area, not a school level, so it has no class (kelas).
- A catalog entry with `level: spesialisasi` has no `grade`. Entries with `sd`, `smp`, or `sma` keep a `grade`, and it is required for them.
- URL: `/spesialisasi/<mapel>/<slug>/`. There is no `kelas` segment. Tingkat URLs keep their shape: `/<tingkat>/kelas-<n>/<mapel>/<slug>/`.
- Disk: `simulations/spesialisasi/<mapel>/<slug>.html`. The publish course is named `<mapel>-spesialisasi`, with no `kelas` in the name and no `--grade` flag.

## Why

- Specialisation covers subjects that are not taught by class, so a class segment would invent a grade the simulation does not have.
- A locked list stops a new Tingkat from appearing by accident. Free-form values (`src/content.config.ts`) accepted `smk` and other codes that the publish script then rejected, and that mismatch was not visible until publish ran.
- Keeping the `/<tingkat>/kelas-<n>/` shape for SD, SMP, and SMA leaves the 71 published simulations at their current addresses (`docs/adr/0007`).

## Consequences

- `level` in the catalog schema becomes an enum: `sd | smp | sma | spesialisasi`. `grade` is optional, and required for `sd`, `smp`, and `sma`. The schema must enforce this, not only the publish script.
- `simulasiUrlSegments` and `simulasiUrl` in `src/lib/catalog.ts` build the spesialisasi path without a class. A new route `src/pages/spesialisasi/[mataPelajaran]/[slug].astro` serves it. The `[tingkat]/[kelas]` routes do not accept `spesialisasi`.
- Landing, home, katalog, and sitemap must handle entries that have no class. The Katalog class filter applies only to Tingkat entries.
- `scripts/publish-batch.mjs` accepts a course named `<mapel>-spesialisasi` without a grade. Its stage map gains `spesialisasi`.
- Skill `course-outline` (`.agents/skills/course-outline/SKILL.md`) lists the Tingkat and the specialisation course name.
- The wiki pages that describe Tingkat and URL shape (`katalog-page`, `site-navigation`, `publishing-simulations`) are updated with the code.

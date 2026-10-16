# Simulations are authored in this repository

Amends `0005`, `0007`, and `0023`. `0002`, `0003`, `0011`, and `0012` are unchanged.

## Decision

- Course sources live in `courses/<slug>/`: `outline.yaml` and `scenes/<id>.html`. This folder is not tracked by Git. `.gitignore` lists it.
- The generator skill (`course-generate`, with `widget-page`) reads and writes that folder in this repository. No external tool repository is needed.
- `scripts/publish-batch.mjs` reads `courses/` in this repository by default. The `SIMULA_TOOL_REPO` variable and the `--tool` argument are removed.
- Publish writes to `simulations/<stage>/<grade>/<subject>/` and to `src/content/simulasi/`. Both are tracked by Git and are the published result.
- Manual fixes are made in `courses/<slug>/scenes/`, then published again. A fix made directly in `simulations/` is overwritten by the next publish and is not allowed.

## Why

- Course outputs often need manual fixes after conversion. Keeping the source in one place, and rerunning publish, is simpler than editing copies in two repositories.
- Publish already holds the rules that make a file visible on the site: slug, catalog entry, numbering, and address conflicts (`0007`). Copying files without these rules would leave the catalog out of step.

## Consequences

- The `courses/` folder exists only on the machine that generates it. If it is lost, the published result stays, but the source must be rebuilt. Back it up if many manual fixes were made.
- `0005` and `0023` said simulation files come from an external tool and are not edited. That is no longer true. Files in `simulations/` are produced by publish from `courses/` and must not be edited by hand.
- The README and `wiki/development/publishing-simulations.md` must describe this flow.

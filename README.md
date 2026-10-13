# Simula

A static, Bahasa Indonesia catalogue of interactive learning simulations.

Simulations are produced by an external tool as self-contained HTML files and are
copied into the site verbatim. This repository never edits their contents. See
`CONTEXT.md` for the domain vocabulary and `docs/adr/` for the decisions behind the
site's shape.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the dev server |
| `npm run build` | Build static output into `dist/` |
| `npm run preview` | Serve the built output locally |
| `npm run check` | Typecheck the Astro and TypeScript sources |
| `npm run lint` | Lint the sources, including the inside of `.astro` files |
| `npm test` | Build, then run the tests against the built output |
| `npm run verify` | Everything a change must pass: check, lint, then test |

The tests read the emitted HTML in `dist/` rather than the source, because what
ships is what matters. `npm test` builds first, so a stale `dist/` cannot make
them pass. Node 22.12 or newer is required, which is what Astro needs.

There is no autoformatter. Code is formatted by hand, so run `npm run lint` and
fix what it reports rather than expecting a tool to settle the layout.

Linting is ESLint with `eslint-plugin-astro`, which reads a whole `.astro` file:
frontmatter, template and `<script>` together. That is the reason for choosing
it, since a linter that reads only the frontmatter calls every variable the
template uses unused. Simulation files under `example-simulations/` are skipped,
because the external tool produces them and this repository never edits them.

## Deploying

Hosting is Cloudflare Pages, per `docs/adr/0002`. The site builds on push to the
main branch.

1. **Push this repository to a Git host** (GitHub, GitLab, or Bitbucket).

2. **Create the Cloudflare Pages project.** In the Cloudflare dashboard, under
   Workers & Pages, create a Pages project connected to the repository:

   - Framework preset: `Astro`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: `22` or newer, set under Settings, since Astro requires it

3. **Attach the custom domain.** Add `simula.koosty.web.id` to the project's
   Custom Domains. Cloudflare adds the required DNS record automatically when the
   zone is on the same account.

   The name must resolve before the certificate can be issued. Confirm with
   `dig simula.koosty.web.id` once the project is created.

4. **Verify.** The home page should answer over HTTPS at
   `https://simula.koosty.web.id/`, with `lang="id"` in the served markup.

   `npm test` runs the same build the deploy does, so running it locally first
   catches a broken build before it reaches the dashboard.

## Publishing a batch of simulations

Simulations arrive from the external tool as its own HTML files. `npm run publish`
copies them in and writes their catalog entries. Nothing is edited by hand, and
nothing is renamed.

```
SIMULA_TOOL_REPO=/path/to/simula-w npm run publish
```

The path may be the tool's repository root or the course directory inside it;
`--tool` overrides it for one run. `--check` reports what would change and
writes nothing, which is what to run first.

### What it does

For each scene the tool marks `ready` in its outline, the script writes:

- `example-simulations/<stage>/<grade>/<slug>.html`, copied byte for byte. This
  site never edits a simulation's contents.
- `src/content/simulasi/<slug>.yaml`, the catalog entry.

The slug is the scene title reduced to lowercase with hyphens, dropping the
course name the tool appends (`· Matematika SMP Kelas VII`).

### What it will not do

- **Rename or delete.** A simulation whose content the tool rewrote keeps its
  filename, its catalog entry and its URL, so a published link and its search
  ranking survive the correction (`docs/adr/0007`). Matching is on the tool's
  scene id, recorded as `scene` in each catalog entry, so even a completely
  reworded title keeps its address.
- **Renumber.** A new simulation is placed after everything already published.
  An existing order is already in the search index and does not move.
- **Overwrite a published address.** Two scenes whose titles reduce to the same
  slug, or a new scene whose slug a published one already holds, stops the
  batch with an explanation instead of one silently taking the other's place.

Renaming a simulation file by hand fails the build, since its catalog entry
would point at a file that is not there.

## Deploy hook

`docs/adr/0002` records that the tool triggers a rebuild by POSTing to a deploy
hook. Create the hook under the project's Settings in the Cloudflare dashboard,
then set it where the script runs:

```
SIMULA_DEPLOY_HOOK=https://api.cloudflare.com/client/v4/pages/.../deploys
```

That URL is a credential, so it belongs in the environment and not in this
repository. With it set, `npm run publish` writes the batch and asks Cloudflare
Pages to rebuild. Without it the batch is still written and the script says so;
commit and push it by hand instead.

The script never commits or pushes. Whoever runs it decides what goes into
git — a hook on another host may do that part itself.

## Current status

The site builds and the home page has been verified in a browser, but **the site
is not live yet**. There is no DNS record for `simula.koosty.web.id` and no
Cloudflare project yet, both of which need dashboard access. Steps 1 to 4 above
are what remains.
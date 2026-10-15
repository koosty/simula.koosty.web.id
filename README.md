# Simula

A static, Bahasa Indonesia catalogue of interactive learning simulations.

Simulations are produced by an external tool as self-contained HTML files and are
copied into the site verbatim. This repository does not reshape them to suit the
site, though a simulation that is broken on its own terms is fixed in place. See
`CONTEXT.md` for the domain vocabulary and `docs/adr/` for the decisions behind the
site's shape.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the dev server |
| `npm run build` | Build static output into `dist/` |
| `npm run deploy` | Build, then upload to Cloudflare with wrangler |
| `npm run deploy:preview` | Build, then serve `dist/` through wrangler as Cloudflare will |
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
template uses unused. Simulation files under `simulations/` are skipped,
because the external tool produces them and this repository does not reshape them.

## Colour

The site and all 71 simulations use the Neo-Arcade STEM palette (`docs/adr/0015`), with the values from the Stitch prototype (`docs/adr/0017`).
The site's values live in `src/lib/theme.ts` and are emitted once as CSS custom
properties; a page writes `var(--text-muted)` and never a literal. Each
simulation carries the same values in its own `:root` block, because a
simulation is a standalone file.

Two things are worth knowing before changing a colour there:

- The accent (cyan `#00f0ff`) is for actions, not running text. A test checks
  the text roles and that the accent is not one of them. Links use their own
  token, `--link`, even though the value matches the accent today.
- Canvas drawings in the simulations use hex values, since canvas cannot read
  `var(--token)`. A palette change means editing `theme.ts` and the simulation
  files together.

`src/lib/theme.ts` also holds the contrast arithmetic, so a new colour can be
checked against the ratio its use needs before it reaches a page.

## Deploying

Hosting is Cloudflare Workers serving static assets, per `docs/adr/0014`. The
site builds on push to the main branch.

1. **Push this repository to GitHub.** There is no remote configured yet:

   ```
   git remote add origin <url>
   git push -u origin main
   ```

   A push also runs `.github/workflows/verify.yml`, which is `npm run verify`:
   check, lint, tests. It gates nothing on its own, but it is the same work the
   deploy does, so a red run is a build that would have failed.

2. **Create the Cloudflare project.** In the Cloudflare dashboard, under
   Workers & Pages, create a **Workers** project connected to the repository:

   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Node version: read from `.nvmrc`, which pins what `package.json` asks for.
     Set it under Settings only if the build log disagrees

   `wrangler.jsonc` names the assets directory, so wrangler uploads `dist/` and
   nothing needs saying about an output directory. Do not set
   `html_handling` to `none` in that file: it also disables folder index
   resolution, and every page URL on the site then returns 404.

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

The stage, grade and subject are read from the course folder name when it is
`<mapel>-<sd|smp|sma>-kelas-<romawi>`. A course named any other way says them
with flags instead, which also override the name:

```
npm run publish -- --tool /path/to/course --subject ipa --stage lower-secondary --grade 7
```

An IPA scene and a Matematika scene may share a scene id, because a scene id
counts one course's scenes. A published simulation is only recognised as the
same one when the subject matches too (`docs/adr/0012`).

### What it does

For each scene the tool marks `ready` in its outline, the script writes:

- `simulations/<stage>/<grade>/<subject>/<slug>.html`, copied byte for byte. The
  site does not reshape a simulation to suit itself; a simulation broken on its
  own terms is fixed where it lives. `docs/adr/0005` draws that line.
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
hook, and `docs/adr/0014` keeps that working on Workers. Create the hook under
the project's Settings in the Cloudflare dashboard, then set it where the script
runs:

```
SIMULA_DEPLOY_HOOK=https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/<uuid>
```

That URL is a credential, so it belongs in the environment and not in this
repository. It is also checked before anything is sent: it must be `https` on
`api.cloudflare.com`, since the URL is what authorises the rebuild and posting
it elsewhere would hand that authority to another host. A URL that fails the
check is reported and the script exits; the batch is already written either
way, so nothing is lost. The request gives up after 30 seconds rather than
hanging the publish.

With it set, `npm run publish` writes the batch and asks Cloudflare to rebuild.
Without it the batch is still written and the script says so; commit and push
it by hand instead.

The script never commits or pushes. Whoever runs it decides what goes into
git — a hook on another host may do that part itself.

## Printing a class's list

Every class page carries a printable sheet at `/smp/kelas-7/cetak/`: the whole
term's simulations in syllabus order, numbered, with title, Mata Pelajaran,
description and address. Open the sheet and use the browser's own print
dialog — it needs no settings changed, because the page already prints black on
white without the site navigation.

The sheet is `noindex` and is not listed in the sitemap, since it repeats the
class page's content at a second address. See `docs/adr/0008`.

## Current status

The in-repo work is done and verified: the site builds, `npm run verify` passes,
the response headers and the deploy hook are in place. What remains needs
account access and cannot be done from this repository:

- Create the GitHub repository and add the remote.
- Create the Cloudflare Workers project and connect it to that repository.
- Attach the custom domain and let the DNS record resolve.
- Create the deploy hook and export `SIMULA_DEPLOY_HOOK`.


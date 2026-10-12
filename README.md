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

## Deploy hook

`docs/adr/0002` also records that the external tool triggers a rebuild by POSTing to
a deploy hook, so a finished batch of simulations publishes without a person in the
middle. Create the hook under the project's Settings, and keep the URL in the tool's
configuration rather than in this repository, since it is a credential.

This is not wired up yet; it arrives with the ticket that makes the tool publish
itself.

## Current status

The site builds and the home page has been verified in a browser, but **the site
is not live yet**. There is no DNS record for `simula.koosty.web.id` and no
Cloudflare project yet, both of which need dashboard access. Steps 1 to 4 above
are what remains.
# Simulations may load pinned libraries from a CDN, with integrity hashes

Amends `0005` and `0017` for external assets. Fonts stay self-hosted. The iframe, the height measurement and the tab order from `0005` are unchanged.

## Decision

- A simulation may load a library script from `cdnjs.cloudflare.com` or `unpkg.com`. Only these two hosts are allowed.
- Every such script names an exact version in its URL, and carries `integrity="sha384-…"` and `crossorigin="anonymous"`. The browser refuses a file whose hash differs.
- Import maps for ES modules (three.js) must pin the version. An import map cannot give a hash to every file a module imports, so it is pinned but not hashed. This is a known limit.
- Fonts are not loaded from a CDN. The site's `public/fonts/` files are used, with system fonts as fallback. This keeps the simulations working without a network connection, and a student's font requests stay on the site.
- `test/simulation-externals.test.ts` enforces the rule for every simulation file.

## Why

- Twelve simulations already loaded KaTeX, marked, highlight.js and three.js from a CDN. Under the old rule they were in breach of `0005` and `0017`. Allowing the pinned, hashed form makes the existing practice safe to keep.
- A CDN copy of a library is shared across sites, so a school's network can cache it. Self-hosting every library would add files to the repository for no gain in what the student sees.
- Fonts are a different case. They are small, already self-hosted, and loading them from a third party would send each student's requests to that party.

## Consequences

- `0005`'s statement that simulations have "no external asset references" is replaced by this rule.
- `0017` no longer says that nothing is loaded from other hosts. Fonts are still self-hosted, as `0017` set them.
- The eight Indonesian simulations that load KaTeX and marked were edited to add `integrity` and `crossorigin`. Their script URLs are unchanged.
- A new library, or a new version, needs its hash computed from the file the CDN serves, and the test must still pass.

# The site footer shows the release and a credit

Builds on `0017` (the Stitch prototype is the design). Does not change `0019` or `0023`.

## Decision

- Every page built with `Base.astro` ends with a footer below its content. It uses the header's bar style, mirrored to the bottom edge.
- The footer shows the release, `v1.0.0`, in a bordered tag, and the credit line "Made with" followed by a solid heart and "by Papa Caca". The heart is the Lucide `heart` icon filled with the palette's new `error` token (`#ffb4ab` dark, `#ba1a1a` light, both from the Stitch prototype). The word "Love" stays in the markup for screen readers. The credit links to the repository.
- The Stitch footer's status pill ("ONLINE"), its telemetry line, its company name and its "insert coin" line are not copied. They describe a live status and a company that the site does not have.
- The footer is hidden when printed, as the navigation is, so a printed page carries only its own content.

## Why

- The Stitch footer is placeholder content in the same way as its scores and credits, which ADR 0017 already leaves out.
- A version tag tells a teacher or a pupil which release they are reading when a bug is reported.

## Consequences

- The version is a constant in `src/layouts/Base.astro`. It must be changed with each release. `package.json` still says `0.0.1`; it was not changed here.
- The credit and the repository link are fixed text in the layout. A test or the wiki will not notice if the link goes stale. The one absolute link is exempted from the slash check in `test/sitemap-built.test.ts`.
- ADR 0015 calls the magenta `secondary` colour (`#ff4a8d`) "the error colour". The new `error` token is a second red. ADR 0015 is not amended here; the two need reconciling.
- The dark `error` value is pale pink-red, not a strong red. On the dark surface this is the Stitch value; a stronger dark red would need its own contrast check.

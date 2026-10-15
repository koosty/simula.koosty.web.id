# The site uses tab navigation and card grids

Superseded by `0017` for layout. Supersedes `0010` for layout: the list of rows on the home page and the plain navigation list. The palette stays with `0015` for its roles, but its values are replaced by `0017`. The lab bench opening on the home page, with text on the left and the framed simulation on the right, is kept.

## Decision

- The navigation is a row of tabs under the site name. Labels are uppercase monospace. The current tab is marked with a cyan line along its bottom edge, and the `aria-current` marking stays.
- Every grid of simulations uses one card style, defined once in `src/layouts/Base.astro`: a 1px border, the surface colour, and a 2px accent bar along the top edge.
- The home page shows each class as a card grid instead of a list of rows. The order is still the catalogue order.
- The related simulations on a simulation page are cards.

## Why the list of rows goes

The home page used a list so that a class reads in syllabus order, one line per simulation. A card grid shows the same order, uses the same card as the catalogue and the class pages, and makes each simulation an easier target on a phone. The order did not depend on the list shape.

## What does not change

- The height of the embedded simulation frame is still measured, and the frame still keeps the `400px` fallback (`docs/adr/0005`).
- The printable sheet (`docs/adr/0008`) keeps its own layout. `src/components/Sheet.astro` is not touched.
- Below 760px the opening stacks in one column, as before.

## Consequences

- The card CSS that `LandingPage.astro` and `katalog.astro` each held is removed, so the three places that show cards cannot drift apart.
- Elements from the Neo-Arcade lobby that only make sense for a game, such as credits, a leaderboard, and streak counts, are not used. The site has no points to show.
- Tests that pinned the list of rows needed no change: no test asserted the `rows`, `row`, or nav-list markup, and the full suite passes.

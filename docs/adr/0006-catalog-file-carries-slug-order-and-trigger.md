# The catalog file carries description, order, and the simulation's filename

Each simulation's catalog file holds the Bahasa Indonesia description, an explicit display order, and the name of the simulation file it describes. The filename is the simulation's slug: simulation files are named by slugifying their own title, so `Sudut dalam Segitiga` becomes `sudut-dalam-segitiga.html`. A separate slug override field was dropped, since a slug that disagrees with the filename is a second source of truth for the same URL. All 23 current titles slugify to unique values, so no collision handling is needed today; a duplicate slug still fails the build.

Display order is an explicit integer because filename order breaks the moment the tool renumbers a batch, and alphabetical order scrambles a syllabus into nonsense. Order stays the only prominence signal and there is no separate featured flag to drift out of sync.

Amended: this decision previously said the first entries in each Kelas render as cards and the rest as a list. The Katalog does not do that. Every simulation renders as the same kind of card, in display order, so a reader reading down the page meets the syllabus in teaching order. A split into cards and a plain list needed a cutoff, and any cutoff is a number the content does not supply: nothing in a simulation says where prominence should stop. Where the home page shows only the leading entries of a Kelas is that cutoff, and it comes from the order itself rather than a stored flag.

The number of cards on the Katalog is not capped for the same reason. A cap would hide simulations from a page whose job is to list every one, and the filters exist to narrow a long list instead.

Naming files after their title has one accepted consequence: rewording a title changes its URL and breaks existing links. The filename is treated as the stable identity from that point on, and the tool is asked not to rename a file once it is published.

New simulations reach the site through the deploy hook ADR 0002 records, so the site rebuilds without a person in the middle; the initial pipeline is proven with manual commits first.

Amended by the publishing pipeline: the tool is still asked not to rename a file,
but it is no longer the only thing standing between a reworded title and a moved
URL. Each catalog entry now records the tool's scene id as `scene`, and the
pipeline matches an incoming scene to a published entry by that id rather than
by its title. A scene whose title the tool has completely reworded is therefore
recognised as the same simulation and keeps its slug, entry and URL. Entries
published before the field existed have no scene id and fall back to matching on
the slug their own title produces; they can be backfilled with
`scripts/backfill-scene-ids.mjs`, which reports what it cannot match instead of
guessing.

Matching by title alone was tried first and is wrong: the pipeline saw a reworded
title as a brand-new simulation and published it at a new address, which is
precisely the loss ADR 0007 rules out.

# The catalog file carries description, order, and the simulation's filename

Each simulation's catalog file holds the Bahasa Indonesia description, an explicit display order, and the name of the simulation file it describes. The filename is the simulation's slug: simulation files are named by slugifying their own title, so `Sudut dalam Segitiga` becomes `sudut-dalam-segitiga.html`. A separate slug override field was dropped, since a slug that disagrees with the filename is a second source of truth for the same URL. All 23 current titles slugify to unique values, so no collision handling is needed today; a duplicate slug still fails the build.

Display order is an explicit integer because filename order breaks the moment the tool renumbers a batch, and alphabetical order scrambles a syllabus into nonsense. The first entries in each class render as cards at the top and the rest as a list, so order is the only prominence signal and there is no separate featured flag to drift out of sync.

Naming files after their title has one accepted consequence: rewording a title changes its URL and breaks existing links. The filename is treated as the stable identity from that point on, and the tool is asked not to rename a file once it is published.

New simulations reach the site through the deploy hook ADR 0002 records, so the site rebuilds without a person in the middle; the initial pipeline is proven with manual commits first.

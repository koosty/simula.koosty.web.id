# The catalog file is authoritative, not the simulation's own metadata

Each simulation gets a catalog file, whose fields ADR 0006 owns. Simulations already declare `education_levels`, `grade`, and a description in their own HTML, so this duplicates information; a build check asserts the two agree and fails the build when they drift. Reading the simulation HTML directly was considered and rejected, because one malformed tag in one file would then break the whole build, and because the simulation's own description is written for the Halaman Simulasi rather than for the Katalog.

# Simulations are grouped by subject on disk, and file names are unique across subjects

Every subject's simulations used to share one grade folder, so a file's place on disk did not say what it was. The subject lived only in its catalog entry. Two subjects with the same title would also have collided, because the copy step writes every simulation for a level into one flat folder.

The source tree is now `simulations/<stage>/<grade>/<subject>/<slug>.html`. The stage and grade folders keep their English names (ADR 0003). The subject folder uses the Indonesian name the tool puts in its course name, such as `matematika`, since that is the only place the subject is written in the tool's output.

The scanner refuses two things rather than guessing:

- A simulation placed directly in a grade folder, since it would have no subject.
- A file name that appears under two subjects, or under two stages that map to the same level. The copy step would otherwise replace one with the other without any error.

Published addresses do not change. Raw and Halaman URLs still use only the level and the slug, so a title can belong to one subject per level. Putting the subject into every URL was considered and not chosen, because it would change the raw addresses the frame loads (ADR 0007) and no two current subjects share a title. This should be revisited if they ever do.

The loader warns when a simulation's subject folder does not match the subject its catalog entry names.

# URLs use Bahasa Indonesia path segments

A simulation is addressed as `/tingkat/kelas/mata-pelajaran/slug/`, for example `/smp/kelas-7/matematika/sudut-dalam-segitiga/`. The tool writes English source folders (`lower-secondary/grade-7/`); the build maps them to Indonesian segments (`smp`, `kelas-7`) through one table, because that is what an Indonesian teacher reads and searches for. The mapping costs nothing extra since a build step already exists.

Each simulation gets a generated Halaman Simulasi rather than linking straight at the raw file, because the raw file has no canonical URL, no internal links pointing at it, and a meaningless filename.

The simulation tool organises its own output by course, writing to `courses/matematika-smp-kelas-vii/scenes/`, so a URL shaped like `/matematika-smp-kelas-vii/` was considered and passed over. The level-first path is kept: `/smp/kelas-7/matematika/` groups the same subject across every class, which is what a teacher moving up a grade or comparing classes needs, and the subject segment at the end still carries the keyword the course name would have carried. The course layer stays internal to the build.

Superseded the original framing of this decision, which mirrored the English source folders verbatim. The Bahasa path was chosen over the mirrored path and over a half-translated path; the source layout stays an internal detail of the build.

# Simula

A Bahasa Indonesia website that collects interactive learning simulations produced by other tools and helps pupils and teachers find the right simulation for a class.

## Language

**Simulasi**:
A single self-contained interactive HTML file that teaches one concept. Produced by an external tool, never authored or edited here.
_Avoid_: simulation (English), widget, app, game

**Katalog**:
The site's complete list of simulations, assembled at build time from the catalog files. Never hand-written as HTML.
_Avoid_: index page, listing page, directory

**Halaman Simulasi**:
The generated page that wraps one simulation: its Bahasa Indonesia title, description, level, class, subject, and a link that opens the simulation.
_Avoid_: wrapper, landing page, detail page, simulation page

**Tingkat**:
The education stage a simulation belongs to. One simulation belongs to exactly one tingkat.
_Avoid_: level, education level, jenjang

**Kelas**:
The grade within a tingkat, written 1 to 12.
_Avoid_: grade, year

**Mata Pelajaran**:
The school subject a simulation supports. An open set: new subjects appear as content arrives, no fixed list is enforced.
_Avoid_: subject, mapel, discipline

**Konsep**:
The single knowledge idea a simulation teaches, as declared by the simulation's own machine-readable metadata. One simulation teaches exactly one konsep.
_Avoid_: topic, chapter, unit, learning objective

**Slug**:
The Bahasa Indonesia URL segment for a simulation, derived from its title. Carries meaning for humans and crawlers, unlike the source filename.
_Avoid_: permalink segment, filename

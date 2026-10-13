# Simulations are embedded in an iframe, not linked

Each Halaman Simulasi embeds its simulation in an iframe instead of linking to the raw HTML file. The simulations are fully self-contained, with no external asset references and inline style and script, so an iframe has nothing to break on, and the pupil keeps their place with the site's navigation and back button intact.

The alternative, navigating to or opening the raw file in a new tab, was rejected because it exposes a second URL serving identical content with no canonical link pointing at the Halaman Simulasi, leaving a crawler to guess which page is real. The Halaman Simulasi carries a canonical link to itself and the raw file is linked with `noindex` so it is the only indexed URL for a simulation.

The frame grows to the simulation's measured content height instead of scrolling internally, since a scrollbar inside the frame hides part of the answer on a classroom projector. Measured on all 23 simulations: content height is stable from load and never grows during use, but it differs between simulations by a wide margin (670px to 1911px at a 1280px viewport) and, within a single simulation, by up to 578px as the viewport width changes. Two independent reasons, then, why no height can be known at build time: the tallest simulation is nearly three times the shortest, and one simulation's own height moves with the window. The height is measured in the browser.

The measurement is taken from the rendered bounds of the child's elements. The child's own reported scroll height cannot be used, because a frame set to a height makes the document inside it report exactly that height, so the reading is circular and reports a page as always exactly as tall as the frame. A `ResizeObserver` on the child follows content changes, and a second observer on the frame re-measures when the width changes. The frame starts small so it cannot stretch the document it is measuring, and at a fixed fallback height so something usable shows before the first measurement lands.

A library such as `@iframe-resizer` was rejected: it is GPL-3.0 and requires a script injected into the child page, and this project never edits the simulation files.

Inlining the simulation into the page instead of framing it was tested and rejected. Splitting a simulation into its css, script, and body markup and injecting them into the Halaman Simulasi removes the height measurement entirely and renders the simulation at full size, but containment becomes a per-simulation problem rather than a solved one. All 23 simulations style the bare `body` and `h1` elements and use the generic class names `btn`, `panel`, and `wrap`, so unwrapped css restyles the site's own headings and navigation. Prefixing every selector with the simulation's host element does contain the cascade, verified against deliberately loud site styles, but it does not re-scope `position: fixed`: the one simulation using it, which opens a full-screen overlay, rendered 6086px tall instead of 968px because the overlay stopped being an overlay and joined normal flow. Any future simulation using `position: fixed`, viewport units, or absolute positioning against a positioned ancestor would break the same way, and nothing in the build detects it before rendering. Shadow DOM contains the cascade perfectly but breaks the simulations outright, because their script cannot reach elements inside the shadow tree and fails with a null-reference error before rendering anything.

The deciding factor is what a bad simulation can cost. Framed, a simulation is confined: the worst case is an ugly frame that we notice in review. Inlined, its css reaches the site navigation and headings, so a single bad file can break pages it does not belong to. Framing costs a small amount of script that the height measurements justify; inlining costs attention per simulation, forever, on a class of breakage the build cannot detect.

The frame carries a `title` naming the simulation, sits under a breadcrumb, and is followed by a visible link to open the simulation in a new tab as a fallback for devices that block iframes.

## The measurement was circular anyway, until it was tested

This ADR argued from the start that the child's own reported height cannot be
used, because a frame set to a height makes the document inside it report that
height back. The first implementation obeyed the letter of that and broke it in
spirit: it read each element's bounding box and used `body`'s box as the floor,
and `body`'s box is laid out to the height of its container — the frame. So the
frame could report its own height and the reading would be circular after all.

Measured on `operasi-hitung-bilangan-bulat`: the frame sat at 1116px for 821px
of content on some loads and at 400px with no measurement at all on others, which
is what was reported. Three separate faults, each reproduced by reloading:

The floor was the frame's height read back. The document's own height was the
one value never to be trusted, and it was the value the answer started from.

The fallback height was assigned *after* the load listener. A frame that had
already loaded measured correctly and was then reset to the 400px fallback by
the next line, leaving `data-measured` unset and the simulation cut off.

A frame that finished loading before the script ran had no `load` event left to
hear, so it was never measured. Roughly one load in eight.

The fix is structural rather than a guard added to a symptom. The arithmetic
now lives in `contentHeight`, which is handed the boxes and cannot see the frame,
so it cannot echo it. The DOM reading that feeds it is the only part that touches
the document. The fallback is assigned before the listener, and a frame already
holding its simulation is measured on the next tick.

The lesson worth carrying: this was written down correctly in the ADR and
implemented wrongly anyway, because nothing tested the measurement. Nine tests
now cover the geometry, all confirmed to fail when the property they guard is
removed, and the frame's height was checked against its content across four
viewport widths and three simulations in a browser.

## Why no height-reporting script, reconsidered twice

The obvious way to size a frame is to ask the child: the simulation posts its
height to the parent, which sets the frame to match. That was rejected on the
grounds that the tool which writes the simulations instructs them not to speak to
a parent at all, so a reporting script would contradict its contract.

That reason does not hold. `STANDALONE-OVERRIDES.md` describes what these pages
assume — no state channel, no score channel — and its owner is free to change it.
A line added to a template that already tells generated pages to use a
`ResizeObserver` is cheap, and the tool can be regenerated at will. Cost was
never the deciding factor here.

The decision survives anyway, on a measurement rather than a rule.

A reporting child has to choose what to send, and the obvious choice sends the
fault this project just spent a commit fixing. Reading a simulation's document
height while the frame is resized, by setting the frame to 200, 400, 821, 1116
and 1500px and reading `documentElement.scrollHeight` each time:

| frame set to | `documentElement.scrollHeight` | `body.scrollHeight` |
|---|---|---|
| 200px | 821 | 821 |
| 400px | 821 | 821 |
| 821px | 821 | 821 |
| 1116px | **1114** | 821 |
| 1500px | **1498** | 821 |

A document stretched to a container larger than its content reports the
container's height, so `documentElement.scrollHeight` tracks the frame upward
and a parent that trusted it would grow the frame a little further on every
measurement — 1116, then 1114, converging on the window. That is the same
feedback loop that made the frame report 1116px for 821px of content.

`body.scrollHeight` is stable at the content height in every row, so a script
*could* report it and be correct. But note what that reports: the height of the
body. Element bounds measure the same thing, from the parent, with no protocol,
no message, and nothing that can be forgotten. The measurement has to know the
frame's own height anyway to add back how far the simulation has been scrolled,
so it already reads the document — the reporting version reads more of it and
arrives at the same number.

So the deciding factor is not the tool's rule and not the cost. It is that the
child has nothing to report that the parent cannot already measure, and the
obvious thing for it to report is wrong.

The real limit of the current approach is stated rather than assumed: element
bounds do not describe painted pixels, so content drawn outside its box — a
canvas, a fixed full-screen panel — is invisible to it. Measured across the
batch, no simulation is affected. The 8 that use a canvas all size it from its
container, and the one full-screen fixed overlay sits exactly at the content
height, so excluding it changes nothing today. That is a property of these 23
files, not a guarantee, and it is the one case where a reporting script would
genuinely win: a child that could measure its own painted area has information
the parent cannot reach.

## Isolation, measured rather than assumed

A frame's styles are isolated from the host page: measured in a browser, a
simulation injecting `body{background:red !important} h1{font-size:99px !important}`
left the site's own heading and navigation untouched. Its script is not, as long
as the frame is same-origin: a simulation can reach `parent.document`, and one
was made to change the page heading and background to prove it.

Closing that needs a `sandbox` without `allow-same-origin`. That was tried and
rejected on measurement, not on principle. With `sandbox="allow-scripts"` the
simulation runs perfectly — the 3D simulation was driven interactively — but the
parent can no longer read the child document, so the height measurement cannot
run and the frame stays at a fixed tall height with an inner scrollbar. That
trades the ticket's first criterion for the tenth.

The sandbox is therefore off, and the reasoning is about trust rather than
about security: the simulations are self-contained files delivered by a tool this
project controls, they carry no network calls, and the worst case of a
misbehaving one is an ugly frame noticed in review. Framing already bounds the
blast radius against CSS. If the simulations ever come from somewhere untrusted,
this decision should be revisited, and the cost of revisiting it is a height that
cannot be measured — which is the real price of this choice, recorded so it is
not discovered later.

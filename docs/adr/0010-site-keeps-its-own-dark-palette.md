# The site keeps its own dark palette

Supersedes `0009` for the palette, and is itself superseded by `0015` for the palette. Its layout choices are superseded by `0016`: the list of rows on the home page and the plain navigation. The lab bench opening, with the framed simulation, still holds.

## Decision

The chrome uses its own dark palette, not the simulations'. The palette is a green-black surface with warm off-white text and one amber accent. The home page is laid out as a lab bench: a live simulation is framed as an object on it, so the frame's edge is visible on purpose.

The palette stays dark. The simulations are hardcoded dark (all 23 ship only a dark `:root` that is in use), so a light chrome would frame a dark object on a light page.

## Why the old rule goes

ADR 0009 kept the chrome in the simulations' palette so an embedded simulation would read as part of the page and not as a rectangle. That rule is dropped because the new home page is built around the framed simulation. A visible edge there is the point of the layout, and the old seam test would fail it.

The old test that checked the chrome against each simulation's `:root` is removed with the rule. A simulation file that is broken still gets fixed in place (ADR 0005); the palette no longer has to match it.

## What still holds

- Every text role meets 4.5:1 on both surfaces. `test/theme.test.ts` checks this from `TOKENS`.
- The accent is a non-text colour. It is 9.7:1 on the page, but it is used only for the featured rule, borders and the focus outline, not for running text. Keep it that way.
- Tokens are written as literal values in one place, so a change to the palette is one edit and one test run.

## Consequences

- Every page changes colour at once. The printable sheet keeps its own print values, as before.
- Simulation files are not touched.
- A simulation in the frame keeps its navy background. The frame's border (`--border-strong`) is what separates them.

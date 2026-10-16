# Standalone overrides (win over templates/ and VISUAL-STYLE.md)

The templates were written for a presentation platform that drove widgets
via postMessage and collected observation nodes. This skill produces
standalone pages with no parent. This file wins wherever they disagree:

- This file outranks both `templates/` and `VISUAL-STYLE.md`. The precedence
  chain is `templates/` -> `VISUAL-STYLE.md` -> this file. Style guidance here
  would override tokens; platform-stripping and safety rules here override both.

- IGNORE every `postMessage` listener requirement (`SET_WIDGET_STATE`,
  `HIGHLIGHT_ELEMENT`, `ANNOTATE_ELEMENT`, `REVEAL_ELEMENT`). Do not register
  one; do not call `window.parent.postMessage`. There is no parent and no
  score channel.
- IGNORE every `id="experiment"` / `data-maic-observation` / `publishState()`
  requirement (the `interactive-observation` snippet). Do not emit it.
- KEEP the ID/naming conventions anyway (sliders as `{var}-slider`,
  `node-{id}`, `#step-N-control`, `#feedback-panel`, zoom/reset IDs).
  They are your own stable selectors now.
- KEEP everything else: reset-must-restore-all-state, mobile no-overlap,
  button state machines, fair-start for games, lighting/zoom for 3D,
  Pyodide stdout pattern for Python, diagram edge maths, procedural
  judgment/consequence/proxy/gating rules, and every Quality Checklist.
- No byte budgets or host validators are enforced here, but keep pages
  compact and self-contained (inline CSS/JS, system fonts).


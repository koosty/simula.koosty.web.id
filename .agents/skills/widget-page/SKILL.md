---
name: widget-page
description: Generate a standalone interactive HTML learning widget (simulation, diagram, code playground, game, 3D visualization, procedural practice). Use when turning a concept into one self-contained HTML page the learner does, not just reads.
metadata:
  opencode/autoinvoke: "false"
---

# Widget Page (standalone)

Output exactly ONE complete HTML document. No markdown fences, no explanations, no duplicate `<!DOCTYPE html>`.

## Page contract (every page, all types)

Correctness first, SEO as a side effect. Every generated document opens with
this skeleton. The `lang` attribute is NOT optional and NOT the visual
language — it is the BCP-47 code for the course's teaching language (e.g. `en`,
`zh-CN`, `pt-BR`), taken from the course `lang` field. Never guess it and
never leave it as `en` by default; if `lang` is unknown, ask for it.

```html
<!DOCTYPE html>
<html lang="{courseLang}">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{sceneTitle} · {courseTitle}</title>
  <meta name="description" content="{sceneDescription, trimmed to ~155 chars}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{sceneTitle}">
  <meta property="og:description" content="{sceneDescription, trimmed to ~200 chars}">
  <meta property="og:locale" content="{courseLang with hyphens, e.g. pt-BR}">
  <!-- No canonical, no Twitter card: there is no known public URL. Add
       <link rel="canonical"> and og:url only when one exists. -->
</head>
```

Rules:
- All text inside these tags is written in the teaching language. A page in
  Spanish does not get an English `<title>`.
- `title` carries the scene title and course title — never a literal like
  "3D Visualization" or "Simulation Widget". Never leave `Untitled`.
- Exactly **one `<h1>`** per page, and it is the scene title. Everything below
  it is `<h2>`/`<h3>`. A page with zero or multiple `<h1>`s fails.
- Full-bleed layouts (`visualization3d`) may hide the `<h1>` visually rather
  than drop it, when the visible area is the canvas.
- Do not add a favicon, an external stylesheet, or any other `<link>`.

## Workflow

1. Pick the template by `type` (default `simulation`):
   - reading -> `templates/reading-system.md` + `templates/reading-user.md` + `templates/reading-template.html`
   - diagram -> `templates/diagram-system.md` + `templates/diagram-user.md`
   - code -> `templates/code-system.md` + `templates/code-user.md`
   - game -> `templates/game-system.md` + `templates/game-user.md`
   - visualization3d -> `templates/visualization3d-system.md` + `templates/visualization3d-user.md`
   - procedural-skill -> `templates/procedural-skill-system.md` + `templates/procedural-skill-user.md`
2. Read every file listed for that type (`reading` has three; the rest have two). They are the spec — every rule in them applies (element naming, reset logic, mobile layout, quality checklists) unless `VISUAL-STYLE.md` or `STANDALONE-OVERRIDES.md` contradicts it.
3. Fill the `{{variables}}` in the user file from the inputs below. Never leave a `{{placeholder}}` standing. Missing value -> sensible default, never empty markup.
4. Apply `VISUAL-STYLE.md` — shared tokens and component classes. Any literal colour, spacing, or radius in a template's example CSS is superseded by the token; use `var(--token)`.
5. Apply `STANDALONE-OVERRIDES.md` last. It wins over both.
6. Run the template's own Quality Checklist AND the one in `VISUAL-STYLE.md` before returning.

Precedence: `templates/` -> `VISUAL-STYLE.md` -> `STANDALONE-OVERRIDES.md`.

## Inputs

Common: `title, description, keyPoints[], language, type`, plus course-level
`courseTitle` and `lang` (BCP-47, required for the page contract).
Optional, from research-grounded courses: `sources[]` — resolved
`{title, publisher, date, url}` objects. When present, render a `.sources`
footer (see `VISUAL-STYLE.md`) and never state a sourced claim in the body
without attributing it there.
Per type (all optional, default sensibly):
- reading: none beyond the common inputs — the markdown body is written
  from `title`/`description`/`keyPoints`, not a separate config object.
- simulation: `concept, conceptOverview, designIdea, keyVariables[]`
- diagram: `diagramType, nodes[], nodeCount`
- code: `language, starterCode, testCases[], hints[]`
- game: `gameType, scoring`
- visualization3d: `visualizationType, objects[], interactions[]`
- procedural-skill: `procedureType, task, tools[], steps[], successCriteria[], errorConsequences[]`

## Rules that always hold (detail lives in the templates)

- Element/ID conventions: keep them (`{var}-slider`, `{action}-btn`, `node-{id}`, `#step-N-control`, `#feedback-panel`, zoom/reset IDs...). They are your stable JS hooks now, not platform hooks.
- Reset: visible control calling a central `resetState()` (or equivalent) that restores ALL state, progress, feedback, and criteria, and cancels every pending timer and animation frame. Never a text-only reset.
- Mobile: fluid layout, panel never covers canvas at 320px, min 44px targets. At 375px every canvas element and label is fully visible. No fixed minimum size may be wider than the available space.
- Animation via `requestAnimationFrame`; resize via `ResizeObserver`/resize handler; keyboard (Space/R) where applicable.
- No inline event handlers (`onclick=` and similar). Wire every control with `addEventListener` inside the script. Inline handlers cannot reach functions inside a closure and fail silently.
- Hidden values stay hidden. Before the student submits, no answer may appear in text, labels, bar or arc lengths, table fills, or readouts. Use `?` placeholders until then.
- Each page states its answer policy: one try (show the answer after a wrong try) or retry (show a hint only, never the answer). A wrong try never locks the input unless the page says so.
- Answer checking is an exact match after strict parsing. Reject partial input such as `7abc`. Accept the Indonesian decimal comma and dot thousands separators. Use no tolerance wider than the rounding of the displayed value.
- Widget config is generated from the same constants as the controls (slider min, max, and defaults). Presets set only declared variables. Declare an achievement only when the script awards it.
- Keyboard: global single-key shortcuts (Space, R) ignore keys pressed with Ctrl, Meta, or Alt, and do not fire while focus is in a text input. Never intercept Enter or Space on a focused button. Keyboard shortcuts inside a code editor, such as Ctrl+Enter to run, are allowed.
- Canvas: CSS `var(--token)` is not valid in `ctx.font`, `fillStyle`, or `strokeStyle`. Resolve token values with `getComputedStyle` first.
- Reserve canvas space for long or rotated labels, so no label is clipped at any width.
- Animations use elapsed time (a `performance.now()` delta), not per-frame counters.
- Embedded `<script type="application/json" id="widget-config">` per the type's schema (see `SCHEMAS.md`).
- Visual style is NOT per-page: paste the token block and component classes from `VISUAL-STYLE.md` verbatim and use them everywhere. Layout varies per scene; palette, spacing, type, radius, motion, and control rendering do not.
- External loads only from `unpkg.com` and `cdnjs.cloudflare.com`. Each script pins an exact version in its URL and carries `integrity="sha384-…"` and `crossorigin="anonymous"` (docs/adr/0021). Fonts come from the site's `/fonts/` with system fallbacks. No fetch/XHR/WebSocket, no iframe/object/embed/form.
- `type: "reading"` is a distinct output shape: two files per scene
  (`scenes/<id>.md` + `scenes/<id>.html`), no `widgetConfig`, no reset, no
  `{var}-slider` conventions. See `templates/reading-system.md`.
- Sourced claims: when `sources` is non-empty, every externally-sourced fact in the body text is attributed, and a `.sources` footer lists each source's title/publisher/date as a linked citation (component class in `VISUAL-STYLE.md`).

## Attribution

Templates are ported from OpenMAIC (MIT, (c) 2026 THU-MAIC). `LICENSE.OpenMAIC` applies. See `ATTRIBUTION.md`.

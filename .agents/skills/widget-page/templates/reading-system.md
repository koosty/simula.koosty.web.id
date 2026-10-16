# Reading Scene Generator

A `reading` scene is prose, not a widget — no state machine, no reset, no
`<script type="application/json" id="widget-config">`. The learner reads;
the only interactivity is native disclosure (`<details>`) and glossary
tooltips (`title` attribute). This file governs both output files for the
scene.

## Output: two files

1. `scenes/<id>.md` — the full markdown body, written from scratch. Expand
   the scene's `title`/`description`/`keyPoints` into real prose: multiple
   `##`/`###` sections, not a restatement of the bullet list. Use:
   - Headings (`##`, `###` — never `#`, that's reserved for the page's
     single `<h1>`).
   - Fenced code blocks with a language tag (` ```python `) for any
     snippet — triggers highlight.js on render. Illustrative only, never
     runnable (that's the `code` widget type's job).
   - `$inline math$` and `$$ display math $$` (KaTeX delimiters) for any
     equation. Never approximate math with Unicode superscripts.
   - A raw `<details><summary>Label</summary>...</details>` block for any
     optional/supplementary digression the learner can skip — markdown
     passes raw HTML through untouched.
   - A raw `<span class="glossary-term" title="plain-language definition">term</span>`
     the first time a technical term appears, so a hover/long-press shows
     its definition without leaving the page.
   - Normal markdown lists, tables, blockquotes, bold/italic as needed.
2. `scenes/<id>.html` — copy `templates/reading-template.html` verbatim,
   then fill only:
   - The page-contract head fields (`lang`, `<title>`, meta description ×2,
     og:title, og:locale) per `../SKILL.md`.
   - Paste the full token block + component classes from `VISUAL-STYLE.md`
     into the `<style>` block, in place of the first comment placeholder.
   - Fetch `https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css`
     (e.g. with `read`) and paste its exact text into the `<style>` block,
     in place of the second comment placeholder. **Never a `<link>` or
     `@import` for it, and never retype it from memory** — cross-origin
     stylesheets don't reliably apply to a `file://` document (confirmed:
     the request succeeds but the rules never reach the CSSOM), so KaTeX's
     screen-reader-only MathML fallback stays visible and duplicates every
     equation next to the real rendering. Inlining the literal text avoids
     the cross-origin stylesheet entirely.
   - `#reading-source`'s text content: the **exact same markdown text**
     just written to `scenes/<id>.md`, character for character. These two
     files must never drift — regenerate both together, never patch one.
   - The `.sources` section: emit it only if `sources` is non-empty, one
     `.source-item` per resolved `{title, publisher, date, url}` object;
     omit the whole `<section class="sources">` block otherwise (no empty
     footer).

## Sourced claims

When `sources` is provided, every claim in the markdown body that comes
from one of them must be attributed inline (e.g. "according to the UN
Population Division..." or a trailing parenthetical), not just listed in
the footer with no connection to the text. Never state a sourced fact as
if it were common knowledge.

## What this type does NOT have

No `widgetType`, no `widgetConfig`, no reset control, no
`requestAnimationFrame`/`ResizeObserver`, no keyboard shortcuts, no
`{var}-slider`/`{action}-btn` element-naming requirements — those exist for
widgets with real state. A reading scene's only "state" is which
`<details>` elements are open, which the browser already handles with no
JS of yours.

## Output format

Return both files clearly separated and labelled (e.g. `--- scenes/<id>.md ---`
then its content, then `--- scenes/<id>.html ---` then its content) so the
orchestrator can write each to its own path. No markdown fences wrapping
either file's own content.

## Quality Checklist

- [ ] KaTeX's CSS is pasted as literal text inside the page's own
      `<style>` block — no `<link>`/`@import` pointing at it.
- [ ] `scenes/<id>.md` and the `#reading-source` block in `scenes/<id>.html`
      are byte-for-byte identical.
- [ ] Exactly one `<!DOCTYPE html>`, no fences, no `{{placeholder}}` left.
- [ ] No `#` (h1) inside the markdown body — the page's own `<h1>` is the
      scene title, markdown starts at `##`.
- [ ] Every fenced code block has a language tag.
- [ ] Every `$...$`/`$$...$$` pair is balanced and renders (no stray `$`
      in prose that isn't meant as math).
- [ ] `.sources` section present iff `sources` is non-empty; every sourced
      claim in the body is attributed, not just footnoted.
- [ ] Token block + component classes from `VISUAL-STYLE.md` pasted
      verbatim; no hardcoded colours outside the hljs token-colour rules
      already defined there.
- [ ] Page contract satisfied: correct `lang`, non-placeholder `<title>`,
      meta description, OG tags, exactly one `<h1>`.

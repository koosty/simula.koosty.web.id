Write a reading scene for: {{title}}

## Description
{{description}}

## Key Points
{{keyPoints}}

{{#if hasSources}}
## Sources (attribute these claims, don't just footnote them)
{{sources}}
{{/if}}

## Language
{{languageDirective}}

---

Produce two files per `reading-system.md`:

1. `scenes/{{sceneId}}.md` — full markdown prose expanding the description
   and key points into real sections, headings, and (where the subject
   calls for it) code blocks, math, a `<details>` aside, or a
   `<span class="glossary-term">` definition.
2. `scenes/{{sceneId}}.html` — `templates/reading-template.html` copied
   verbatim, with the page-contract head fields, the full `VISUAL-STYLE.md`
   token/component CSS, and the `#reading-source` block (identical text to
   file 1) filled in.

Use the shared token block and component classes from `VISUAL-STYLE.md`
verbatim — no bespoke colours, spacing, or button styles.

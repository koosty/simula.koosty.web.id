---
name: course-outline
description: Plan a course from a free-text requirement into a reviewed outline.yaml. Use when starting any new course before generating pages.
---

# Course Outline

Turn `$ARGUMENTS` (a learning requirement, or `courses/<slug>/requirement.md`) into a reviewed outline. Stop after planning. Never generate pages in this skill.

Courses live in `courses/<slug>/` in this repository. That folder is not tracked by Git (docs/adr/0026). The next step after approval is the `course-generate` skill, run on `courses/<slug>/outline.yaml`.

## Workflow

1. Resolve the requirement text: use `$ARGUMENTS` if given, else read `courses/<slug>/requirement.md`. If neither exists, ask for it.
2. Ask clarifying questions BEFORE writing anything: audience, depth, teaching language, Standard vs Hands-on mix. Include the exact BCP-47 `lang` code among the questions. Do not guess when the answers change the plan.
3. **Research**, only when the requirement depends on facts that could change or need checking (current events, prices, statistics, a named recent study). Skip entirely for ordinary curriculum content.
   - Budget: at most 8 web searches and 6 fetched sources for the whole course.
   - Split the requirement into 2 to 4 searchable facets first.
   - Build a claim ledger: every factual claim, the source that backs it, and that source's publisher and date.
   - When two sources disagree, record the conflict and prefer the primary or most recent source. Never silently merge.
   - Write `courses/<slug>/research.md` with a `## Facets` list, a `## Sources` table (`id | title | publisher | date | url`), and a `## Claim ledger` table (`claim | sourceId | note`).
   - Carry the Sources table into `outline.yaml` as `researchSources`.
4. Create `courses/<slug>/` with:
   - `requirement.md`: the frozen input, never rewritten afterwards.
   - `outline.yaml`: the shape below, no fences, no prose around it.
5. Present the outline summary (titles, kinds, widget types) and WAIT. The human edits `title` and `order` in the conversation. This skill ends here. Generation runs only when the human asks for it, with `course-generate courses/<slug>/outline.yaml`.

## outline.yaml shape

```yaml
# <course title>: working outline.
# Edit freely until you are happy, then tell the assistant to generate.

courseTitle: "<=30 chars, in the teaching language>"

# BCP-47 code for the teaching language, e.g. id | en | zh-CN.
# Drives the page's <html lang>, so it must match languageDirective.
lang: id

# Required for every Tingkat course (sd, smp, sma). Publish reads grade from
# here. Subject and stage come from the course folder name
# (<mapel>-<sd|smp|sma>-kelas-<romawi>), or from --subject and --stage.
# A spesialisasi course has no grade: omit this line (docs/adr/0027).
grade: 7

languageDirective: >-
  <2-5 sentence teaching-language instruction>

# Present only when step 3 ran research. Omit the whole key otherwise.
researchSources:
  - id: s1
    title: "..."
    publisher: "..."
    date: "2026-09-01"
    url: "https://..."

scenes:
  - id: s1
    kind: reading            # reading | widget | quiz
    title: "..."
    description: >-
      1-2 sentences
    keyPoints:
      - "..."
    # Ids from researchSources that back claims in this scene.
    # Omit entirely when the scene makes no sourced claims.
    sources:
      - s1
    widgetType: simulation    # simulation|diagram|code|game|visualization3d|procedural-skill
    widgetConfig: {}
    status: queued            # queued | generating | ready
```

## YAML authoring style

The human edits this file by hand, so it must stay scannable.

- Block style only for mappings and lists. No flow style (`[a, b]`, `{k: v}`). Exception: `widgetConfig: {}` for an empty config.
- No anchors, aliases, multi-document files, or merge keys.
- Use `>-` folded scalars for long prose (`description`, `languageDirective`).
- Quote any value that could be read as another type: `yes`, `no`, `on`, `off`, `true`, `false`, and numbers stored as text.
- Comments are welcome, especially at the top and around `scenes`.
- Key order per scene: `id`, `kind`, `title`, `description`, `keyPoints`, `sources`, `widgetType`, `widgetConfig`, `status`.

## Rules

- `widget` scenes MUST carry `widgetType` and `widgetConfig`. A sparse config is fine; defaults are filled later.
- Standard mix: at most 1 to 2 widgets per course.
- Hands-on mix: about 70% widgets (at least 2 simulation and 1 game), no quiz.
- Omit fields you do not know rather than inventing them. Never leave a `{{placeholder}}`.
- A scene's `sources` may reference only ids present in `researchSources`. Never add `researchSources` or `sources` to an ordinary course that skipped step 3.
- Scene ids must stay unique within a course. Publish treats a scene id as one simulation within its subject (docs/adr/0012).
- `status` is set to `ready` only by `course-generate`, after the page is written.
- Tingkat is one of `sd`, `smp`, `sma`, and nothing else. A subject that does not belong to a class (for example informatika as an elective) is a spesialisasi course: name the folder `<mapel>-spesialisasi`, omit `grade`, and expect the page at `/spesialisasi/<mapel>/<slug>/` (docs/adr/0027).

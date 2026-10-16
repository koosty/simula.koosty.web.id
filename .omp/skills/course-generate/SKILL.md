---
name: course-generate
description: Generate all queued scenes of an approved course by dispatching each scene to the widget-page skill. Use after the outline is approved.
metadata:
  opencode/slash: "true"
---

# Course Generate

Execute `@courses/<slug>/outline.yaml` (or the path in `$ARGUMENTS`) into scene body files under `scenes/` — `<id>.html` for every scene, plus `<id>.md` for `kind: reading` scenes — one scene at a time. This skill orchestrates — the page itself is always built by the `widget-page` skill under the hood.

## Workflow

1. Read `@courses/<slug>/outline.yaml` (or the path in `$ARGUMENTS`).
2. **Validate before doing anything. Refuse on any failure and name every problem found — do not stop at the first one.**
   - `approved` MUST parse as exactly boolean `true`. Missing, a quoted string like `"yes"` or `"true"`, a typo key such as `apprved`, or any other value REFUSES. Refusal message: "outline not approved — set `approved: true` (exact boolean) in `<path>`". Do not infer approval from the value looking truthy.
   - `kind` ∈ `reading | widget | quiz`; `status` ∈ `queued | generating | ready`; `widgetType` ∈ `simulation | diagram | code | game | visualization3d | procedural-skill`.
   - Every `kind: widget` scene carries both `widgetType` (non-empty) and `widgetConfig`. `kind: quiz` has no `widget-page` template yet (known gap) — flag every `quiz` scene now rather than failing mid-run.
   - Scene `id`s are unique and non-empty.
   - If `researchSources` is present, each entry needs `id`, `title`, `url` (unique `id`s). Every scene's `sources` list, if present, MUST reference an `id` that exists in `researchSources` — refuse and name any dangling id.
   - `lang` is present and a plausible BCP-47 tag (e.g. `en`, `zh-CN`, `pt-BR`). It becomes the page's `<html lang>`, so a missing or wrong value mislabels every scene's accessibility. Refuse rather than defaulting to `en`.
   - If the file is not valid YAML, or is a legacy `outline.json`, refuse and say so. There is no JSON fallback.
3. Report resume state: count scenes by reading the file, then report how many are `ready` out of the total. Skip every scene with `status: ready` whose body file(s) exist and are non-empty — `<id>.html` for every scene, and also `<id>.md` for `kind: reading` scenes; either missing or empty means not actually ready. Do not use `grep` — an unmatched pattern silently reports 0.
4. In outline order, for each `queued` (or stale `generating`, reset to `queued`) scene:
   - `skill({ name: "widget-page" })` with that scene's `title/description/keyPoints` + course `languageDirective` + course `courseTitle` and `lang`, plus a `type` computed as: `widgetType` for `kind: widget` scenes, `"reading"` for `kind: reading` scenes (quiz has no widget-page template yet — skip and record the error). For `kind: widget` scenes also pass `widgetConfig`. If the scene carries `sources`, resolve each `id` against `researchSources` and pass the resolved `{title, publisher, date, url}` objects as `sources` too.
   - Self-check before writing: exactly one `<!DOCTYPE html>`, no fences, no `{{placeholder}}`, reset restores all state, panel never covers canvas at 320px, every canvas element and label is fully visible at 375px, min 44px targets, only allowed CDN hosts, the page uses the shared token block + component classes from `widget-page/VISUAL-STYLE.md` with no hardcoded colours, and the page contract in `widget-page/SKILL.md` is satisfied (correct `lang`, non-placeholder `<title>`, one `<h1>`, no canonical/Twitter tags).
   - Browser gate (required before `ready`, widget scenes): open the page in a headless browser and confirm zero console errors, no visible `NaN`, `undefined`, or `[object` text, and valid `widget-config` JSON. Run every quiz question with one wrong and one right answer, and check that each control and the reset button work. Failure: leave the scene `queued` and record the error.
   - If the scene had `sources`, the page attributes those claims in body text and renders a `.sources` footer per `widget-page/VISUAL-STYLE.md` — never a sourced claim left unattributed.
   - **For `kind: widget` scenes only**, the page's `<script type="application/json" id="widget-config">` stays JSON even though the outline is YAML. Convert the scene's `widgetConfig` when inlining: emit valid JSON, keep `type` exactly as specified in `SCHEMAS.md` (notably `procedural-skill` is hyphenated), and strip YAML-isms — no unquoted `yes`/`no`/`on`/`off`, no block scalars, no anchors. Quote any string that could otherwise change type.
   - Write `courses/<slug>/scenes/<id>.html` ONLY on a clean page. **For `kind: reading` scenes**, also write `courses/<slug>/scenes/<id>.md` with the exact same markdown text embedded in the HTML's `#reading-source` block — both files or neither. Then flip that scene to `ready` in `outline.yaml`. Never mark ready without the file(s) on disk.
   - When editing `outline.yaml` after generating, preserve the block style, key order, comments, and `>-` scalars defined in `course-outline/SKILL.md`. Change only the `status` value.
   - On failure: leave the scene `queued`, record the error next to it, continue with the next scene.
5. Finish with a per-scene report (ready / still queued + why). Never run two scenes concurrently against the same provider key.

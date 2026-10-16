Create a procedural skill widget for: {{title}}

## Procedure Type

{{procedureType}}

## Task

{{task}}

## Scene Description

{{description}}

## Key Points

{{keyPoints}}

## Tools or Materials

{{tools}}

## Ordered Steps

{{steps}}

## Success Criteria

{{successCriteria}}

## Error Consequences

{{errorConsequences}}

## Language

{{languageDirective}}

---

Generate a complete, self-contained HTML procedural skill widget with these mandatory features:

1. Embedded JSON config in `<script type="application/json" id="widget-config">`.
2. `widget-config.type` exactly equal to `"procedural-skill"`.
3. A visible task area, tools/materials area, ordered step area, `#feedback-panel`, optional `#state-panel`, progress display, success criteria area, and reset button.
4. Visible, enabled, clickable learner controls for actions. `#step-1-control` must be visible and clickable, must contain visible text or control content, and must not be an empty div.
5. At least one learner action must visibly update progress or feedback.
6. `#feedback-panel` must exist even if `#state-panel` also exists; `#state-panel` cannot replace `#feedback-panel`.
7. At least one non-Done interaction: a choice, input, measurement, judgment, or tool-use decision.
8. At least one lightweight operation proxy: measurement reading, threshold range, meter/gauge/indicator, tool-use state, inspection result, or safety status signal.
9. At least one consequence feedback path for an unsafe or incorrect choice, such as risk detected, inspection blocked, requires recheck, warning/alarm, or cannot proceed until resolved.
10. Success criteria must not appear completed until their actual conditions are satisfied; do not show "All checks completed" as complete when only 1 of N steps is complete.
11. A visible, enabled, clickable reset button that restores all learner state: progress, feedback, state/status, step classes, success criteria, proxy values, and initial enabled/disabled controls.
12. Reset must use a central `resetState()` or equivalent full reset path, not a visual-only text change.
13. No `postMessage` listener is emitted and no `window.parent.postMessage` call is made; standalone pages have no parent and no score channel.
14. Generated JavaScript must guard DOM access before writing to elements; never set `disabled`, `textContent`, `className`, or `style` on null elements.
15. Responsive, self-contained HTML with inline CSS and JavaScript only.
16. Vary the composition to fit this scene, but use the shared token block and component classes from `VISUAL-STYLE.md` verbatim. A step-card board, work-order desk, safety inspection station, measurement station, process kanban, control board, GO/STOP decision station, handoff checklist board, or troubleshooting station are all valid arrangements — none of them get their own palette.
17. Preserve task operation, decision, feedback, progress, reset, completion checking, and stable selectors.

Return only the full HTML document. Do not include Markdown fences or explanatory text.

Create an interactive diagram for: {{title}}

## Diagram Type
{{diagramType}}

## Description
{{description}}

## Key Points
{{keyPoints}}

{{#if hasNodeCount}}
## Node Count Constraint

- Maximum node count: {{nodeCount}}
- When no prescribed node list is provided, the `widget-config.nodes` array MUST NOT contain more nodes than this limit.
- When prescribed nodes are provided, that list is authoritative.
{{/if}}

{{#if hasPrescribedNodes}}
## Prescribed Nodes

{{prescribedNodes}}

- Use every prescribed node exactly once.
- Preserve each node's `id`, `label`, `icon`, and `details` when present.
- Do not add, remove, or replace prescribed nodes.
- Derive hierarchy edges from `parentId` when it is present.
{{/if}}

## Language
{{languageDirective}}

---

Generate a complete HTML diagram with:

1. **SVG nodes** with icons, labels, and click-to-show details
2. **Edges with arrows** connecting nodes (calculate endpoints from node dimensions)
3. **Step-by-step reveal** (下一步/上一步)
4. **High contrast**: White nodes on dark background, light edge labels
5. **Mobile-friendly**: Collapsible sidebar, doesn't block diagram
6. **First node visible** on load

Embed config in `<script type="application/json" id="widget-config">`.

Use the shared token block and component classes from `VISUAL-STYLE.md` verbatim — no bespoke colours, spacing, or button styles. Node and edge colours come from the token palette.

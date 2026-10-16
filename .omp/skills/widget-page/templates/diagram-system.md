# Interactive Diagram Generator

Generate a self-contained HTML diagram with connected nodes.

## Data Schema

```json
{
  "nodes": [
    { "id": "n1", "label": "Label", "icon": "🎯", "details": "Description" }
  ],
  "edges": [
    { "from": "n1", "to": "n2", "label": "next" }
  ],
  "revealOrder": ["n1", "n2"]
}
```

## Core Requirements

1. **SVG-based** with embedded JSON config
2. **First node visible** on load
3. **High contrast**: White nodes on dark background, light edge labels
4. **Edges connect to node edges** (account for node dimensions and arrow offset)
5. **Mobile**: Sidebar/panel collapsible, doesn't block diagram
6. **No jitter**: Never apply a CSS `transform` to an element that already carries an SVG `transform` attribute
7. **All nodes connected**: No orphan nodes

## Node Structure

Positioning and animation MUST live on separate elements.

```html
<!-- Outer <g>: position only. Never target this element with a CSS transform. -->
<g id="node-n1" class="node" transform="translate(320, 180)">
  <!-- Inner <g>: every hover/active animation goes here. -->
  <g class="node-body">
    <rect x="-90" y="-35" width="180" height="70" rx="12"></rect>
    <text text-anchor="middle" dy="6">Label</text>
  </g>
</g>
```

```css
/* Correct: animates the inner group, so the node keeps its position. */
.node:hover .node-body { transform: translateY(-4px); }
.node:active .node-body { transform: scale(0.98); }

/* WRONG: wipes out translate(320, 180) and snaps the node to the origin. */
.node:hover { transform: translateY(-4px); }
```

The `<rect>` is centred on the group origin, so each node's `translate()` is its
centre — which is what the edge maths below expects for `from.x`/`from.y`.

## Edge Connection Code

```javascript
const NODE_WIDTH = 180, NODE_HEIGHT = 70, ARROW_OFFSET = 10;

function getEdgePoints(from, to) {
    const dx = to.x - from.x, dy = to.y - from.y;
    let sx, sy, ex, ey;

    if (Math.abs(dy) > Math.abs(dx)) { // Vertical
        sx = from.x;
        sy = dy > 0 ? from.y + NODE_HEIGHT/2 : from.y - NODE_HEIGHT/2;
        ex = to.x;
        ey = dy > 0 ? to.y - NODE_HEIGHT/2 - ARROW_OFFSET : to.y + NODE_HEIGHT/2 + ARROW_OFFSET;
    } else { // Horizontal
        sx = dx > 0 ? from.x + NODE_WIDTH/2 : from.x - NODE_WIDTH/2;
        sy = from.y;
        ex = dx > 0 ? to.x - NODE_WIDTH/2 - ARROW_OFFSET : to.x + NODE_WIDTH/2 + ARROW_OFFSET;
        ey = to.y;
    }
    return `M ${sx} ${sy} L ${ex} ${ey}`;
}
```

## postMessage Listener - REMOVED for standalone

Upstream, the platform drove this widget over `postMessage`
(`SET_WIDGET_STATE`, `HIGHLIGHT_ELEMENT`, `ANNOTATE_ELEMENT`, `REVEAL_ELEMENT`)
and collected observation nodes. A standalone page has no parent and no score
channel, so this listener is **not emitted** and `publishState()` /
`id="experiment"` / `data-maic-observation` are not used. See
`STANDALONE-OVERRIDES.md`, which forbids all of it.

The ID conventions those platform actions relied on are still load-bearing as
your own JS selectors (`{var}-slider`, `{action}-btn`, `node-{id}`,
`#step-N-control`, `#feedback-panel`, zoom/reset IDs) - keep them, and style
them with the component classes from `VISUAL-STYLE.md`.

### Element Naming Convention

So highlight/annotate/reveal can target nodes, give each node a stable id:
- Node groups: `id="node-{id}"` (e.g., `id="node-n1"`), matching the JSON `id`.
- Edge labels: `id="edge-{from}-{to}"` if they need to be targeted.

## Output

Return exactly ONE complete HTML document. No markdown fences, no duplication.

**Head:** use the page contract in `../SKILL.md` — correct `<html lang>`, a real `<title>`, meta description, OG tags, and exactly one `<h1>` carrying the scene title.

Do NOT emit a `postMessage` listener, `window.parent.postMessage`, `publishState()`,
`id="experiment"`, or `data-maic-observation`. See `STANDALONE-OVERRIDES.md`.

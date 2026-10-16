Create a 3D visualization widget for: {{title}}

## Visualization Type

{{visualizationType}}

## Description

{{description}}

## Key Points

{{keyPoints}}

## Objects to Visualize

{{objects}}

## Interactions

{{interactions}}

## Language

{{languageDirective}}

---

Generate a complete, interactive 3D visualization using Three.js with these MANDATORY features:

### Scene Setup
1. **Three.js from CDN** using importmap for ES modules
2. **Proper lighting** (ambient + directional/point lights)
3. **OrbitControls** for camera manipulation
4. **Responsive canvas** that fills the container

### Objects
1. Create 3D objects based on the visualization type
2. Use appropriate materials (Phong, Standard, Emissive)
3. Add meaningful colors and textures
4. Store objects in an `objects` dictionary for widget actions

### Interactions
1. **Sliders** for controlling parameters (speed, scale, etc.)
2. **Buttons** for presets and reset
3. **Info panel** showing current state
4. **Touch-friendly** controls (44px minimum)

### Animation
1. Use `requestAnimationFrame` for smooth animations
2. Support pause/play controls
3. Respect `animationSpeed` variable

### Camera and Object Control
1. Expose plain JS functions (e.g. `window.setSceneState(key, value)`) for camera position, target, and object properties.
2. Presets and the reset button drive those functions through the same code path.
3. No `postMessage` listener and no `window.parent.postMessage` — a standalone page has no parent.

### Widget Config
Embed a complete widget configuration in the HTML:
```json
{
  "type": "visualization3d",
  "visualizationType": "{{visualizationType}}",
  "description": "...",
  "objects": [...],
  "interactions": [...],
  "presets": [...]
}
```

### Mobile Considerations
1. Touch-enabled OrbitControls
2. Lower polygon count for mobile
3. Control panel at bottom for thumb access
4. Readable text sizes

Return ONLY the HTML document.

Use the shared token block and component classes from `VISUAL-STYLE.md` verbatim. The page background and `scene.background` both resolve to `--bg`, so the canvas never shows a seam. 3D object/material colours are subject matter, not UI chrome.

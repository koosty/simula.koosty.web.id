Create a simulation widget for: {{conceptName}}

## Concept Overview

{{conceptOverview}}

## Key Points

{{keyPoints}}

## Variables to Expose

{{variables}}

## Design Idea

{{designIdea}}

## Language

{{languageDirective}}

---

Generate a complete, interactive HTML simulation with these MANDATORY features:

### Structure
1. **Embedded JSON config** in `<script type="application/json" id="widget-config">`
2. **Control panel** with sliders for each variable
3. **Canvas visualization** with proper sizing
4. **Preset buttons** for common scenarios

### Mobile Responsiveness (CRITICAL)
1. **Control panel MUST NOT overlap canvas.** Use the two-column layout from `simulation-system.md` section 1: canvas and readouts left, controls and presets right from a 760px frame width; stacked in document order below it
2. Use CSS grid for the columns, not `flex-col md:flex-row`. The simulation is embedded at full width, so no `max-h-[40vh]` or `md:max-h-screen` cap: the frame measures the content height
3. Controls must be in the first screen beside the canvas at a 1280px page (the reader should not scroll to change a value)
4. Canvas container: `min-h-[300px]` to ensure visibility
5. Touch-friendly controls (44px minimum touch targets)

### Button Logic (CRITICAL)
1. **Main button MUST handle all states correctly:**
   - "启动" → Starts simulation
   - "暂停" → Pauses running simulation
   - "重新开始" → Resets to initial state, then starts fresh
2. **Reset function MUST reset ALL state variables** (position, velocity, time, etc.)
3. Use clear state tracking: `{ running: boolean, ended: boolean, paused: boolean }`

### Canvas
1. Auto-resize on window resize
2. Clear visualization with grid or guides
3. Real-time data display overlay
4. Proper scaling for different screen sizes

### Interactivity
1. Real-time updates when sliders change
2. Presets apply and reset simulation
3. Keyboard shortcuts (Space = toggle, R = reset)
4. Touch gestures for mobile

### Visual Polish
1. Show current simulation state (running/paused/ended)
2. Animate transitions
3. Clear feedback when simulation ends
4. High contrast colors for visibility

Use the shared token block and component classes from `VISUAL-STYLE.md` verbatim — no bespoke colours, spacing, or button styles. Canvas-drawn visuals follow the same palette.

# Simulation Widget Content Generator

Generate a self-contained HTML simulation with embedded widget configuration.

## Output Structure

Your output must be a complete HTML document with:

1. The page contract in `../SKILL.md` — correct `<html lang>`, a real `<title>`, meta description, OG tags, and exactly one `<h1>` carrying the scene title.
2. **Embedded widget configuration** in a `<script type="application/json" id="widget-config">` tag
3. **Interactive controls** for variables
4. **Canvas or SVG visualization**
5. **Mobile-responsive design**
6. **Shared visual style** — the token block and component classes from `VISUAL-STYLE.md`

## Widget Config Schema

```json
{
  "type": "simulation",
  "concept": "projectile_motion",
  "description": "...",
  "variables": [
    { "name": "angle", "label": "Launch Angle", "min": 0, "max": 90, "default": 45, "unit": "°" }
  ],
  "presets": [
    { "name": "Hit the target", "variables": { "angle": 30, "velocity": 25 } }
  ]
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

## Element Naming Convention

To make highlight/annotation work, use consistent IDs for controls:
- Sliders: `id="{variable_name}-slider"` (e.g., `id="angle-slider"`, `id="velocity-slider"`)
- Buttons: `id="{action}-btn"` (e.g., `id="start-btn"`, `id="reset-btn"`)
- Displays: `id="{variable_name}-display"` (e.g., `id="acceleration-display"`)

## CRITICAL Design Requirements

### 1. Layout - NO OVERLAP, CONTROLS BESIDE THE CANVAS
- The simulation is embedded as a full-width frame (docs/adr/0020). A media query inside the simulation measures the frame's width, not the window's.
- **At 760px wide or more**, use two columns: the canvas and its readouts on the left, the controls and presets on the right (300-360px). The reader sees and changes the controls without scrolling.
- **Below 760px**, stack the sections in document order: canvas, readouts, controls, presets. The control panel must not overlap the canvas.
- Keep the DOM order the same in both layouts, because tab order follows it. Place the sections with CSS grid (`grid-column` and `grid-row`), not by moving elements.
- Full-width items such as the heading and footnote span both columns (`grid-column: 1 / -1`).
- Use `min-height` on the canvas (300px) so it is visible on a phone. Controls keep the 44px touch target.
- Test frame widths: 320px, 375px, 760px, and 1248px (a 1280px page).

Example:
```html
<div class="wrap">
  <section class="panel stage"><!-- canvas --></section>
  <section class="panel"><!-- readouts --></section>
  <section class="panel"><!-- controls --></section>
  <section class="panel"><!-- presets --></section>
</div>
```
```css
.wrap { max-width: none; display: flex; flex-direction: column; gap: var(--space-4); }
@media (min-width: 760px) {
  .wrap {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
    align-items: start;
  }
  .wrap > section:nth-of-type(1) { grid-column: 1; grid-row: 2; }  /* canvas */
  .wrap > section:nth-of-type(2) { grid-column: 1; grid-row: 3; }  /* readouts */
  .wrap > section:nth-of-type(3) { grid-column: 2; grid-row: 2; }  /* controls */
  .wrap > section:nth-of-type(4) { grid-column: 2; grid-row: 3; }  /* presets */
}
```

### 2. Reset Button - MUST WORK CORRECTLY
- **Reset button MUST return simulation to initial state**
- Common bug: Button changes text to "重新开始" but clicking it doesn't reset
- Solution: Use a separate reset function, or check state properly

Correct implementation:
```javascript
let state = { running: false, ended: false, posX: 50, velocity: 0 };

function handleMainButton() {
  if (state.ended) {
    // If simulation ended, reset first
    resetSimulation();
  } else if (state.running) {
    pauseSimulation();
  } else {
    startSimulation();
  }
}

function resetSimulation() {
  state.running = false;
  state.ended = false;
  state.posX = 50;  // Reset to initial position!
  state.velocity = 0;  // Reset velocity!
  updateButton('启动');
  draw();
}

// When simulation hits boundary/ends:
function onSimulationEnd() {
  state.running = false;
  state.ended = true;
  updateButton('重新开始');
}

function updateButton(text) {
  document.getElementById('mainBtn').innerText = text;
}
```

### 3. Button State Management
- Use clear state variables: `running`, `paused`, `ended`
- Button text should reflect what will happen when clicked:
  - "启动" / "开始" → Start simulation
  - "暂停" / "暂停" → Pause running simulation
  - "继续" / "继续" → Resume paused simulation
  - "重新开始" / "重试" → Reset and start fresh (when ended)
- One button should NOT do different things based on text alone

### 4. Touch-Friendly Controls
- Minimum touch target: 44x44px for buttons
- Sliders: Increase thumb size for mobile (min 24px)
- Add `touch-action: manipulation` to prevent double-tap zoom
- Use `touch-action: none` on canvas for custom gesture handling

### 5. Canvas Sizing
- Use `ResizeObserver` or window resize event
- Canvas should fill available space but respect `max-height`
- Don't use fixed pixel dimensions
- Account for control panel height on mobile

### 6. Visual Feedback
- Clear indication when simulation starts/pauses/ends
- Show current state in UI (running indicator, paused icon)
- Highlight end boundary or target
- Show success/failure message when simulation ends
- Animate the "重新开始" button appearance

### 7. Visible Animation (CRITICAL)

**When the user clicks "启动" (Start), there MUST be OBVIOUS visual animation.**

#### Animation Requirements:
1. **Moving objects**: Objects should visibly move, rotate, or change when simulation runs
2. **Clear motion**: Animation should be immediately noticeable - not subtle
3. **Rotation animations**: For spinning/rotating objects (earth, wheels, etc.), show actual rotation:
   ```javascript
   // GOOD: Earth visibly rotates
   function draw() {
     ctx.clearRect(0, 0, w, h);
     ctx.save();
     ctx.translate(centerX, centerY);
     ctx.rotate(rotationAngle); // Earth rotates!
     // Draw earth content...
     ctx.restore();

     if (state.running) {
       rotationAngle += 0.02 * state.speed; // Update rotation
     }
   }
   ```
4. **Multiple visual cues**: Combine motion with other feedback:
   - Object position/rotation changes
   - Clock/timer updates
   - Color changes or highlights
   - Particle effects for dynamic simulations

#### BAD Example (User can't tell if it's running):
```javascript
// Earth is static 2D circle, only time number changes
// User clicks "Start" → Nothing visibly moves → Confusing!
```

#### GOOD Example (Clear visual feedback):
```javascript
// Earth rotates, sun position moves, day/night boundary shifts
// User clicks "Start" → Earth visibly spins → Satisfying!
```

### 8. Data Display
- Real-time values should be clearly visible
- Use monospace font for numbers
- Show units consistently
- Consider a floating info panel that doesn't block the simulation

### 9. Presets
- Each preset should clearly describe what it demonstrates
- Preset buttons should be touch-friendly (larger on mobile)
- Applying a preset should reset the simulation

### 10. Accessibility
- ARIA labels on all controls
- Keyboard support (Space to start/pause, R to reset)
- Focus indicators
- High contrast text on canvas

### 11. Performance
- Use `requestAnimationFrame` for animations
- Clear canvas each frame
- Don't create objects in render loop
- Throttle slider input events if needed

## Common Bugs to Avoid

| Bug | Cause | Solution |
|-----|-------|----------|
| Reset doesn't work | Button calls wrong function | Ensure reset function resets ALL state variables |
| Canvas overlap on mobile | Fixed positioning | Use flex/grid with proper responsive classes |
| Simulation stuck | Missing `ended` state | Track `ended` separately from `running` |
| Button does nothing | State logic error | Clear state machine with defined transitions |
| Touch issues | Small touch targets | Min 44px touch targets, larger sliders |
| Buttons do nothing | Inline `onclick` cannot reach closure functions | Wire with `addEventListener` |
| Answer visible early | Bar length, fill, or label reveals the target | Keep `?` until submit |
| Reset leaves a timer running | Pending `setTimeout` or animation frame not cancelled | Cancel everything in `resetState()` |
| Config drift | Slider range typed twice | Generate config and controls from one constant |

## Output Format

Return ONLY the HTML document, no markdown fences or explanations.

**CRITICAL: Output EXACTLY ONE HTML document.**
- Do NOT duplicate content
- Do NOT include multiple `<!DOCTYPE html>` tags
- The output must end with exactly one `</html>` tag

## Object Positioning with UI Overlays

When calculating positions for simulation objects, account for UI overlays:

```javascript
// BAD: Object overlaps with controls/HUD
const objectY = baseY - (value / maxValue) * canvas.height;

// GOOD: Reserve space for UI elements
const TOP_MARGIN = 100;    // Space for HUD/stats at top
const BOTTOM_MARGIN = 200; // Space for controls at bottom
const playableHeight = canvas.height - TOP_MARGIN - BOTTOM_MARGIN;
const objectY = baseY - BOTTOM_MARGIN - (value / maxValue) * playableHeight;
```

## Quality Checklist (verify before output)

- [ ] Control panel does NOT overlap canvas on mobile (test 320px width)
- [ ] Reset button returns simulation to EXACT initial state
- [ ] Button text matches button action correctly
- [ ] Touch targets are at least 44px
- [ ] Canvas resizes properly on window resize
- [ ] State machine is clear (running/paused/ended)
- [ ] All state variables reset on resetSimulation()
- [ ] Works on both desktop and mobile browsers
- [ ] **NO DUPLICATED HTML** - exactly ONE `<!DOCTYPE html>` tag
- [ ] Simulation objects are visible and not hidden under UI overlays
- [ ] **Visible animation: Objects visibly move/rotate when simulation runs**
- [ ] **Animation is OBVIOUS, not subtle - user can tell simulation is running**
- [ ] No inline `onclick` or other inline event handler
- [ ] No answer, target, or result visible before the student submits
- [ ] Answer checking is an exact match after strict parsing; partial input is rejected
- [ ] widget-config min, max, and defaults match the controls
- [ ] Reset cancels all timers and animation frames
- [ ] Global single-key shortcuts (Space, R) ignore Ctrl, Meta, and Alt, and do not intercept Enter or Space on buttons
- [ ] All canvas content and labels are fully visible at 375px
- [ ] Browser run: zero console errors; no `NaN`, `undefined`, or `[object` text

Do NOT emit a `postMessage` listener, `window.parent.postMessage`, `publishState()`,
`id="experiment"`, or `data-maic-observation`. See `STANDALONE-OVERRIDES.md`.

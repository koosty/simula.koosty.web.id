# Educational Game Widget Generator

Generate a self-contained HTML game that is FUN, ENGAGING, and EDUCATIONAL.

## Core Principle: GAMES, NOT QUIZZES

**CRITICAL: Avoid boring multiple-choice quizzes!** Students already have enough tests. Create games that are:
- **Interactive**: Players DO something, not just click answers
- **Skill-based**: Success depends on player action, not just knowing the answer
- **Engaging**: Fun mechanics that make students want to play more
- **Meaningful simulation**: If there's a visual simulation, it MUST be part of the gameplay

## Game Types (PREFER THESE OVER QUIZ)

### 1. Physics/Action Games (HIGHLY RECOMMENDED)
- **Timing games**: Click at the right moment to hit a target
- **Aim and launch**: Adjust angle/power to hit targets
- **Balance games**: Keep an object balanced or in motion
- **Catch/avoid games**: Move to catch falling objects or avoid obstacles
- **Example**: Instead of asking "What force is needed?", let players ADJUST thrust and SEE if they land safely

### 2. Drag-and-Drop Puzzles
- Sort items into correct categories
- Arrange steps in correct order
- Match pairs by dragging
- Build structures by placing pieces

### 3. Interactive Simulations as Games
- Let players ADJUST parameters and see results
- Challenge: "Land the spacecraft safely" - player controls thrust
- Challenge: "Reach the target" - player adjusts angle and power
- Challenge: "Balance the forces" - player adds/removes weights

### 4. Card/Matching Games
- Memory match with concept pairs
- Flashcard flip to reveal answers
- Sorting cards into categories

### 5. Strategy/Decision Games
- Turn-based decisions with consequences
- Resource management challenges
- Multi-step problem solving

## When Quiz is Unavoidable

If you MUST include quiz elements:
- Make it INTERACTIVE (drag answer to target, not click radio button)
- Add PHYSICS/ACTION component (answer unlocks next gameplay)
- Use VISUAL questions (identify the diagram, not text questions)
- Keep questions SHORT and FEW (max 3-5)
- Include EXPLANATION as gameplay reward, not punishment

## Simulation-Game Integration (CRITICAL)

If your game has a visual simulation, it MUST be:
1. **Interactive**: Player controls something in the simulation
2. **Meaningful**: Player's actions affect the outcome
3. **Aligned with learning**: The physics/concept being taught is what the player manipulates

### BAD Example:
```
Question: "What thrust is needed for 1000kg at 9.8m/s²?"
Options: [4900N, 9800N, 19600N, 0N]
Player clicks answer → Animation plays (success or failure)
```
Problem: Simulation is just decoration. Player doesn't interact with it.

### GOOD Example:
```
Game: "Land the spacecraft safely"
Player controls: Thrust slider (0-15000N)
Real-time physics: Spacecraft falls at rate determined by (thrust - mass*g)
Challenge: Adjust thrust to land at velocity < 5m/s
Feedback: Visual speedometer shows current velocity
Learning: Player EXPERIENCES F=ma by adjusting thrust and seeing result
```

## Widget Config Schema

```json
{
  "type": "game",
  "gameType": "action",
  "description": "...",
  "gameConfig": {
    "controls": ["thrust_slider", "angle_adjuster"],
    "targets": [
      { "id": "t1", "type": "landing_zone", "x": 300, "width": 100, "maxVelocity": 5 }
    ],
    "initialConditions": {
      "mass": 1000,
      "gravity": 9.8,
      "altitude": 500,
      "initialVelocity": 0
    },
    "successCondition": "landingVelocity < 5",
    "levels": [...]
  },
  "scoring": {
    "completionPoints": 50,
    "accuracyBonus": "lower velocity = more points",
    "timeBonus": true
  },
  "achievements": [
    { "id": "soft_landing", "name": "Butter Landing", "description": "Land at < 2m/s", "icon": "🦋" }
  ]
}
```

## Technical Requirements

- Real-time game loop with `requestAnimationFrame`
- Touch-friendly controls (sliders, buttons, drag areas)
- Clear visual feedback (score, progress, status)
- Achievement popups
- Level progression
- localStorage for progress
- Pause/resume functionality
- Clear instructions before game starts

## Fair Start Requirements (CRITICAL)

**NEVER let the player fail immediately when the game starts!**

### Mandatory Rules:
1. **Grace Period**: First 3-5 seconds should be safe - no failure conditions apply
2. **Safe Initial State**: Player must be able to survive at least 10 seconds with default settings
3. **No Instant Collision**: Game objects should start in safe positions, away from danger zones
4. **Reasonable Physics**: Initial velocities must allow stable gameplay, not immediate crash

### For Physics-Based Games:
- Calculate stable orbital/trajectory parameters BEFORE setting initial values
- Verify: `initial_velocity >= sqrt(GM/r)` for orbital games
- Test: Player not touching any danger zone at start
- Ensure: Default control values (e.g., thrust at 100%) result in survivable state

### BAD Example (Player fails instantly):
```javascript
// Earth starts at distance 250 from sun
// Initial velocity: 2.4 (way too low for orbit)
// Player clicks "Start" → Earth immediately falls into sun → "Mission Failed"
```

### GOOD Example (Player has time to react):
```javascript
// Earth starts at distance 250 from sun
// Initial velocity: calculated for stable orbit ≈ sqrt(1500*200/250) ≈ 35
// OR: Start with grace period where collision is disabled for 3 seconds
// Player can adjust thrust before any danger
```

## Layout & Positioning (CRITICAL)

### Game Object Positioning
When calculating positions for game objects (lander, player, targets), account for UI overlays:

```javascript
// BAD: Object overlaps with controls/HUD
const objectY = groundY - (altitude / maxHeight) * canvas.height;

// GOOD: Reserve space for UI elements
const TOP_MARGIN = 100;    // Space for HUD/stats at top
const BOTTOM_MARGIN = 250; // Space for controls at bottom
const playableHeight = canvas.height - TOP_MARGIN - BOTTOM_MARGIN;
const objectY = groundY - BOTTOM_MARGIN - (altitude / maxHeight) * playableHeight;
```

### Control Panel Sizing
- Don't let controls take more than 30% of screen height
- On mobile, consider collapsible controls or side-by-side layout
- Test that the main game object is always visible

### Canvas vs UI Layers
- Canvas should fill the container but NOT overlap with fixed UI
- Use padding or margins to create "safe zones" for game objects
- Position game objects within the visible canvas area, not under overlays

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

So reset, presets, and your own UI can target controls, use consistent ids:
- Sliders: `id="{param}-slider"` (e.g., `id="thrust-slider"`)
- Buttons: `id="{action}-btn"` (e.g., `id="start-btn"`, `id="reset-btn"`)
- If game parameters live only in JS state, expose `window.setGameParam(key, value)`
  so presets and the reset path can drive them.

## Output Format (CRITICAL)

**Return EXACTLY ONE HTML document.** Do NOT:
- Duplicate the HTML content
- Include multiple `<!DOCTYPE html>` tags
- Append a second copy of the document

Output structure must be:
```html
<!DOCTYPE html>
<html lang="{courseLang}">
<head>
  <!-- Full page contract: charset, viewport, <title>, description, OG tags.
       See the "Page contract" section in ../SKILL.md — do not leave <head>
       empty and do not use a placeholder title. -->
</head>
<body>
  <h1>{sceneTitle}</h1>
  ...
</body>
</html>
<!-- END - Nothing after this -->
```

If you catch yourself duplicating content, STOP and output only the first complete document.

## Engagement Features

1. **Immediate feedback**: Player knows instantly if action was right/wrong
2. **Visual rewards**: Animations, particles, sounds for success
3. **Progression**: Levels get progressively harder
4. **Replayability**: Random elements, multiple paths to success
5. **Challenge variety**: Different objectives (speed, accuracy, efficiency)
6. **High scores**: Track best performance

## Output Format

Return ONLY the HTML document, no markdown fences or explanations.

## Quality Checklist (verify before output)

- [ ] Game is INTERACTIVE, not just a quiz
- [ ] Player CONTROLS something meaningful
- [ ] Simulation (if present) is part of gameplay, not decoration
- [ ] Success depends on player SKILL, not just knowledge
- [ ] **Fair Start: Player cannot fail in first 3-5 seconds**
- [ ] **Initial parameters allow survival with default settings**
- [ ] Visual feedback is immediate and clear
- [ ] Game is FUN to play (would you play it more than once?)
- [ ] Learning happens through PLAY, not through questions
- [ ] Touch-friendly controls for mobile
- [ ] Clear instructions at game start
- [ ] Achievement system provides motivation
- [ ] **NO DUPLICATED HTML** - exactly ONE `<!DOCTYPE html>` tag
- [ ] Game objects are VISIBLE and not hidden under UI overlays
- [ ] Positioning accounts for control panel and HUD heights

## Critical Technical Requirements (MANDATORY)

### 1. Event Binding: addEventListener for Every Button
**Never use inline `onclick`.** An inline handler can only call a global function. A function declared inside a DOMContentLoaded wrapper is not global, so the button does nothing and the failure is silent. Bind every button, including the start button, with `addEventListener` (see sections 3 and 4).

```html
<!-- CORRECT: bound in the same scope as the handler -->
<button id="start-btn" class="btn btn-primary">开始游戏</button>
<script>
document.addEventListener('DOMContentLoaded', function () {
  function startGame() { /* ... */ }
  document.getElementById('start-btn').addEventListener('click', startGame);
});
</script>

<!-- WRONG: the handler is inside the closure, so onclick cannot reach it -->
<button onclick="startGame()">开始游戏</button>
```

### 2. CSS: Prefer Custom CSS Over Tailwind CDN
**Use custom CSS instead of Tailwind CDN for game widgets.** Tailwind CDN with `@layer utilities` may not compile correctly, causing elements to be unstyled or invisible.

```html
<!-- CORRECT: shared component classes - reliable and on-style -->
<style>
  /* tokens and .btn / .btn-primary from VISUAL-STYLE.md */
  .game-button { padding: var(--space-3) var(--space-6); }
</style>
<button id="start-btn" class="btn btn-primary game-button">Start</button>

<!-- WRONG: Tailwind @layer utilities may fail -->
<style type="text/tailwindcss">
  @layer utilities { .game-button { @apply bg-blue-500 px-6; } }
</style>
```

**Never hardcode a colour** — `#3498db` and friends are superseded by the `--accent` token, so every game in every course matches the rest of the course.

**Exception**: You may use basic Tailwind utility classes (like `flex`, `text-center`) directly on elements, but avoid `@layer utilities` blocks.

### 3. Script Placement: Wrap in DOMContentLoaded or Place at End
**Either wrap the entire game script in DOMContentLoaded, or place it at the very end of body.**

```html
<!-- Option A: DOMContentLoaded wrapper -->
<script>
document.addEventListener('DOMContentLoaded', function() {
  // All game code here - elements are guaranteed to exist
  const canvas = document.getElementById('gameCanvas');
  function startGame() { ... }
});
</script>

<!-- Option B: Script at end of body (after all elements) -->
</body>
<!-- No elements after this point -->
</html>
```

### 4. Handler Scope
Functions bound with `addEventListener` stay inside the DOMContentLoaded wrapper, next to the code they use. Never reference a game function from an HTML attribute.

```javascript
document.addEventListener('DOMContentLoaded', function () {
  function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    gameActive = true;
    initLevel();
  }
  document.getElementById('start-btn').addEventListener('click', startGame);
});
```

### 5. Simple Initialization Flow
**The game initialization should be simple and direct:**

```javascript
function startGame() {
  // 1. Hide start overlay
  document.getElementById('start-screen').classList.add('hidden');
  // 2. Set game state
  gameActive = true;
  startTime = Date.now();
  // 3. Initialize first level
  initLevel();
  // 4. Start game loop
  requestAnimationFrame(gameLoop);
}
```

**Avoid**: Complex dependencies like reading localStorage before events are bound, multiple async operations during init, or chained promises for game start.

Do NOT emit a `postMessage` listener, `window.parent.postMessage`, `publishState()`,
`id="experiment"`, or `data-maic-observation`. See `STANDALONE-OVERRIDES.md`.

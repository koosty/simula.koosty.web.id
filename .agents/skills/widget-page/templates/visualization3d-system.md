# 3D Visualization Content Generator

Generate a self-contained HTML 3D visualization with embedded widget configuration using Three.js.

## Output Structure

Your output must be a complete HTML document with:

1. **Standard HTML5 structure**
2. **Three.js loaded from CDN** (use unpkg or cdnjs)
3. **Embedded widget configuration** in a `<script type="application/json" id="widget-config">` tag
4. **3D scene with interactive controls** (OrbitControls, sliders, buttons, **ZOOM BUTTONS**)
5. **Mobile-responsive design**
6. **Shared visual style** — the token block and component classes from `VISUAL-STYLE.md`; page background and `scene.background` both resolve to `--bg`

## ⚠️ CRITICAL REQUIREMENTS

### 1. LIGHTING - Objects MUST be clearly visible

**ALWAYS ensure:**
- Background should NOT be pure black — use the `--bg` token (`#12131d` in the default dark theme, `#f8fafc` in light) or a dark gradient derived from it.
- Ambient light intensity at least `0.4` (not 0.1!)
- Main objects MUST have dedicated lights illuminating them
- For planets/Earth, use bright diffuse color (not dark!)
- Add hemisphere light for natural ambient fill

```javascript
// GOOD lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Hemisphere light for natural lighting
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
scene.add(hemiLight);

// Main directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);
```

### 2. ZOOM CONTROLS - REQUIRED for mobile users

**MUST include zoom buttons** in the control panel:

```html
<!-- Add these buttons to your controls -->
<div class="zoom-controls">
  <button id="zoom-in-btn" title="放大">+</button>
  <button id="zoom-out-btn" title="缩小">−</button>
</div>
```

```javascript
// Zoom functionality
document.getElementById('zoom-in-btn').addEventListener('click', () => {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  camera.position.addScaledVector(direction, 5);
});

document.getElementById('zoom-out-btn').addEventListener('click', () => {
  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  camera.position.addScaledVector(direction, -5);
});
```

### 3. REALISTIC OBJECTS - Use procedural textures

**For Earth/planets, create realistic appearance:**

```javascript
// Create procedural Earth texture with continents
function createEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Ocean base (bright blue, not dark!)
  ctx.fillStyle = '#1e90ff';
  ctx.fillRect(0, 0, 512, 256);

  // Add continents (green land masses)
  ctx.fillStyle = '#228b22';

  // Simple continent shapes (approximate)
  // North America
  ctx.beginPath();
  ctx.ellipse(100, 80, 60, 40, 0, 0, Math.PI * 2);
  ctx.fill();

  // South America
  ctx.beginPath();
  ctx.ellipse(130, 160, 30, 50, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Europe/Africa
  ctx.beginPath();
  ctx.ellipse(270, 100, 40, 70, 0, 0, Math.PI * 2);
  ctx.fill();

  // Asia
  ctx.beginPath();
  ctx.ellipse(380, 70, 80, 50, 0, 0, Math.PI * 2);
  ctx.fill();

  // Australia
  ctx.beginPath();
  ctx.ellipse(420, 170, 30, 20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Add ice caps
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 15);
  ctx.fillRect(0, 241, 512, 15);

  // Add clouds (light patches)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 256;
    ctx.beginPath();
    ctx.ellipse(x, y, 30 + Math.random() * 20, 10 + Math.random() * 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

// Create Earth with procedural texture
const earthGeometry = new THREE.SphereGeometry(1, 64, 64);
const earthMaterial = new THREE.MeshPhongMaterial({
  map: createEarthTexture(),
  specular: 0x333333,
  shininess: 15
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
```

**For other planets:**
- **Mars**: Red-orange with dark patches (`#cd5c5c` base, `#8b4513` patches)
- **Jupiter**: Orange bands with white ovals
- **Sun**: Bright yellow-orange with glow effect (use emissive material)
- **Moon**: Gray with craters (use noise pattern)

## Widget Config Schema

```json
{
  "type": "visualization3d",
  "visualizationType": "solar",
  "description": "Interactive solar system model",
  "objects": [
    { "id": "sun", "type": "sphere", "material": { "type": "emissive", "color": "#FDB813" } },
    { "id": "earth", "type": "sphere", "material": { "type": "textured", "textureType": "earth" } }
  ],
  "interactions": [
    { "type": "orbit", "target": "camera" },
    { "type": "slider", "param": "speed", "min": 0, "max": 10, "default": 1 },
    { "type": "button", "action": "zoomIn", "label": "放大" },
    { "type": "button", "action": "zoomOut", "label": "缩小" }
  ],
  "presets": [
    { "name": "View Earth", "state": { "cameraTarget": "earth" } }
  ]
}
```

## Three.js Setup Template (Complete with Safeguards)

```html
<!DOCTYPE html>
<html lang="{courseLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{sceneTitle} · {courseTitle}</title>
  <meta name="description" content="{sceneDescription, ~155 chars}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{sceneTitle}">
  <meta property="og:description" content="{sceneDescription, ~200 chars}">
  <meta property="og:locale" content="{courseLang}">
  <!-- Page contract from widget-page/SKILL.md. No canonical/Twitter: no public URL. -->
  <style>
    /* The :root token block and component classes (.btn, .sr-only, …) come
       from VISUAL-STYLE.md and are pasted above this. Everything below
       resolves through var(); do not inline colours. */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: var(--bg);  /* MUST match scene.background! See token --bg */
    }
    #canvas-container { width: 100%; height: 100%; position: relative; }
    canvas { display: block; }

    /* Loading overlay - shows while Three.js initializes */
    #loading {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: var(--bg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      font-size: var(--text-base);
      z-index: var(--z-modal);
    }
    #loading .spinner {
      width: 40px; height: 40px;
      border: 3px solid var(--border-strong);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto var(--space-4);
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Control panel - mobile friendly */
    #controls {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--panel);
      backdrop-filter: blur(12px);
      padding: var(--space-4);
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
      justify-content: center;
      align-items: center;
      border-top: 1px solid var(--border);
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      min-width: 100px;
    }

    label {
      font-size: var(--text-caption);
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    input[type="range"] {
      width: 100%;
      height: 6px;
      -webkit-appearance: none;
      background: var(--border-strong);
      border-radius: var(--radius-pill);
      cursor: pointer;
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 20px;
      height: 20px;
      background: var(--accent);
      border-radius: 50%;
      cursor: pointer;
    }

    button {
      font-family: inherit;
      padding: var(--space-3) var(--space-5);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--border-strong);
      color: var(--text);
      cursor: pointer;
      font-size: var(--text-sm);
      min-width: 44px;
      min-height: 44px;
      transition: background var(--motion);
    }

    button:hover { background: var(--text-muted); }
    button:active { transform: scale(0.95); }
    button:focus-visible { outline: none; box-shadow: var(--focus-ring); }
    button.primary { background: var(--accent); border-color: var(--accent); }
    button.primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }

    /* Zoom buttons side by side */
    .zoom-btns {
      display: flex;
      gap: var(--space-2);
    }

    .zoom-btns button {
      width: 44px;
      height: 44px;
      font-size: var(--text-heading);
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    /* Info panel */
    #info {
      position: absolute;
      top: var(--space-5);
      left: var(--space-5);
      background: var(--panel);
      backdrop-filter: blur(8px);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      max-width: 280px;
      border: 1px solid var(--border);
    }

    #info h2 {
      font-size: var(--text-sm);
      color: var(--success);
      margin-bottom: var(--space-2);
    }

    #info p {
      font-size: var(--text-xs);
      color: var(--text-muted);
      line-height: 1.5;
    }

    @media (max-width: 600px) {
      #info { display: none; }
      #controls { padding: var(--space-3) var(--space-2) var(--space-6); }
    }
  </style>
</head>
<body>
  <!-- Exactly one <h1>, visually hidden: this layout is full-bleed canvas.
       Use the .sr-only utility below rather than omitting the heading. -->
  <h1 class="sr-only">{sceneTitle}</h1>

  <!-- Loading overlay - REQUIRED -->
  <div id="loading">
    <div style="text-align:center;">
      <div class="spinner"></div>
      {loadingLabelInTeachingLanguage}
    </div>
  </div>

  <div id="canvas-container"></div>
  <div id="info">
    <h2>{sceneTitle}</h2>
    <p>{sceneDescription}</p>
  </div>
  <div id="controls">
    <div class="control-group">
      <label>Speed</label>
      <input type="range" id="speed-slider" min="0" max="5" step="0.1" value="1">
    </div>
    <div class="zoom-btns">
      <button id="zoom-in-btn" title="Zoom In">+</button>
      <button id="zoom-out-btn" title="Zoom Out">−</button>
    </div>
    <button id="reset-btn" class="primary">Reset</button>
  </div>

  <script type="importmap">
  {
    "imports": {
      "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
      "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
    }
  }
  </script>

  <script type="module">
    import * as THREE from 'three';
    import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

    // WebGL support check - REQUIRED
    function checkWebGL() {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext &&
          (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch(e) {
        return false;
      }
    }

    // Scene initialization with error handling - REQUIRED
    async function initScene() {
      try {
        // Check WebGL support
        if (!checkWebGL()) {
          throw new Error('WebGL not supported in this browser');
        }

        const container = document.getElementById('canvas-container');

        // Validate container dimensions - REQUIRED
        const width = container.clientWidth || window.innerWidth;
        const height = container.clientHeight || window.innerHeight;

        if (width === 0 || height === 0) {
          throw new Error('Container has zero dimensions');
        }

        // Scene setup
        const scene = new THREE.Scene();
        // MUST match body background. Read the computed --bg token, so the canvas
        // follows the theme (dark default, light when the page sets data-theme="light").
        const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
        scene.background = new THREE.Color(bg);

        // Camera with validated dimensions
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 5, 15);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // GOOD lighting setup - objects must be visible!
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        scene.add(hemiLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(10, 20, 10);
        scene.add(directionalLight);

        // Objects storage for later reference
        const objects = {};

        // Animation state
        let animationSpeed = 1;

        // Animation loop
        function animate() {
          requestAnimationFrame(animate);
          // Update animations...
          controls.update();
          renderer.render(scene, camera);
        }
        animate();

        // Zoom controls - REQUIRED for mobile
        document.getElementById('zoom-in-btn').addEventListener('click', () => {
          const direction = new THREE.Vector3();
          camera.getWorldDirection(direction);
          camera.position.addScaledVector(direction, 3);
        });

        document.getElementById('zoom-out-btn').addEventListener('click', () => {
          const direction = new THREE.Vector3();
          camera.getWorldDirection(direction);
          camera.position.addScaledVector(direction, -3);
        });

        // Reset button
        document.getElementById('reset-btn').addEventListener('click', () => {
          camera.position.set(0, 5, 15);
          controls.target.set(0, 0, 0);
        });

        // Handle resize
        window.addEventListener('resize', () => {
          const newWidth = container.clientWidth || window.innerWidth;
          const newHeight = container.clientHeight || window.innerHeight;
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        });

        // Hide loading overlay - scene is ready
        document.getElementById('loading').style.display = 'none';

      } catch (error) {
        console.error('Scene initialization failed:', error);
        // Show error message in loading overlay
        document.getElementById('loading').innerHTML =
          `<div style="text-align:center;color:var(--error);">
            <div style="font-size:var(--text-heading);margin-bottom:var(--space-4);">⚠️</div>
            Failed to load 3D scene<br>
            <small style="color:var(--text-dim);">${error.message}</small><br>
            <button id="retry-btn" class="btn btn-primary" style="margin-top:var(--space-4);">Retry</button>
          </div>`;
        document.getElementById('retry-btn').addEventListener('click', function () { location.reload(); });
      }
    }

    // Initialize scene
    initScene();
  </script>

  <script type="application/json" id="widget-config">
  {
    "type": "visualization3d",
    "visualizationType": "custom",
    "description": "3D visualization",
    "objects": [],
    "interactions": []
  }
  </script>
</body>
</html>
```

## Visualization Types

### 1. Solar System (`solar`)
- Sun with emissive glow effect
- Planets with **procedural textures** (Earth with continents, Mars red, etc.)
- Orbital paths visible
- Zoom controls for mobile
- Bright lighting so planets are visible

### 2. Molecular (`molecular`)
- Atoms as colored spheres with high contrast
- Bonds as cylinders
- Labels for atom types
- Good ambient lighting

### 3. Anatomy (`anatomy`)
- Organs with distinct colors
- Transparent layers
- Labels and descriptions

### 4. Geometry (`geometry`)
- 3D shapes with distinct colors
- Edge highlighting
- Measurement annotations

### 5. Physics (`physics`)
- Trajectories with visible paths
- Force arrows
- Clear contrast between objects

### 6. Custom (`custom`)
- Follow the same lighting and zoom requirements

## Design Requirements

### 1. Visibility & Contrast
- Background: Use the `--bg` token or a dark gradient derived from it (NOT pure black)
- Objects: Use bright, distinct colors
- Ambient light: At least 0.5 intensity
- Add hemisphere light for natural fill

### 2. Mobile Responsiveness
- Touch-friendly controls (44px minimum)
- Zoom buttons always visible
- OrbitControls works with touch
- Control panel at bottom for thumb access

### 3. Performance
- Use `requestAnimationFrame`
- Limit geometry complexity
- Use 64 segments for spheres (not 128)

### 4. Textures
- Create procedural textures using Canvas API
- No external image dependencies
- Earth: Blue ocean + green continents + white ice caps
- Planets: Appropriate colors with variations

## JavaScript Coding Rules

### 1. Switch Statement Scope (CRITICAL - Causes SyntaxError)

Applies to any `switch` in your page, including the scene-type dispatcher below.

**WRONG - Variables redeclared across cases:**
```javascript
// This causes: SyntaxError: Identifier 'objectId' has already been declared
switch (action) {
  case 'focus':
    const { objectId, color } = payload;  // First const
    // ...
    break;
    
  case 'annotate':
    const { objectId, text } = payload;  // ERROR! objectId already declared
    // ...
    break;
}
```

**CORRECT - Wrap each case in braces to create block scope:**
```javascript
// Each case has its own block scope
switch (action) {
  case 'focus': {
    const { objectId, color } = payload;
    // ...
    break;
  }
  
  case 'annotate': {
    const { objectId, text } = payload;  // OK - different block scope
    // ...
    break;
  }
  
  case 'applyPreset': {
    const { cameraPosition, scale } = payload;
    // ...
    break;
  }
}
```

**Alternative - Use different variable names:**
```javascript
switch (action) {
  case 'focus':
    const focusData = payload;
    // Use focusData.objectId
    break;
    
  case 'annotate':
    const annotateData = payload;
    // Use annotateData.objectId
    break;
}
```

### 2. Platform Message Listener - REMOVED for standalone

Upstream, the platform drove this widget over `postMessage`
(`SET_WIDGET_STATE`, `HIGHLIGHT_ELEMENT`, `ANNOTATE_ELEMENT`, `REVEAL_ELEMENT`).
A standalone page has no parent and no score channel, so this listener is
**not emitted** and `publishState()` / `id="experiment"` /
`data-maic-observation` are not used. See `STANDALONE-OVERRIDES.md`, which
forbids all of it. Do not call `window.parent.postMessage`.

Expose plain functions instead, so presets, the reset button, and any in-page
UI share one code path:

```javascript
window.setSceneState = function (key, value) {
  if (key === 'cameraPosition') camera.position.set(...value);
  if (key === 'target') controls.target.set(...value);
  if (key === 'scale') { /* apply to the relevant object group */ }
  controls.update();
};

window.highlightObject = function (objectId) {
  const meshes = objects[objectId];
  if (!meshes) return;                 // null-safe: unknown id must not throw
  meshes.forEach(mesh => mesh.material.emissive.set(0xfbbf24));  // --success token
};

window.clearHighlight = function (objectId) {
  const meshes = objects[objectId];
  if (!meshes) return;
  meshes.forEach(mesh => mesh.material.emissive.set(0x000000));
};
```

Keep these defensive: an unknown object id or a missing property must return
early rather than throw.

## Output Format

Return ONLY the HTML document, no markdown fences or explanations.

**CRITICAL: Output EXACTLY ONE HTML document.**
- Do NOT duplicate content
- Do NOT include multiple `<!DOCTYPE html>` tags
- The output must end with exactly one `</html>` tag

Do NOT emit a `postMessage` listener, `window.parent.postMessage`, `publishState()`,
`id="experiment"`, or `data-maic-observation`. See `STANDALONE-OVERRIDES.md`.

# Visual style (consistent UI across every widget)

Every page this skill produces uses the same tokens and the same component
classes. Layout and composition vary with the scene; colour, spacing, type,
radius, motion, and control rendering do not.

**Precedence:** `VISUAL-STYLE.md` overrides the `templates/`.
`STANDALONE-OVERRIDES.md` still overrides both. If a template's example CSS
disagrees with a token here, the token wins.

**Scope:** one global style for all courses. There is no per-course style file
and no per-course override — consistency within a course is guaranteed because
every page uses the same baseline.

## Theme

Dark is the default when nothing is set. Light is a full alternative token set, not a partial override, so a newly added token can never silently fall back to dark.

The site sets the theme. The page's own `<html>` carries only the language:

```html
<html lang="en">
```

`lang` is the BCP-47 code from the course's `lang` field — see the page contract in `SKILL.md`. Do not write `data-theme` on the page. On the site, the header switch writes `data-theme` on the embedding page and the simulation frame copies it (docs/adr/0019). With no choice stored there is no attribute, and the page follows `prefers-color-scheme` on its own, so a file opened by itself still matches the reader's system. `data-theme="dark"` or `data-theme="light"` on the page always wins over the system.

## Design identity

This skill borrows oil-ui's naming grammar for a single, deliberately fixed
look (see "Scope" above — no per-course variation). Mapped onto oil-ui's
style-card roles, this skill's identity is:

- **Colour roles**: `--bg`/`--surface`/`--panel` (bg, surface), `--text`/`--text-muted`/`--text-dim` (text, muted), `--accent`/`--accent-hover`/`--accent-text` (accent, accent on-fill text), `--border`/`--border-strong` (line), `--error`/`--warning` (warn).
- **Border**: hairline only — every divider and control border is a 1px low-contrast line (`--border`), never `none` or a heavy `solid` rule.
- **Radius**: `--radius-md` (8px) is the base corner language — rounded enough to feel approachable, not pill-shaped except on tracks/pills.
- **Shadow**: `soft` — `--shadow-soft` lifts panels off the background. Buttons have a keycap base shadow (`0 4px 0 var(--border)`) that sinks on press. The primary button also glows with its accent. Other glows are decoration only (see Arcade accents below the button classes).
- **Density**: `regular` — the `--space-*` scale is tuned for a control-panel density, not compact (cramped) or airy (sparse).
- **Weight**: `--font-weight-display` (600) on headings, `--font-weight-number` (500) on monospaced readouts — body text stays regular weight.

These are fixed identity choices, not per-course knobs — do not vary them per
scene.

## Tokens

Paste this block at the top of every page's `<style>`, after the page contract
from `SKILL.md` has set up `<head>`. Do not invent new colours inline; if
something is missing, add it here first.

```css
:root {
  /* Colour. Dark is the default: the Neo-Arcade STEM palette (docs/adr/0017). */
  --bg: #12131d;          /* page background; also the 3D canvas background */
  --surface: #1a1b25;     /* panels, cards, step rows */
  --panel: #1e1f2a;       /* raised controls and hover */
  --border: #3b494b;
  --border-strong: #849495;
  --text: #e2e1f0;
  --text-muted: #b9cacb;
  --text-dim: #849495;
  --accent: #00f0ff;      /* primary action, slider thumb, active state */
  --accent-hover: #7df4ff;
  --accent-text: #0b0c16;  /* text/icon colour sitting on --accent fills */
  --success: #39ff14;     /* completion, headings, callouts */
  --warning: #f3db00;     /* warnings; reading code highlight */
  --error: #ff4a8d;
  --shadow-soft: 0 4px 16px rgba(0, 0, 0, 0.35);
  --shadow-none: none;

  /* Spacing scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;

  /* Radius scale */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 999px;

  /* Type. The site's three families (docs/adr/0019), with system fallbacks. */
  --font-display: 'Space Grotesk', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --text-base: 16px;
  --text-sm: 14px;
  --text-xs: 13px;
  --text-caption: 11px;   /* uppercase control labels */
  --text-heading: 24px;
  --font-weight-display: 600;  /* headings */
  --font-weight-number: 500;   /* monospaced readouts */

  /* Focus, motion, stacking */
  --focus-ring: 0 0 0 3px rgba(0, 240, 255, 0.5);
  --motion: 0.2s;
  --motion-slow: 0.3s;
  --z-overlay: 100;        /* panels, tooltips */
  --z-modal: 1000;         /* loading screens, modal dialogs */
}

/* Light values. Written twice on purpose: under the explicit attribute, and
   under the system query for a page that has no attribute. Keep them identical. */
[data-theme="light"] {
  color-scheme: light;
  --bg: #f8fafc;
  --surface: #ffffff;
  --panel: #f1f5f9;
  --border: #cbd5e1;
  --border-strong: #475569;
  --text: #0f172a;
  --text-muted: #334155;
  --text-dim: #64748b;
  --accent: #0092ac;
  --accent-hover: #3fc8dc;
  --accent-text: #0f172a;
  --success: #047857;
  --warning: #d97706;
  --error: #b8126b;
  --focus-ring: 0 0 0 3px rgba(0, 146, 172, 0.5);
  --shadow-soft: 0 4px 16px rgba(15, 23, 42, 0.08);
}

@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    color-scheme: light;
    --bg: #f8fafc;
    --surface: #ffffff;
    --panel: #f1f5f9;
    --border: #cbd5e1;
    --border-strong: #475569;
    --text: #0f172a;
    --text-muted: #334155;
    --text-dim: #64748b;
    --accent: #0092ac;
    --accent-hover: #3fc8dc;
    --accent-text: #0f172a;
    --success: #047857;
    --warning: #d97706;
    --error: #b8126b;
    --focus-ring: 0 0 0 3px rgba(0, 146, 172, 0.5);
    --shadow-soft: 0 4px 16px rgba(15, 23, 42, 0.08);
  }
}
```

Every colour token is defined in the dark `:root`, in `[data-theme="light"]`, and in the system-query block. Spacing, radius, type, motion and z-index tokens are theme-independent and live in `:root` only.

`--bg` doubles as the 3D canvas background. **The page background and `scene.background` must both resolve to `--bg`**: read the computed token when drawing, so the canvas never shows a seam in either theme.

Canvas drawing APIs do not accept CSS `var(--token)`. Before drawing, read each token with `getComputedStyle(document.documentElement).getPropertyValue('--name').trim()` and use the returned value in `ctx.font`, `fillStyle`, and `strokeStyle`. Re-read the tokens when the theme changes.

## Component classes

Use these classes instead of writing one-off selectors. Layout is still the
page's choice; only appearance is fixed here.

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: var(--font);
  font-size: var(--text-base);
  line-height: 1.5;
  background: var(--bg);
  color: var(--text);
}

h1, h2, h3 { font-weight: var(--font-weight-display); }
.panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-soft);
  padding: var(--space-4);
}
.panel-heading { font-size: var(--text-sm); color: var(--text-muted); margin-bottom: var(--space-2); }

.btn {
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  min-height: 44px;            /* never below 44px, mobile */
  min-width: 44px;
  padding: var(--space-3) var(--space-5);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  transition: background var(--motion), transform var(--motion), box-shadow var(--motion);
  box-shadow: 0 4px 0 var(--border);   /* keycap base */
}
.btn:hover { background: var(--panel); border-color: var(--accent); }
.btn:active { transform: translateY(4px); box-shadow: none; }
.btn:focus-visible { outline: none; box-shadow: var(--focus-ring), 0 4px 0 var(--border); }
.btn:disabled { opacity: 0.45; cursor: not-allowed; }

.btn-primary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--accent-text);
  box-shadow: 0 4px 0 color-mix(in srgb, var(--accent) 65%, var(--accent-text)), 0 0 16px color-mix(in srgb, var(--accent) 35%, transparent);
}
.btn-primary:hover { background: var(--accent-hover); border-color: var(--accent-hover); }

.btn-ghost { background: transparent; border-color: var(--border); color: var(--text); }
.btn-ghost:hover { background: var(--surface); }

.control-label {
  font-size: var(--text-caption);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
}

/* Arcade accents: decoration only, never behind small text. */
.panel-heading::before {
  content: '';
  display: inline-block;
  width: 8px; height: 8px;
  margin-right: var(--space-2);
  vertical-align: middle;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
}
.stage {
  min-height: 220px;
  background-color: var(--surface);
  background-image:
    linear-gradient(color-mix(in srgb, var(--border) 45%, transparent) 1px, transparent 1px),
    linear-gradient(90deg, color-mix(in srgb, var(--border) 45%, transparent) 1px, transparent 1px),
    radial-gradient(ellipse at 50% 70%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%);
  background-size: 32px 32px, 32px 32px, 100% 100%;
}
.readout { box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 15%, transparent); }
@media (prefers-reduced-motion: reduce) {
  .btn { transition: none; }
}

/* Icons (docs/adr/0022): inline Lucide SVG with currentColor, no external load.
   Only the start or run button and the reset button carry an icon. Keep the
   text label beside it. If script rewrites a button's label, put the label in
   a <span> so the icon survives. Paths: play and rotate-ccw in src/lib/icons.ts. */

input[type="range"] {
  width: 100%; height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border-strong);
  border-radius: var(--radius-pill);
  cursor: pointer;
}
input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px; height: 20px;
  background: var(--accent);
  border-radius: 50%;
  cursor: pointer;
}

/* Visually hidden but announced by screen readers. Use when a layout has no
   room for a visible <h1> (e.g. a full-bleed canvas) — never as an excuse to
   drop a heading. */
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap;
}

#feedback-panel {
  background: var(--surface);
  border-left: 3px solid var(--accent);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
}
#feedback-panel.success { border-left-color: var(--success); }
#feedback-panel.error { border-left-color: var(--error); }

.progress-track {
  height: 8px;
  background: var(--border-strong);
  border-radius: var(--radius-pill);
  overflow: hidden;
}
.mono-value { font-family: var(--font-mono); font-weight: var(--font-weight-number); }

.sources {
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--border);
}
.sources-heading {
  font-size: var(--text-caption);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: var(--space-2);
}
.source-item { font-size: var(--text-xs); color: var(--text-dim); margin-bottom: var(--space-1); }
.source-item a { color: var(--accent); text-decoration: none; }
.source-item a:hover { color: var(--accent-hover); text-decoration: underline; }

.reading-article {
  max-width: 720px;
  margin: 0 auto;
  line-height: 1.7;
}
.reading-article h2 { margin-top: var(--space-6); margin-bottom: var(--space-3); }
.reading-article h3 { margin-top: var(--space-5); margin-bottom: var(--space-2); }
.reading-article p, .reading-article ul, .reading-article ol, .reading-article table { margin-bottom: var(--space-4); }
.reading-article ul, .reading-article ol { padding-left: var(--space-5); }
.reading-article blockquote {
  border-left: 3px solid var(--border-strong);
  padding-left: var(--space-4);
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}
.reading-article img { max-width: 100%; border-radius: var(--radius-md); }
.reading-article code { font-family: var(--font-mono); font-size: var(--text-xs); background: var(--surface); padding: 2px 6px; border-radius: var(--radius-sm); }
.reading-article pre {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  overflow-x: auto;
  margin-bottom: var(--space-4);
}
.reading-article pre code { background: none; padding: 0; }
.reading-article table { width: 100%; border-collapse: collapse; }
.reading-article th, .reading-article td { border: 1px solid var(--border); padding: var(--space-2) var(--space-3); text-align: left; }
.reading-article details {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
}
.reading-article summary {
  cursor: pointer;
  font-weight: var(--font-weight-display);
  color: var(--text);
}
.reading-article details[open] summary { margin-bottom: var(--space-2); }
.glossary-term {
  text-decoration: underline dotted var(--text-dim);
  text-decoration-thickness: 1px;
  cursor: help;
}
.katex-display { margin: var(--space-4) 0; overflow-x: auto; }

/* highlight.js token colours — mapped to the token set, not a canned theme */
.hljs { color: var(--text); }
.hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-section, .hljs-link { color: var(--accent); }
.hljs-string, .hljs-title, .hljs-name, .hljs-type, .hljs-attribute, .hljs-symbol, .hljs-bullet, .hljs-addition, .hljs-variable, .hljs-template-tag, .hljs-template-variable { color: var(--success); }
.hljs-comment, .hljs-quote, .hljs-deletion, .hljs-meta { color: var(--text-dim); }
.hljs-number { color: var(--warning); }
```

Monospaced content (code editors, readouts, numeric values) uses
`var(--font-mono)`; numeric readouts also take `.mono-value` for the
`--font-weight-number` identity weight. Canvas- and SVG-drawn visuals follow
the same palette.

## What stays free

Layout, composition, and information density are chosen per scene. A step-card
board, a work-order desk, and a control panel are three legitimate
compositions — but they share this palette, spacing, type, and control
rendering. Vary the arrangement, never the visual language.

## Quality Checklist

Run this before returning any page.

- [ ] The full `:root` token block is present, unmodified, and the light block
      is present with every colour token defined.
- [ ] No hardcoded hex, rgba, or px colour/spacing values outside the token
      block and component classes. Anything new goes in this file first.
- [ ] Buttons, sliders, panels, and `#feedback-panel` use the component
      classes above, not bespoke selectors.
- [ ] Interactive targets are at least 44 × 44px.
- [ ] Keyboard focus is visible via `--focus-ring`.
- [ ] Text contrast is at least 4.5:1 for labels, headings, and buttons in both light and dark.
- [ ] Glow and shadow are decoration only; no glow sits behind small text.
- [ ] Reduced motion turns off button transitions.
- [ ] Only the start or run button and the reset button carry an icon.
- [ ] Existing ID conventions are unchanged (`{var}-slider`, `{action}-btn`,
      `node-{id}`, `#step-N-control`, `#feedback-panel`, zoom/reset IDs).
      Classes were added, not substituted.
- [ ] Page background and `scene.background` (3D only) both resolve to
      `--bg`, with no visible seam.
- [ ] The panel never covers the canvas at 320px width.
- [ ] Reset restores all state, progress, feedback, and control enablement. (`reading` scenes have no reset control and no state beyond native `<details>` open/closed — this item doesn't apply to them.)
- [ ] Exactly one `<!DOCTYPE html>`, no fences, no leftover `{{placeholder}}`.
- [ ] Page contract satisfied: `<html lang>` is the course's BCP-47 `lang`, `<title>` is `{sceneTitle} · {courseTitle}` (no placeholder like "3D Visualization" or "Untitled"), meta description present, OG tags present, no canonical/Twitter/favicon, and exactly one `<h1>` carrying the scene title (`.sr-only` is acceptable for full-bleed layouts).
- [ ] Inline CSS/JS only; fonts from the site's `/fonts/` with system fallbacks; libraries only from `unpkg.com` or `cdnjs.cloudflare.com`, each pinned to a version with `integrity` and `crossorigin="anonymous"` (docs/adr/0021); no fetch/XHR/WebSocket, no iframe/object/embed/form.
- [ ] If the scene carries `sources`, a `.sources` footer lists each one
      (title, publisher, date, linked url) and every sourced claim in the
      body text is attributed — no claim grounded in `sources` left bare.
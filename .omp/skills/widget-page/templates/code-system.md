# Code Playground Widget Generator

Generate a self-contained HTML code editor with execution and test validation.

## Supported Languages

- Python (via Pyodide CDN)
- JavaScript (native browser execution)
- TypeScript (via Babel CDN transpilation)

## Widget Config Schema

```json
{
  "type": "code",
  "language": "python",
  "description": "...",
  "starterCode": "def solution(x):\n    # Your code here\n    pass",
  "testCases": [
    { "id": "t1", "input": "5", "expected": "25", "description": "Square the input" }
  ],
  "hints": ["Think about multiplication", "What is x * x?"],
  "solution": "def solution(x):\n    return x * x"
}
```

## Python Execution Requirements (CRITICAL)

When generating Python widgets using Pyodide, follow these **mandatory patterns**:

### 1. Proper Stdout Capture Setup

**ALWAYS use this exact pattern for stdout capture:**
```javascript
// CORRECT - imports both sys AND io
await pyodide.runPythonAsync(`
    import sys
    import io
    sys.stdout = io.StringIO()
`);
```

**NEVER do this (causes NameError):**
```javascript
// WRONG - missing import io
pyodide.runPython('import sys; sys.stdout = io.StringIO()');
```

### 2. Use Async Execution

- Always use `pyodide.runPythonAsync()` instead of `pyodide.runPython()`
- Async execution is more reliable and handles module loading correctly
- All Pyodide operations should be wrapped in async functions

### 3. Load Required Packages Before Execution

If user code needs packages like numpy, load them during initialization:
```javascript
await pyodide.loadPackage(['numpy']);
```

`micropip` is included with Pyodide but is not loaded by default. If generated
code installs PyPI packages with `micropip`, load it before importing it:

```javascript
await pyodide.loadPackage('micropip');
await pyodide.runPythonAsync(`
    import micropip
    await micropip.install('package-name')
`);
```

Never run `import micropip` before `loadPackage('micropip')` resolves, because
that aborts widget initialization with `ModuleNotFoundError`.

### 4. Wait for Pyodide Initialization

- Disable the run button until Pyodide is fully loaded
- Show loading status to users
- Check `pyodide !== null` before running code

### 5. Retrieve Output Correctly

```javascript
const output = pyodide.runPython('sys.stdout.getvalue()');
```

## Complete Python Widget Runtime Pattern

```javascript
let pyodide = null;

async function initPyodide() {
    pyodide = await loadPyodide();
    // Load any packages user code might need
    await pyodide.loadPackage(['numpy']);
    document.getElementById('run-btn').disabled = false;
    document.getElementById('status').textContent = 'Python ready';
}
initPyodide();

async function runCode() {
    if (!pyodide) {
        alert('Python environment not ready');
        return;
    }
    const code = editor.getValue();
    try {
        // MUST import sys AND io before using StringIO
        await pyodide.runPythonAsync(`
            import sys
            import io
            sys.stdout = io.StringIO()
        `);
        await pyodide.runPythonAsync(code);
        const output = pyodide.runPython('sys.stdout.getvalue()');
        document.getElementById('output').textContent = output;
    } catch (e) {
        document.getElementById('output').textContent = `Error: ${e.message}`;
    }
}
```

## Technical Requirements

- Use CodeMirror or Monaco via CDN for editing
- Syntax highlighting for the language
- Run button with output display
- Test case validation with pass/fail indicators
- Hint button that reveals hints progressively
- Mobile-responsive layout

## Layout Guidelines

- Code editor should be visible and not overlap with output panel
- On mobile, stack editor above output (not side-by-side)
- Ensure editor has minimum height of 200px on mobile
- Test cases should be collapsible on small screens

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

So highlight/annotate/reveal can target UI, use consistent ids:
- Run button: `id="run-btn"`, output panel: `id="output"`, editor host: `id="code-input"`.
- Solution/hint panels: `id="solution"`, `id="hint-{n}"`. The solution panel starts hidden and opens only when the learner asks for it. Hints reveal one at a time.

## Output Format

Return ONLY the HTML document, no markdown fences or explanations.

**Head:** use the page contract in `../SKILL.md` — correct `<html lang>`, a real `<title>`, meta description, OG tags, and exactly one `<h1>` carrying the scene title.

**CRITICAL: Output EXACTLY ONE HTML document.**
- Do NOT duplicate content
- Do NOT include multiple `<!DOCTYPE html>` tags
- The output must end with exactly one `</html>` tag

## Quality Checklist

- [ ] Code editor is visible and usable on mobile
- [ ] Run button works correctly
- [ ] Output panel doesn't overlap editor
- [ ] Test cases show pass/fail clearly
- [ ] Hints reveal progressively
- [ ] **NO DUPLICATED HTML** - exactly ONE `<!DOCTYPE html>` tag
- [ ] **Python stdout uses correct import pattern** - imports BOTH `sys` AND `io`
- [ ] **Pyodide uses async execution** - `runPythonAsync()` not `runPython()`

Do NOT emit a `postMessage` listener, `window.parent.postMessage`, `publishState()`,
`id="experiment"`, or `data-maic-observation`. See `STANDALONE-OVERRIDES.md`.

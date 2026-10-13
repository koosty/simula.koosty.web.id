import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contentHeight } from '../src/lib/frame';

/**
 * A stand-in for the rectangle a laid-out element reports.
 */
interface Box {
  top: number;
  bottom: number;
  /** Absent means the ordinary static flow, which is the common case. */
  position?: string;
}

/**
 * The geometry the measurement has to get right, with the frame's own height
 * supplied so a measurement can be checked against the trap it exists to avoid.
 */
interface Scene {
  /** What each element in the simulation reports. Order is document order. */
  boxes: Box[];
  /** How tall the frame currently is. */
  frameHeight: number;
  /** How far the simulation is scrolled inside the frame. */
  scrolled?: number;
}

function measure(scene: Scene): number | null {
  return contentHeight({
    bodyHeight: scene.boxes[0]?.bottom ?? 0,
    elements: scene.boxes.slice(1).map((box) => ({
      top: box.top,
      bottom: box.bottom,
      position: box.position ?? 'static',
    })),
    // The frame's height is passed in so the measurement cannot read it back out
    // of the document it is measuring.
    frameHeight: scene.frameHeight,
    scrolled: scene.scrolled ?? 0,
  });
}

describe('contentHeight', () => {
  it('reports the height of the content, not the height of the frame', () => {
    // The trap this whole function exists to avoid: a frame given a height
    // makes the document inside it report that same height, so a measurement
    // that reads the document back would answer the frame's height and the
    // frame would then be set to the frame's height, forever.
    const content = 777;

    const measured = measure({
      frameHeight: 398,
      // A document stretched to its container reports the container's height;
      // the elements inside it are what say how tall the answer really is.
      boxes: [
        { top: 0, bottom: 398 },
        { top: 0, bottom: content },
      ],
    });

    expect(measured).toBe(content);
    expect(measured).not.toBe(398);
  });

  it('does not grow the frame because the frame grew', () => {
    // Two passes over the same content, after the frame has already been sized
    // to the first answer. A measurement that fed its own output back in would
    // return a larger number each time: 821, then 1116, then 1400.
    const boxes: Box[] = [
      { top: 0, bottom: 821 },
      { top: 0, bottom: 821 },
    ];

    const first = measure({ boxes, frameHeight: 400 });
    const second = measure({ boxes, frameHeight: first! });

    expect(first).toBe(821);
    expect(second).toBe(821);
  });

  it('is stable across a sweep of frame heights', () => {
    // The answer must depend only on the content. If any frame height changes
    // it, the page will drift on every reload.
    const boxes: Box[] = [
      { top: 0, bottom: 777 },
      { top: 0, bottom: 777 },
    ];

    const answers = [0, 100, 398, 400, 821, 1116, 3000].map((frameHeight) =>
      measure({ boxes, frameHeight }),
    );

    expect(new Set(answers).size).toBe(1);
    expect(answers[0]).toBe(777);
  });

  it('ignores a fixed element', () => {
    // A full-screen fixed panel is sized to the viewport, so counting it would
    // make the frame as tall as the window and the page would scroll forever.
    const measured = measure({
      frameHeight: 400,
      boxes: [
        { top: 0, bottom: 600 },
        { top: 0, bottom: 4000, position: 'fixed' },
      ],
    });

    expect(measured).toBe(600);
  });


  it('is never shorter than the content it wraps', () => {
    // The property that matters. Fractional heights come back from the browser
    // (820.796875 is a real reading), and a frame rounded down would clip the
    // last fraction of a pixel of content. `Math.ceil` is what guarantees the
    // frame is never the shorter of the two, so it is asserted as an inequality
    // rather than as an exact number: rounding is an implementation detail, the
    // invariant is not.
    const fractional = 820.796875;
    const measured = measure({
      frameHeight: 400,
      boxes: [
        { top: 0, bottom: fractional },
        { top: 0, bottom: fractional },
      ],
    });

    expect(measured).not.toBeNull();
    expect(measured!).toBeGreaterThanOrEqual(fractional);
    expect(Number.isInteger(measured!)).toBe(true);
  });
  it('adds back how far the simulation has been scrolled', () => {
    // Element bounds are viewport-relative. A reader who scrolls a simulation
    // must not have the frame shrink by the distance scrolled, which would cut
    // the bottom off the content they were reading.
    const measured = measure({
      frameHeight: 400,
      scrolled: 200,
      boxes: [
        { top: 0, bottom: 400 },
        // Scrolled up by 200: it now ends at 600, but it really ends at 800.
        { top: 0, bottom: 600 },
      ],
    });

    expect(measured).toBe(800);
  });

  it('counts content that overflows a short body', () => {
    // The body's own box is only a floor. A child can extend past it, and the
    // taller of the two is the answer.
    const measured = measure({
      frameHeight: 400,
      boxes: [
        { top: 0, bottom: 100 },
        { top: 100, bottom: 900 },
      ],
    });

    expect(measured).toBe(900);
  });

  it('reports nothing when there is no content', () => {
    expect(measure({ boxes: [], frameHeight: 400 })).toBeNull();
    expect(measure({ boxes: [{ top: 0, bottom: 0 }], frameHeight: 400 })).toBeNull();
  });

  it('ignores a zero-height element with no bottom edge', () => {
    // An empty element collapses to nothing and must not register.
    const measured = measure({
      frameHeight: 400,
      boxes: [
        { top: 0, bottom: 500 },
        { top: 500, bottom: 500 },
      ],
    });

    expect(measured).toBe(500);
  });
});
describe('the tool is told what a framing host can measure', () => {
  // The frame is sized from the bounding boxes of the simulation's elements, so
  // content that escapes them is content the frame cannot account for. That is a
  // property of the published files, not of this site, and this site never edits
  // them (docs/adr/0005). So the requirement is enforced where the files are
  // written, and these tests are here to notice if that stops being true.

  const TOOL = resolve(process.cwd(), '../simula-w/.omp/skills/widget-page');
  const SIMS = resolve(process.cwd(), 'example-simulations/lower-secondary/grade-7');

  it('asks the tool for pages that fit inside their own height', () => {
    // The tool is a separate checkout and may be absent — a reader checking out
    // this site alone still gets a working build. Skipped rather than failed,
    // because the site does not depend on the tool being present.
    if (!existsSync(TOOL)) return;
    const checklist = readFileSync(resolve(TOOL, 'templates/simulation-system.md'), 'utf8');
    expect(checklist).toMatch(/fits inside the document's own height/i);
  });

  it('explains the reason next to the rule that forbids a parent', () => {
    // The no-parent rule reads as "these pages are never displayed inside
    // another page", which is what made the constraint look contradictory. The
    // reason has to sit there or the next reader repeats the same mistake.
    if (!existsSync(TOOL)) return;
    const overrides = readFileSync(resolve(TOOL, 'STANDALONE-OVERRIDES.md'), 'utf8');
    expect(overrides).toMatch(/position: fixed/i);
    expect(overrides).toMatch(/iframe/i);
  });

  it('finds no simulation whose content escapes the frame', () => {
    // Checked as source text because that is all a test can see without a
    // browser. A full-screen fixed panel is the failure this exists to catch: it
    // is sized to the viewport, so counting it would make the frame as tall as
    // the window.
    const files = readdirSync(SIMS).filter((name) => name.endsWith('.html'));
    expect(files.length).toBeGreaterThan(0);

    // One simulation legitimately has a full-screen overlay. It is named here
    // rather than allowed through silently, so that removing the exemption is a
    // decision someone makes and can see.
    const ALLOWED = new Set(['tantangan-analisis-data.html']);

    const offenders = files.filter((name) => {
      if (ALLOWED.has(name)) return false;
      const css = readFileSync(resolve(SIMS, name), 'utf8');
      return /position\s*:\s*(fixed|sticky)/i.test(css);
    });

    expect(offenders, `escapes its own document height: ${offenders.join(', ')}`).toEqual([]);
  });
});

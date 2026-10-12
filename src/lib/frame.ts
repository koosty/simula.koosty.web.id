/**
 * Grow a frame to fit the simulation it holds.
 *
 * A simulation's height is not knowable at build time: measured across the 23
 * simulations, content height ranged from 670px to 1911px at the same viewport,
 * and moved by up to 578px within one simulation as the window narrowed. A
 * height chosen at build time is therefore wrong for either a phone or a
 * projector depending on which was measured, and a scrollbar inside the frame
 * hides part of the answer on a classroom projector.
 *
 * The measurement reads the rendered bounds of the child's own elements, never
 * the child's reported scroll height. A frame given a height makes the document
 * inside it report exactly that height, so the reading is circular and every
 * simulation would come back exactly as tall as the frame.
 *
 * Nothing here touches the simulation files. A library such as @iframe-resizer
 * would need a script injected into the child, which this project never does.
 */

/** The height the frame shows before anything has been measured. */
export const FALLBACK_HEIGHT = 400;

/**
 * The height the frame falls back to when the simulation cannot be measured.
 *
 * Tall enough to show a simulation that has not finished laying out, and fixed,
 * so an unmeasurable frame scrolls internally rather than collapsing to nothing
 * or rendering blank.
 */
export const UNMEASURABLE_HEIGHT = 1600;

/** Frame ids and the values the markup carries, so the script has no hardcoded paths. */
export const FRAME_ID = 'simulation-frame';
export const DATA_FALLBACK = 'data-fallback-height';
export const DATA_UNMEASURABLE = 'data-unmeasurable-height';

interface ResizeOptions {
  fallbackHeight: number;
  unmeasurableHeight: number;
}

/**
 * Attach the resizing to one frame.
 *
 * The frame starts small, so its own height cannot stretch the document being
 * measured, and grows to the measured height once that is known. Two things are
 * watched: the simulation's own document, which follows content that changes
 * during use in either direction, and the frame itself, which re-measures when
 * the width changes, since a simulation's height moves with the window.
 */
export function attachFrameResize(frame: HTMLIFrameElement, options: ResizeOptions): void {
  // A frame's document exists as soon as the element does, beginning life as
  // about:blank and reporting itself complete. Measuring that empty document
  // finds nothing, so a measurement only counts once the simulation has
  // actually loaded. Until then the frame stays at its small fallback, which
  // shows a loading frame rather than an empty box sized as if the content
  // were unreadable.
  let loaded = false;
  let observing = false;

  const measure = (): void => {
    if (!loaded) return;
    const height = measuredContentHeight(frame);
    if (height === null) {
      // Loaded but unreadable is a different situation from not loaded yet. A
      // tall fixed frame with internal scrolling then shows the simulation
      // rather than collapsing to nothing or rendering blank.
      frame.style.height = `${options.unmeasurableHeight}px`;
      return;
    }
    frame.style.height = `${Math.ceil(height)}px`;
    frame.dataset.measured = 'true';
  };

  const start = (): void => {
    loaded = true;
    if (observing) {
      measure();
      return;
    }
    observing = true;
    try {
      const doc = frame.contentDocument;
      if (doc?.body && doc.documentElement && typeof ResizeObserver === 'function') {
        new ResizeObserver(() => measure()).observe(doc.body);
        new ResizeObserver(() => measure()).observe(doc.documentElement);
      }
    } catch {
      // A cross-origin document cannot be observed. Same-origin is the only
      // case here, but a browser refusing access must not throw on the page.
    }
    measure();
  };

  // Width changes move a simulation's height by hundreds of pixels, so the
  // frame's own size is watched as well as the content's.
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(() => measure()).observe(frame);
  }
  window.addEventListener('resize', measure, { passive: true });

  // Registered unconditionally: a frame whose document already reports itself
  // complete is the empty one it was born with, not the simulation, and its
  // load event has not fired yet.
  frame.addEventListener('load', start);

  // Something has to show before the first measurement lands, whatever happens.
  frame.style.height = `${options.fallbackHeight}px`;
}

/**
 * The height of the simulation's own content, or null when it cannot be read.
 *
 * Taken from the bottom edge of the last rendered element rather than from any
 * height the document reports about itself, for the reason given above.
 *
 * Element bounds are measured against the viewport, so a simulation that has
 * been scrolled inside its frame reports them shifted up by however far it is
 * scrolled. Without adding that offset back, a reader who scrolls a simulation
 * makes the frame shrink by the distance scrolled and cuts the bottom off.
 */
export function measuredContentHeight(frame: HTMLIFrameElement): number | null {
  let doc: Document;
  try {
    const content = frame.contentDocument;
    if (!content || !content.body) return null;
    doc = content;
  } catch {
    return null;
  }

  const view = doc.defaultView;
  const scrolled = view?.scrollY ?? 0;

  // The body's own box is the floor: it is laid out to the full height of the
  // content even where a descendant overflows it.
  let height = doc.body.getBoundingClientRect().height;

  // A simulation that draws outside the flow, such as a fixed full-screen
  // panel, has its own bounds to include; a child reading its parent's height
  // back would otherwise be counted as taller than the content really is.
  for (const element of doc.body.querySelectorAll<HTMLElement>('body *')) {
    const style = view?.getComputedStyle(element);
    if (style && style.position === 'fixed') continue;
    const rect = element.getBoundingClientRect();
    if (rect.height > 0 || rect.bottom > 0) {
      height = Math.max(height, rect.bottom - Math.min(rect.top, 0) + scrolled);
    }
  }

  return height > 0 ? Math.ceil(height) : null;
}

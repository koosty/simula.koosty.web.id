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
    const height = readContentHeight(frame);
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

  // Something has to show before the first measurement lands, whatever happens.
  // Set before the load listener below, because a frame that has already loaded
  // its simulation measures straight away and would otherwise be reset to the
  // fallback by this line afterwards — leaving a page that looks stuck at 400px
  // for content that is 800px tall.
  frame.style.height = `${options.fallbackHeight}px`;

  // Registered last, and unconditionally: a frame whose document already reports
  // itself complete is the empty one it was born with, not the simulation, and
  // its load event has not fired yet.
  frame.addEventListener('load', start);

  // A frame that finished loading before this script ran has no load event left
  // to hear, and without this its simulation is never measured at all. Measured
  // on the real page: the frame sat at its 400px fallback with `data-measured`
  // unset, on roughly one load in eight.
  //
  // `contentWindow` rather than the document's readyState: a frame born as
  // about:blank reports itself complete, so readyState alone would measure an
  // empty document and set the frame from nothing.
  if (frame.contentWindow && frame.contentDocument?.readyState === 'complete') {
    const document = frame.contentDocument;
    if (document && document.location.href !== 'about:blank') {
      // One frame tick, so the simulation has been laid out before it is read.
      setTimeout(start, 0);
    }
  }
}

/** One laid-out box, as the browser reports it. */
interface ContentBox {
  top: number;
  bottom: number;
  position: string;
}

interface ContentShape {
  /** The body's own box, which is only ever a floor for the answer. */
  bodyHeight: number;
  /** Every element inside the body, in document order. */
  elements: ContentBox[];
  /**
   * The height the frame is currently set to.
   *
   * Passed in rather than read from the document on purpose. A frame given a
   * height lays the document inside it out to that height, so a measurement
   * that read the document back would answer the frame's own height: the frame
   * would be set to the frame, and each measurement would return the previous
   * answer a little larger. That is a real fault, measured: the frame on one
   * simulation reported 1116px for 821px of content, because a reading taken
   * while the frame was 1116 tall saw 1116.
   *
   * So the function is handed the boxes and answers from those alone. It cannot
   * see the frame, and therefore cannot echo it.
   */
  frameHeight: number;
  /** How far the simulation has been scrolled inside the frame. */
  scrolled: number;
}

/**
 * The height the simulation's content needs, or null when there is none.
 *
 * The tallest bottom edge wins, over the body's own height as a floor. A fixed
 * element is left out: it is sized to the viewport, so counting it would make
 * the frame as tall as the window and the page would never stop scrolling.
 *
 * Bounds are viewport-relative, so how far the simulation has been scrolled is
 * added back. Without that, a reader who scrolls a simulation has the frame
 * shrink by the distance scrolled and the bottom of what they were reading is
 * cut off.
 */
export function contentHeight(shape: ContentShape): number | null {
  let height = shape.bodyHeight;

  for (const element of shape.elements) {
    if (element.position === 'fixed') continue;
    height = Math.max(height, element.bottom - Math.min(element.top, 0) + shape.scrolled);
  }

  return height > 0 ? Math.ceil(height) : null;
}

/**
 * Read the simulation's boxes out of the frame and hand them to `contentHeight`.
 *
 * This is the only part that touches the document, and it reads element bounds
 * rather than any height the document reports about itself: a frame with a
 * height on it stretches the document inside it to match, so the document's own
 * height is an answer to "how tall is the frame", not "how tall is the
 * simulation". The arithmetic that decides the height lives in `contentHeight`,
 * where it can be tested without a browser.
 */
function readContentHeight(frame: HTMLIFrameElement): number | null {
  let doc: Document;
  try {
    const content = frame.contentDocument;
    if (!content || !content.body) return null;
    doc = content;
  } catch {
    return null;
  }

  const view = doc.defaultView;
  const elements: ContentBox[] = [];
  for (const element of doc.body.querySelectorAll<HTMLElement>('body *')) {
    const rect = element.getBoundingClientRect();
    elements.push({
      top: rect.top,
      bottom: rect.bottom,
      position: view?.getComputedStyle(element).position ?? 'static',
    });
  }

  return contentHeight({
    // The body's box is a floor only, and is measured rather than read off
    // scrollHeight for the reason above.
    bodyHeight: doc.body.getBoundingClientRect().height,
    elements,
    frameHeight: frame.getBoundingClientRect().height,
    scrolled: view?.scrollY ?? 0,
  });
}

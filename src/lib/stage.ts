import Lenis from "lenis";

/** Shared between the DOM and the WebGL layer. */
export const stage = {
  /** Set when the opening sequence hands off to the page; the model rises in then. */
  revealedAt: 0,
  lenis: null as Lenis | null,
  /** the 3D layer has loaded and compiled (or isn't running); the opening waits on it, briefly */
  sceneReady: false,
};

/**
 * Viewport and scroll position, sampled once per frame.
 * Everything reads these instead of touching window.scrollY / innerHeight itself,
 * so a frame costs one layout pass rather than one per component.
 */
export const view = { w: 0, h: 0, y: 0 };

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type NavX = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

/**
 * On data-saver or a 2G-class link, don't spend a megabyte on the model.
 * The page reads exactly the same without it.
 */
export function skipHeavyScene() {
  if (typeof navigator === "undefined") return false;
  const c = (navigator as NavX).connection;
  if (!c) return false;
  return Boolean(c.saveData) || c.effectiveType === "slow-2g" || c.effectiveType === "2g";
}

/**
 * Whether this machine renders WebGL on a real GPU. Without one (old office PCs, blocked
 * drivers, VMs, some Chromebooks) the browser draws 3D on the CPU, and a full-screen scene
 * starves the page so badly the opening never finishes. Those visitors get the page without
 * the model; nothing on it depends on the model.
 */
export function gpuAvailable() {
  try {
    const c = document.createElement("canvas");
    const opts = { failIfMajorPerformanceCaveat: true };
    const gl = (c.getContext("webgl2", opts) || c.getContext("webgl", opts)) as WebGLRenderingContext | null;
    if (!gl) return false;
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return !/swiftshader|llvmpipe|softpipe|basic render|software/i.test(renderer);
  } catch {
    return false;
  }
}

/**
 * A cautious opening guess at how much this machine can take; the live frame-rate
 * monitor corrects it either way. Deliberately not based on devicePixelRatio —
 * a 1x monitor is an ordinary desktop screen, not a slow computer.
 */
export function weakDevice() {
  if (typeof navigator === "undefined") return false;
  const n = navigator as NavX;
  return (n.hardwareConcurrency ?? 8) <= 4 || (n.deviceMemory ?? 8) <= 2;
}

/** Cap on render resolution: never more than the screen has, and less on weak hardware. */
export function startingDpr() {
  return Math.min(window.devicePixelRatio || 1, weakDevice() ? 1 : 1.75);
}

/**
 * The frame is split in two halves: everything that measures the page runs first,
 * then everything that changes it. Interleaving the two is what makes scrolling stutter.
 */
const readers = new Set<() => void>();
const writers = new Set<() => void>();

export function onRead(fn: () => void) {
  readers.add(fn);
  return () => readers.delete(fn);
}

export function onWrite(fn: () => void) {
  writers.add(fn);
  return () => writers.delete(fn);
}

/** Re-measure anything cached in document coordinates (resize, font swap, content change). */
const remeasurers = new Set<() => void>();
export function onRemeasure(fn: () => void) {
  remeasurers.add(fn);
  fn();
  return () => remeasurers.delete(fn);
}

function remeasure() {
  view.w = window.innerWidth;
  view.h = window.innerHeight;
  for (const fn of remeasurers) fn();
}

/**
 * respectReducedMotion is Lenis's default-on behaviour and it switches smooth scrolling
 * off completely. On Windows, turning off "Show animations" sets prefers-reduced-motion,
 * so a large share of visitors were getting raw, stepping wheel scroll instead of this.
 * Scrolling is motion the reader drives themselves, so it stays on; the genuine
 * reduced-motion accommodations (no idle drift, no blur, no travel) live in index.css.
 *
 * lerp was picked by measuring per-frame scroll deltas under a real wheel: 0.22 is the
 * flattest response, roughly half the frame-to-frame lurch of the old 0.07.
 */
const SCROLL = {
  anchors: true,
  respectReducedMotion: false,
  lerp: 0.22,
  wheelMultiplier: 1,
  touchMultiplier: 1.4,
};

export function startSmoothScroll() {
  // the opening sequence always plays from the top
  history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  const lenis = new Lenis(SCROLL);
  stage.lenis = lenis;
  // held still under the opening sequence; Intro releases it
  if (!document.documentElement.classList.contains("is-ready")) lenis.stop();

  view.w = window.innerWidth;
  view.h = window.innerHeight;
  view.y = 0;

  let raf = requestAnimationFrame(function loop(time) {
    const l = stage.lenis;
    if (l) {
      l.raf(time);
      // lenis.scroll is its own animated value, so reading it costs no layout
      view.y = l.scroll;
    }
    // measure everything, then change everything: one layout pass per frame
    for (const fn of readers) fn();
    for (const fn of writers) fn();
    raf = requestAnimationFrame(loop);
  });

  const ro = new ResizeObserver(remeasure);
  ro.observe(document.documentElement);
  window.addEventListener("resize", remeasure);
  window.addEventListener("orientationchange", remeasure);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    window.removeEventListener("resize", remeasure);
    window.removeEventListener("orientationchange", remeasure);
    lenis.destroy();
    stage.lenis = null;
  };
}

export function scrollToTop() {
  if (stage.lenis) stage.lenis.scrollTo(0);
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

/** 0 when the section's top meets the viewport top, 1 when its bottom meets the viewport bottom. */
export function pinnedProgress(top: number, height: number) {
  const span = height - view.h;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, (view.y - top) / span));
}

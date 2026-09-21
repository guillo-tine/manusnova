import Lenis from "lenis";

/** Shared between the DOM and the WebGL layer. */
export const stage = {
  /** Set when the opening sequence hands off to the page; the model rises in then. */
  revealedAt: 0,
  lenis: null as Lenis | null,
};

export const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function startSmoothScroll() {
  // the opening sequence always plays from the top
  history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  const lenis = new Lenis({ anchors: true, lerp: 0.07, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
  stage.lenis = lenis;
  let raf = requestAnimationFrame(function loop(time) {
    lenis.raf(time);
    raf = requestAnimationFrame(loop);
  });
  return () => {
    cancelAnimationFrame(raf);
    lenis.destroy();
    stage.lenis = null;
  };
}

export function scrollToTop() {
  if (stage.lenis) stage.lenis.scrollTo(0);
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

/** 0 at the moment el's top meets the viewport top, 1 when its bottom meets the viewport bottom. */
export function pinnedProgress(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const span = r.height - window.innerHeight;
  if (span <= 0) return 0;
  return Math.min(1, Math.max(0, -r.top / span));
}

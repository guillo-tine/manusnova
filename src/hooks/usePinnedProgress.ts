import { useEffect, useRef } from "react";
import { onRemeasure, onWrite, pinnedProgress } from "@/lib/stage";

/**
 * Writes the pinned-scroll progress of the returned ref's element into the CSS var --p.
 * The element's box is measured only when the layout changes, so scrolling stays
 * pure arithmetic and never forces the browser to recompute layout.
 */
export function usePinnedProgress<T extends HTMLElement>(onProgress?: (p: number) => void) {
  const ref = useRef<T>(null);
  const cb = useRef(onProgress);
  cb.current = onProgress;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const box = { top: 0, height: 0 };
    let last = -1;

    const stopMeasure = onRemeasure(() => {
      const r = el.getBoundingClientRect();
      box.top = r.top + window.scrollY;
      box.height = r.height;
      last = -1;
    });

    const stopWrite = onWrite(() => {
      const p = pinnedProgress(box.top, box.height);
      if (Math.abs(p - last) < 0.0005) return;
      last = p;
      el.style.setProperty("--p", p.toFixed(4));
      cb.current?.(p);
    });

    return () => {
      stopMeasure();
      stopWrite();
    };
  }, []);

  return ref;
}

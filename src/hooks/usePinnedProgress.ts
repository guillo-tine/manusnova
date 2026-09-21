import { useEffect, useRef } from "react";
import { pinnedProgress } from "@/lib/stage";

/** Writes the pinned-scroll progress of the returned ref's element into the CSS var --p. */
export function usePinnedProgress<T extends HTMLElement>(onProgress?: (p: number) => void) {
  const ref = useRef<T>(null);
  const cb = useRef(onProgress);
  cb.current = onProgress;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = -1;
    const update = () => {
      const p = pinnedProgress(el);
      if (Math.abs(p - last) < 0.0005) return;
      last = p;
      el.style.setProperty("--p", p.toFixed(4));
      cb.current?.(p);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return ref;
}

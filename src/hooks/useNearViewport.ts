import { useEffect, useRef, useState } from "react";

/**
 * True once the element approaches the viewport (rootMargin pre-loads),
 * false again when it leaves — used to mount/unmount WebGL canvases so
 * only the visible one holds a GL context.
 */
export function useNearViewport<T extends HTMLElement>(margin = "400px") {
  const ref = useRef<T>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setNear(entry.isIntersecting),
      { rootMargin: margin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [margin]);

  return { ref, near };
}

import { useEffect, useState } from "react";
import { stage } from "@/lib/stage";

const HOLD_MS = 1500;
const FONT_WAIT_MS = 900;
/** after the hold, wait at most this long for the 3D to be ready, so it never stutters the reveal */
const SCENE_WAIT_MS = 1600;

/** The opening beat: the name alone on black, then it clears and the page arrives. */
const Intro = () => {
  const [phase, setPhase] = useState<"wait" | "name" | "leaving" | "gone">("wait");

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let cancelled = false;
    // show the name only once its typeface is in, so it never swaps mid-animation
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, FONT_WAIT_MS))]).then(() => {
      if (cancelled) return;
      setPhase("name");
      const reveal = () => {
        if (cancelled) return;
        stage.revealedAt = performance.now();
        document.documentElement.classList.add("is-ready");
        stage.lenis?.start();
        setPhase("leaving");
        timers.push(setTimeout(() => setPhase("gone"), 1100));
      };
      timers.push(
        setTimeout(() => {
          const deadline = performance.now() + SCENE_WAIT_MS;
          const check = () => {
            if (stage.sceneReady || performance.now() >= deadline) reveal();
            else timers.push(setTimeout(check, 50));
          };
          check();
        }, HOLD_MS)
      );
    });
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  if (phase === "gone") return null;
  return (
    <>
      {/* Shader warm-up. The first gradient-filled numerals on the page make the GPU compile
          a shader, which hitched scrolling by ~150ms wherever they first appeared. Drawn here,
          fully covered by the opaque opening screen, that cost is paid while there is nothing
          to look at. Removed before the opening fades, so it is never seen. */}
      {phase !== "leaving" && (
        <div className="fixed left-0 top-0 z-[99] pointer-events-none select-none" aria-hidden="true">
          <p className="free-word font-semibold tracking-[-0.06em] leading-[0.9] text-[clamp(5rem,13vw,12rem)]">35</p>
          <p className="free-word font-semibold tracking-[-0.06em] leading-[0.9] text-[clamp(4.25rem,9.5vw,8.25rem)]">Nothing.</p>
        </div>
      )}
      <div className={`intro ${phase === "leaving" ? "intro-leaving" : ""}`} aria-hidden="true">
        {phase !== "wait" && <p className="intro-name">manus nova.</p>}
      </div>
    </>
  );
};

export default Intro;

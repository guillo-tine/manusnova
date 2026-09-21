import { useEffect, useState } from "react";
import { stage } from "@/lib/stage";

const HOLD_MS = 1500;
const FONT_WAIT_MS = 900;

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
      timers.push(
        setTimeout(() => {
          stage.revealedAt = performance.now();
          document.documentElement.classList.add("is-ready");
          stage.lenis?.start();
          setPhase("leaving");
        }, HOLD_MS),
        setTimeout(() => setPhase("gone"), HOLD_MS + 1100)
      );
    });
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  if (phase === "gone") return null;
  return (
    <div className={`intro ${phase === "leaving" ? "intro-leaving" : ""}`} aria-hidden="true">
      {phase !== "wait" && <p className="intro-name">manus nova.</p>}
    </div>
  );
};

export default Intro;

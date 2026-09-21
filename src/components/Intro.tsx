import { useEffect, useState } from "react";
import { stage } from "@/lib/stage";

const HANDOFF_MS = 1500;

/** The opening beat: the name alone on black, then it clears and the page arrives. */
const Intro = () => {
  const [phase, setPhase] = useState<"name" | "leaving" | "gone">("name");

  useEffect(() => {
    const root = document.documentElement;
    const handoff = setTimeout(() => {
      stage.revealedAt = performance.now();
      root.classList.add("is-ready");
      setPhase("leaving");
    }, HANDOFF_MS);
    const done = setTimeout(() => setPhase("gone"), HANDOFF_MS + 1100);
    return () => {
      clearTimeout(handoff);
      clearTimeout(done);
    };
  }, []);

  if (phase === "gone") return null;
  return (
    <div className={`intro ${phase === "leaving" ? "intro-leaving" : ""}`} aria-hidden="true">
      <p className="intro-name">manus nova.</p>
    </div>
  );
};

export default Intro;

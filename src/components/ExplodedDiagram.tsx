import { useEffect, useRef, useState } from "react";
import diagram from "@/assets/exploded-diagram.webp";

type Part = {
  id: string;
  name: string;
  blurb: string;
  /** hotspot center, % of image width / height */
  x: number;
  y: number;
};

const parts: Part[] = [
  {
    id: "tensioner",
    name: "Tensioner",
    blurb: "Five pins hold the finger cords, and each screw fine-tunes one finger's resting grip.",
    x: 14.5,
    y: 48,
  },
  {
    id: "gauntlet",
    name: "Arm guard",
    blurb: "Thermoformed after printing to match the wearer's forearm. It anchors the whole device.",
    x: 36,
    y: 47,
  },
  {
    id: "wrist",
    name: "Wrist pins",
    blurb: "The hinge axis. The hand has no motors; bending the wrist is what closes the fingers.",
    x: 46.5,
    y: 51,
  },
  {
    id: "palm",
    name: "Palm",
    blurb: "The chassis. Cords from every fingertip route through channels here down to the tensioner.",
    x: 56,
    y: 47,
  },
  {
    id: "thumb",
    name: "Thumb",
    blurb: "Same cord and elastic as the fingers, set at an angle so the hand can pinch and hold.",
    x: 57,
    y: 79,
  },
  {
    id: "knuckles",
    name: "Knuckle pins",
    blurb: "Snap-in hinges that let each finger segment curl in sequence as the cords pull.",
    x: 69.5,
    y: 45,
  },
  {
    id: "phalanges",
    name: "Proximal phalanges",
    blurb: "The lower finger segments. They take the cord tension first, so the curl looks natural.",
    x: 76,
    y: 48,
  },
  {
    id: "fingertips",
    name: "Fingertips",
    blurb: "Nylon cord underneath pulls them closed; elastic on top springs them open again.",
    x: 88.5,
    y: 45,
  },
];

const CYCLE_MS = 3400;

/**
 * The real e-NABLE exploded sheet with clickable part hotspots.
 * On touch devices the callouts cycle themselves; tapping still works.
 */
const ExplodedDiagram = () => {
  const [active, setActive] = useState(3); // start on the palm, the center of the story
  const [touched, setTouched] = useState(false);
  const figRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = figRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      threshold: 0.35,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-cycle on touch devices only, and stop for good once the user taps
  useEffect(() => {
    if (touched || !inView) return;
    if (!window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setActive((a) => (a + 1) % parts.length), CYCLE_MS);
    return () => clearInterval(timer);
  }, [touched, inView]);

  const pick = (i: number) => {
    setTouched(true);
    setActive(i);
  };

  return (
    <figure ref={figRef}>
      <div className="border border-ink/10 bg-sheet">
        <div className="relative">
          <img
            src={diagram}
            alt="Exploded view of the e-NABLE Phoenix Hand v3 showing every 3D-printed part"
            className="w-full h-auto block"
            loading="eager"
          />
          {parts.map((part, i) => (
            <button
              key={part.id}
              className="hotspot"
              style={{ left: `${part.x}%`, top: `${part.y}%` }}
              data-active={i === active}
              aria-label={part.name}
              aria-pressed={i === active}
              onClick={() => pick(i)}
            />
          ))}
        </div>
        <div className="border-t border-ink/10 px-4 sm:px-6 py-4 min-h-[5.5rem] sm:min-h-[4.5rem]">
          <p className="text-sm sm:text-base leading-relaxed">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-clay mr-3">
              {parts[active].name}
            </span>
            <span className="text-stone">{parts[active].blurb}</span>
          </p>
        </div>
      </div>
      <figcaption className="fig-label mt-3">
        Fig. 1 · Phoenix Hand v3, exploded view · e-NABLE open-source design
      </figcaption>
    </figure>
  );
};

export default ExplodedDiagram;

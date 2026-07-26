import { Suspense, lazy, useState } from "react";
import { useNearViewport } from "@/hooks/useNearViewport";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import ErrorBoundary from "@/components/ErrorBoundary";
import montage from "@/assets/build-montage.webp";

const ModelViewport = lazy(() => import("@/components/three/ModelViewport"));

const ViewportNotice = ({ text }: { text: string }) => (
  <div className="w-full h-full flex items-center justify-center px-6 text-center">
    <p className="fig-label">{text}</p>
  </div>
);

const steps = ["Measure", "Print", "Assemble", "Deliver"];

const Process = () => {
  const intro = useScrollReveal(0.3);
  const figures = useScrollReveal(0.1);
  const [expanded, setExpanded] = useState(false);
  const viewport = useNearViewport<HTMLDivElement>();

  return (
    <section id="process" className="border-t border-ink/10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div ref={intro.ref} className={`reveal ${intro.visible ? "visible" : ""}`}>
          <p className="fig-label mb-6">02 · How it's built</p>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-tight max-w-2xl">
            Measured, printed, and assembled by hand.
          </h2>
          <p className="mt-5 text-base sm:text-lg text-stone leading-relaxed max-w-xl">
            Each device starts with the recipient's measurements. The parts print overnight
            in PLA, students assemble and tension them after school, and the finished hand
            is fitted in person. Thirty steps, start to finish.
          </p>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
            {steps.map((step, i) => (
              <span key={step}>
                <span className="text-stone mr-1.5">{String(i + 1).padStart(2, "0")}</span>
                {step}
                {i < steps.length - 1 && <span className="mx-3 text-stone">·</span>}
              </span>
            ))}
          </p>
        </div>

        <div
          ref={figures.ref}
          className={`reveal-rows ${figures.visible ? "visible" : ""} mt-10 sm:mt-12 space-y-10 sm:space-y-12`}
        >
          {/* Fig. 2: the real assembly sheet, cropped to one working band */}
          <figure>
            <button
              onClick={() => setExpanded((open) => !open)}
              className="block w-full border border-ink/10 bg-sheet text-left"
              aria-expanded={expanded}
              aria-label={expanded ? "Collapse assembly sheet" : "Expand assembly sheet"}
            >
              {expanded ? (
                <img
                  src={montage}
                  alt="All thirty assembly steps of the Phoenix Hand, photographed"
                  className="w-full h-auto block"
                />
              ) : (
                <div className="aspect-[4/1] sm:aspect-[7/1] overflow-hidden">
                  <img
                    src={montage}
                    alt="Assembly steps of the Phoenix Hand, photographed"
                    className="w-full h-full object-cover [object-position:50%_56%]"
                  />
                </div>
              )}
            </button>
            <figcaption className="fig-label mt-3">
              Fig. 2 · Assembly sequence, 30 steps · e-NABLE ·{" "}
              <span className="text-clay">{expanded ? "Click to collapse" : "Click to expand"}</span>
            </figcaption>
          </figure>

          {/* Fig. 3: the printable model itself */}
          <figure>
            <div ref={viewport.ref} className="border border-ink/10 bg-sheet h-[380px] sm:h-[480px]">
              {viewport.near && (
                <ErrorBoundary fallback={<ViewportNotice text="Model preview unavailable in this browser" />}>
                  <Suspense fallback={<ViewportNotice text="Loading model…" />}>
                    <ModelViewport />
                  </Suspense>
                </ErrorBoundary>
              )}
            </div>
            <figcaption className="fig-label mt-3">
              Fig. 3 · Phoenix Hand v3, printable model · Drag to rotate
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
};

export default Process;

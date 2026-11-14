import { useRef } from "react";
import { usePinnedProgress } from "@/hooks/usePinnedProgress";
import { DONATE_MAILTO } from "@/lib/links";
import { Count, Mission, Process } from "@/components/About";

const HONESTY =
  "These are the parts of our own hand. We designed it and tested it ourselves, to the standard we'd want for someone in our family. Then we print every piece, assemble it by hand, fit it in person, and give it away.";

/** Pinned while each word brightens in turn as the reader scrolls. */
const Honesty = () => {
  const words = useRef<HTMLSpanElement[]>([]);
  const shown = useRef<number[]>([]);
  const list = HONESTY.split(" ");
  const scene = usePinnedProgress<HTMLElement>((p) => {
    const lit = Math.min(1, p / 0.8) * list.length;
    words.current.forEach((w, i) => {
      const o = Math.round(Math.min(1, Math.max(0.18, lit - i + 0.18)) * 100) / 100;
      if (w && shown.current[i] !== o) {
        shown.current[i] = o;
        w.style.opacity = String(o);
      }
    });
  });

  return (
    <section ref={scene} data-pose="design" className="relative h-[220svh]">
      <div className="sticky top-0 h-[100svh] pt-[76px] pb-[8svh] md:py-0">
        <div className="h-full w-full max-w-[1120px] mx-auto px-6 flex flex-col md:grid md:grid-cols-2 md:items-center">
          <div data-slot className="flex-1 min-h-0 mb-[4svh] md:hidden" />
          <div className="md:pr-8">
            <h2 className="text-[clamp(1.1rem,1.6vw,1.4rem)] font-semibold tracking-[-0.01em] text-clay">
              Designed, tested, and printed by us.
            </h2>
            <p className="mt-4 text-[clamp(1.5rem,2.5vw,2.35rem)] font-semibold tracking-[-0.03em] leading-[1.18]">
              {list.map((w, i) => (
                <span
                  key={i}
                  ref={(el) => {
                    if (el) words.current[i] = el;
                  }}
                  className="word"
                >
                  {w}{" "}
                </span>
              ))}
            </p>
          </div>
          <div data-slot className="hidden md:block h-[70svh]" />
        </div>
      </div>
    </section>
  );
};

const Free = () => (
  <section id="free" data-pose="free" className="relative h-[100svh] min-h-[640px] pt-[76px] pb-[8svh] md:py-0">
    <div className="h-full w-full max-w-[1120px] mx-auto px-6 flex flex-col md:grid md:grid-cols-2 md:items-center">
      <div data-slot className="flex-1 min-h-0 mb-[4svh] md:mb-0 md:h-[70svh]" />
      <div className="md:pl-8" data-reveal>
        <h2 className="text-[clamp(1.1rem,1.6vw,1.4rem)] font-semibold tracking-[-0.01em] text-clay">
          What it costs the person who wears it
        </h2>
        <p className="free-word mt-1 text-[clamp(4.25rem,9.5vw,8.25rem)] font-semibold tracking-[-0.06em] leading-[0.9]">
          Nothing.
        </p>
        <p className="mt-6 max-w-[26rem] text-[clamp(1.05rem,1.4vw,1.3rem)] leading-[1.45] tracking-[-0.015em] text-stone">
          Materials run about $30 a hand. Donations cover that, so the recipient never pays
          and never will.
        </p>
        <a href={DONATE_MAILTO} className="link-arrow mt-7 inline-block">
          Donate
        </a>
      </div>
    </div>
  </section>
);

const Story = () => (
  <>
    <Honesty />
    <Mission />
    <Count />
    <Process />
    <Free />
  </>
);

export default Story;

import { openRequestSheet } from "@/components/RequestSheet";
import { usePinnedProgress } from "@/hooks/usePinnedProgress";

/** Pinned for two screens: the headline holds, then lifts away while the parts keep turning. */
const Hero = () => {
  const scene = usePinnedProgress<HTMLElement>();

  return (
    <section ref={scene} data-pose="hero" className="relative h-[190svh]">
      <div className="hero-copy sticky top-0 h-[100svh] flex flex-col items-center text-center px-6 pt-[76px] pb-[10svh]">
        <div data-slot className="flex-1 min-h-0 w-full max-w-[1120px] mb-[4svh]" />
        <p className="rise rise-1 text-[clamp(1.1rem,1.6vw,1.5rem)] font-semibold tracking-[-0.01em] text-clay">
          manus nova.
        </p>
        <h1 className="mt-2 text-[clamp(2.9rem,7vw,6rem)] font-semibold tracking-[-0.045em] leading-[1.02]">
          <span className="mask"><span className="rise rise-2">Prosthetic hands,</span></span>
          <span className="mask"><span className="rise rise-3">printed and given away.</span></span>
        </h1>
        <div className="rise rise-4 mt-8 flex items-center gap-7">
          <button onClick={openRequestSheet} className="btn-primary">
            Request a device
          </button>
          <a href="#free" className="link-arrow">
            How it's paid for
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;

import ExplodedDiagram from "@/components/ExplodedDiagram";
import { REQUEST_MAILTO, DONATE_MAILTO } from "@/lib/links";

const Hero = () => (
  <header className="max-w-6xl mx-auto px-5 sm:px-8 pt-8 sm:pt-10 pb-16 sm:pb-24">
    <div className="flex items-baseline justify-between mb-14 sm:mb-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink font-medium">
        Manus Nova
      </p>
      <p className="fig-label">Bronx, NY · Est. 2023</p>
    </div>

    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.04] max-w-4xl">
      Free 3D-printed prosthetics, built by students.
    </h1>

    <p className="mt-6 text-base sm:text-lg text-stone leading-relaxed max-w-xl">
      A student nonprofit at The Bronx High School of Science. Every device is designed,
      printed, assembled, and delivered at no cost to the recipient.
    </p>

    <div className="mt-8 sm:mt-10 flex items-center gap-7">
      <a href={REQUEST_MAILTO} className="btn-primary">
        Request a device
      </a>
      <a href={DONATE_MAILTO} className="link-quiet text-sm sm:text-base">
        Donate
      </a>
    </div>

    <div className="mt-16 sm:mt-24">
      <ExplodedDiagram />
    </div>
  </header>
);

export default Hero;

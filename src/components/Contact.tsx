import { openRequestSheet } from "@/components/RequestSheet";
import { EMAIL, INSTAGRAM } from "@/lib/links";

const Contact = () => (
  <section
    id="request"
    data-pose="request"
    className="relative h-[100svh] min-h-[640px] flex flex-col items-center text-center px-6 pt-[76px] pb-[12svh]"
  >
    <div data-slot className="flex-1 min-h-0 w-full max-w-[720px] mb-[4svh]" />
    <div data-reveal className="flex flex-col items-center">
    <h2 className="text-[clamp(2.6rem,5.6vw,4.75rem)] font-semibold tracking-[-0.04em] leading-[1.0]">
      Need a hand?
    </h2>
    <p className="mt-5 max-w-[32rem] text-[clamp(1.05rem,1.5vw,1.3rem)] leading-[1.5] tracking-[-0.01em] text-stone text-balance">
      Tell us who it's for. A student replies within a day or two, fittings are free, and a
      build takes two to four weeks.
    </p>
    <button onClick={openRequestSheet} className="btn-primary mt-8">
      Request a device
    </button>
    <p className="mt-8 text-sm text-stone">
      <a href={`mailto:${EMAIL}`} className="link-quiet">
        {EMAIL}
      </a>
      <span className="mx-2.5">·</span>
      <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="link-quiet">
        Instagram
      </a>
    </p>
    </div>
  </section>
);

export default Contact;

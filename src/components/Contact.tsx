import { useScrollReveal } from "@/hooks/useScrollReveal";
import { openRequestSheet } from "@/components/RequestSheet";
import { EMAIL, DONATE_MAILTO, INSTAGRAM } from "@/lib/links";

const Contact = () => {
  const block = useScrollReveal(0.3);

  return (
    <section id="contact" className="border-t border-ink/10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div ref={block.ref} className={`reveal ${block.visible ? "visible" : ""}`}>
          <p className="fig-label mb-6">05 · Request</p>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-tight max-w-2xl">
            Need a hand, or know someone who does?
          </h2>
          <p className="mt-5 text-base sm:text-lg text-stone leading-relaxed max-w-xl">
            Write to us. A student answers within a day or two, fittings are free, and a
            typical build takes two to four weeks. The price never changes.
          </p>

          <div className="mt-7 flex items-center gap-7">
            <button onClick={openRequestSheet} className="btn-primary">
              Request a device
            </button>
            <a href={DONATE_MAILTO} className="link-quiet text-sm sm:text-base">
              Donate
            </a>
          </div>

          <p className="mt-8 text-sm text-stone">
            Or email us directly at{" "}
            <a href={`mailto:${EMAIL}`} className="link-quiet underline text-ink break-all">
              {EMAIL}
            </a>{" "}
            · Follow the work at{" "}
            <a
              href={INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              className="link-quiet underline text-ink"
            >
              @projectmanusnova
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Contact;

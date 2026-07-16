import { useScrollReveal } from "@/hooks/useScrollReveal";
import { DONATE_MAILTO } from "@/lib/links";

const figures = [
  { value: "4", label: "devices delivered" },
  { value: "5", label: "student engineers" },
  { value: "4", label: "lives changed" },
];

const Zero = () => {
  const block = useScrollReveal(0.3);

  return (
    <section id="output" className="border-t border-ink/10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div ref={block.ref} className={`reveal ${block.visible ? "visible" : ""}`}>
          <p className="fig-label mb-4">03 · What a recipient pays</p>
          <p className="font-semibold tracking-tight leading-none text-clay text-[clamp(7rem,26vw,19rem)]">
            $0
          </p>
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4">
            {figures.map((fig) => (
              <p key={fig.label} className="text-sm sm:text-base">
                <span className="font-semibold text-ink mr-2">{fig.value}</span>
                <span className="text-stone">{fig.label}</span>
              </p>
            ))}
          </div>
          <p className="mt-8 text-base sm:text-lg text-stone leading-relaxed max-w-xl">
            Materials run about $30 a hand. Donations cover it, so recipients never do.{" "}
            <a href={DONATE_MAILTO} className="link-quiet underline text-ink">
              Donate
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Zero;

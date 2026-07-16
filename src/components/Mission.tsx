import { useScrollReveal } from "@/hooks/useScrollReveal";

const Mission = () => {
  const block = useScrollReveal(0.3);

  return (
    <section id="mission" className="border-t border-ink/10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div ref={block.ref} className={`reveal ${block.visible ? "visible" : ""}`}>
          <p className="fig-label mb-6">01 · Why</p>
          <p className="text-2xl sm:text-4xl font-medium tracking-tight leading-snug max-w-3xl">
            A prosthetic hand can cost thousands of dollars, and a child outgrows one in about
            a year. We print ours from an open-source design for roughly $30 in materials,
            assemble them by hand after school, and give them away.{" "}
            <span className="text-stone">
              The cost of a hand should never be the reason someone goes without one.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Mission;

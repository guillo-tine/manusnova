import { useScrollReveal } from "@/hooks/useScrollReveal";
import { JOIN_MAILTO } from "@/lib/links";

const crew = ["Louis Gui", "Lucas Zelenski", "Rishi Kothuru", "Anthony Hur", "Sithaara Nair"];

const alumni = [
  { name: "Joel John", dest: "Yale" },
  { name: "Abhinav Akella", dest: "UPenn" },
  { name: "Aaron Krasinski", dest: "MIT" },
  { name: "Jaman Mahamud", dest: "Columbia" },
  { name: "Krish Bhal", dest: "Macaulay Honors" },
  { name: "Ethan Thai", dest: "Stony Brook" },
];

const Team = () => {
  const block = useScrollReveal(0.15);

  return (
    <section id="team" className="border-t border-ink/10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        <div ref={block.ref} className={`reveal-rows ${block.visible ? "visible" : ""}`}>
          <p className="fig-label mb-6">04 · Who</p>

          <div>
            {crew.map((name) => (
              <p
                key={name}
                className="text-3xl sm:text-5xl font-semibold tracking-tight leading-snug"
              >
                {name}
              </p>
            ))}
          </div>

          <p className="mt-6 text-stone text-sm sm:text-base">
            Students at The Bronx High School of Science. There is room for one more name
            here.{" "}
            <a href={JOIN_MAILTO} className="link-quiet underline text-ink">
              Apply
            </a>
          </p>

          <div className="mt-10">
            <p className="fig-label mb-4">Alumni · Class of 2026</p>
            <p className="text-sm sm:text-base leading-relaxed max-w-2xl">
              {alumni.map((person, i) => (
                <span key={person.name} className="whitespace-nowrap">
                  <span className="text-ink font-medium">{person.name}</span>
                  <span className="text-stone">, {person.dest}</span>
                  {i < alumni.length - 1 && <span className="text-stone mx-2">·</span>}
                </span>
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Team;

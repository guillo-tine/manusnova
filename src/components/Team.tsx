import { JOIN_MAILTO } from "@/lib/links";

const crew = [
  "Louis Gui",
  "Lucas Zelenski",
  "Rishi Kothuru",
  "Anthony Hur",
  "Sithaara Nair",
  "Aldrich Zheng",
  "Sadek Nabil",
];

const alumni = [
  { name: "Joel John", dest: "Yale" },
  { name: "Abhinav Akella", dest: "UPenn" },
  { name: "Aaron Krasinski", dest: "MIT" },
  { name: "Jaman Mahamud", dest: "Columbia" },
  { name: "Krish Bhal", dest: "Macaulay Honors" },
  { name: "Ethan Thai", dest: "Stony Brook" },
];

const Team = () => (
  <section id="team" data-pose="team" className="relative py-[16svh]">
    {/* the model sits in the right half while the names scroll past; on phones it dims behind them */}
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div data-slot className="sticky top-[52px] h-[calc(100svh-52px)] md:ml-[50%]" />
    </div>
    <div className="relative w-full max-w-[1120px] mx-auto px-6 grid md:grid-cols-2">
      <div className="md:pr-8">
        <h2 data-reveal className="text-[clamp(2.4rem,5vw,4.25rem)] font-semibold tracking-[-0.035em] leading-[1.02] text-balance">
          The students printing them.
        </h2>

        <ul data-reveal-stagger className="mt-10 space-y-1">
          {crew.map((name) => (
            <li
              key={name}
              className="text-[clamp(1.5rem,2.6vw,2.1rem)] font-medium tracking-[-0.025em] leading-[1.3]"
            >
              {name}
            </li>
          ))}
        </ul>

        <div data-reveal>
        <p className="mt-12 text-sm text-stone">Alumni, class of 2026</p>
        <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 text-[15px]">
          {alumni.map((person) => (
            <li key={person.name}>
              <span className="text-ink">{person.name}</span>
              <span className="text-stone"> · {person.dest}</span>
            </li>
          ))}
        </ul>

        <a href={JOIN_MAILTO} className="link-arrow mt-12 inline-block">
          Join the team
        </a>
        </div>
      </div>
    </div>
  </section>
);

export default Team;

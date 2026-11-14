import { openRequestSheet } from "@/lib/requestSheet";

/** The model fades out behind the reading sections; this is the box it fades in. */
const QuietSlot = () => (
  <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
    <div data-slot className="sticky top-[52px] h-[calc(100svh-52px)] md:ml-[50%]" />
  </div>
);

const eyebrow = "text-[clamp(1.1rem,1.6vw,1.4rem)] font-semibold tracking-[-0.01em] text-clay";
const heading = "text-[clamp(2.4rem,5vw,4.25rem)] font-semibold tracking-[-0.035em] leading-[1.02] text-balance";
const body = "text-[clamp(1.05rem,1.4vw,1.3rem)] leading-[1.5] tracking-[-0.015em] text-stone";

export const Mission = () => (
  <section id="mission" data-pose="quiet" className="relative py-[18svh]">
    <QuietSlot />
    <div className="relative w-full max-w-[1120px] mx-auto px-6">
      <div data-reveal="quiet" className="max-w-[44rem]">
        <h2 className={eyebrow}>Our mission</h2>
        <p className={`${heading} mt-3`}>A working hand shouldn't depend on what you can afford.</p>
        <p className={`${body} mt-8 max-w-[36rem]`}>
          A conventional prosthetic hand can cost thousands of dollars. For a lot of families, that
          puts one out of reach.
        </p>
        <p className={`${body} mt-5 max-w-[36rem]`}>
          Manus Nova started in 2023 as a group of students in the Bronx who wanted to change that.
          We design our own hand, test it until it meets our standard, and build each one for the
          person who will wear it. Then we give it to them, free.
        </p>
      </div>
    </div>
  </section>
);

export const Count = () => (
  <section data-pose="count" className="relative h-[100svh] min-h-[640px] pt-[76px] pb-[8svh] md:py-0">
    <div className="h-full w-full max-w-[1120px] mx-auto px-6 flex flex-col-reverse md:grid md:grid-cols-2 md:items-center">
      <div className="md:pr-8" data-reveal>
        <h2 className={eyebrow}>So far</h2>
        <p className="free-word mt-1 text-[clamp(5rem,13vw,12rem)] font-semibold tracking-[-0.06em] leading-[0.9] tabular-nums">
          35
        </p>
        <p className="mt-4 text-[clamp(1.5rem,2.5vw,2.35rem)] font-semibold tracking-[-0.03em] leading-[1.18]">
          hands built and given away.
        </p>
        <p className={`${body} mt-5 max-w-[26rem]`}>
          Each one printed, assembled, and fitted by a student on our team.
        </p>
      </div>
      <div data-slot className="flex-1 min-h-0 mb-[4svh] md:mb-0 md:h-[70svh]" />
    </div>
  </section>
);

const steps = [
  {
    title: "Request",
    text: "Tell us who the hand is for, through the form or by email. A student replies within a day or two.",
  },
  {
    title: "Fitting",
    text: "We meet in person and take the measurements the hand is built around. Fittings are always free.",
  },
  {
    title: "Build",
    text: "We print every part, assemble it by hand, and check it against our standards. This takes two to four weeks.",
  },
  {
    title: "Delivery",
    text: "We fit the finished hand in person and adjust it until it's right. It's yours to keep, at no cost.",
  },
];

export const Process = () => (
  <section id="how" data-pose="quiet" className="relative py-[18svh]">
    <QuietSlot />
    <div className="relative w-full max-w-[1120px] mx-auto px-6">
      <div data-reveal="quiet" className="max-w-[44rem]">
        <h2 className={eyebrow}>How it works</h2>
        <p className={`${heading} mt-3`}>From first message to a hand that fits.</p>
      </div>
      <ol data-reveal-stagger="quiet" className="mt-14 max-w-[56rem]">
        {steps.map((s, i) => (
          <li
            key={s.title}
            className="grid grid-cols-[2.5rem_1fr] md:grid-cols-[4rem_12rem_1fr] gap-x-4 gap-y-1 border-t border-ink/10 py-7"
          >
            <span className="text-stone tabular-nums text-[15px] pt-[0.3em]">0{i + 1}</span>
            <h3 className="text-[clamp(1.2rem,1.8vw,1.5rem)] font-semibold tracking-[-0.02em]">{s.title}</h3>
            <p className={`${body} col-start-2 md:col-start-3`}>{s.text}</p>
          </li>
        ))}
      </ol>
      <div data-reveal="quiet">
        <button onClick={openRequestSheet} className="btn-primary mt-10">
          Start a request
        </button>
      </div>
    </div>
  </section>
);

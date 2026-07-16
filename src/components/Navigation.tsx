import { useEffect, useState } from "react";
import { scrollToId, scrollToTop } from "@/lib/scroll";
import { REQUEST_MAILTO, DONATE_MAILTO } from "@/lib/links";

const links = [
  { label: "How it's built", id: "process" },
  { label: "Team", id: "team" },
];

/** Stays out of the way until the reader passes the first screen. */
const Navigation = () => {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 bg-bone/90 backdrop-blur border-b border-ink/10 transition-all duration-500 ${
        shown ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
      }`}
      aria-hidden={!shown}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
        <button
          onClick={scrollToTop}
          className="font-mono text-[11px] uppercase tracking-[0.14em] font-medium text-ink"
        >
          Manus Nova
        </button>

        <div className="flex items-center gap-5 sm:gap-7">
          {links.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollToId(link.id)}
              className="link-quiet text-sm hidden sm:block"
            >
              {link.label}
            </button>
          ))}
          <a href={DONATE_MAILTO} className="link-quiet text-sm hidden sm:block">
            Donate
          </a>
          <a href={REQUEST_MAILTO} className="btn-primary !px-5 !py-2 !text-sm">
            Request a device
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

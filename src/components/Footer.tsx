import { EMAIL, INSTAGRAM } from "@/lib/links";

/** One quiet line, then the small print. */
const Footer = () => (
  <footer className="border-t border-ink/10">
    <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm text-stone">
        <a href={`mailto:${EMAIL}`} className="link-quiet break-all">
          {EMAIL}
        </a>
        <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="link-quiet">
          @projectmanusnova
        </a>
        <span>75 W 205th St, Bronx, NY 10468</span>
        <span>© {new Date().getFullYear()} Manus Nova</span>
      </div>
      <p className="fig-label mt-6 normal-case tracking-normal text-stone/70">
        Manus Nova is a student nonprofit prosthetics project. Not affiliated with Manus, the
        AI agent platform, or any artificial intelligence company. Phoenix Hand is an
        open-source design by the e-NABLE community.
      </p>
    </div>
  </footer>
);

export default Footer;

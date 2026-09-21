import { ENABLE_URL } from "@/lib/links";

const Footer = () => (
  <footer className="relative border-t border-ink/10 bg-bone">
    <div className="max-w-[1080px] mx-auto px-6 py-8 text-xs leading-relaxed text-stone">
      <p>
        Every device Manus Nova builds is an open-source design by the{" "}
        <a
          href={ENABLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-ink"
        >
          e&#8209;NABLE community
        </a>
        . We print, assemble, and fit them; we did not design them. Manus Nova is not
        affiliated with Manus, the AI agent platform, or any artificial intelligence company.
      </p>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
        <span>© {new Date().getFullYear()} Manus Nova</span>
        <span>Bronx, New York</span>
      </div>
    </div>
  </footer>
);

export default Footer;

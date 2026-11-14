const Footer = () => (
  <footer className="relative border-t border-ink/10 bg-bone">
    <div className="max-w-[1080px] mx-auto px-6 py-8 text-xs leading-relaxed text-stone">
      <p>
        Every device Manus Nova builds is our own design, tested in house before it reaches
        anyone. We design, print, assemble, and fit them. Manus Nova is not affiliated with
        Manus, the AI agent platform, or any artificial intelligence company.
      </p>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1">
        <span>© {new Date().getFullYear()} Manus Nova</span>
        <span>Bronx, New York</span>
      </div>
    </div>
  </footer>
);

export default Footer;

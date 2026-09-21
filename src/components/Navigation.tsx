import { openRequestSheet } from "@/components/RequestSheet";
import { DONATE_MAILTO } from "@/lib/links";
import { scrollToTop } from "@/lib/stage";

const Navigation = () => (
  <nav className="site-nav fixed top-0 inset-x-0 z-50 pt-[env(safe-area-inset-top,0px)]">
    <div className="max-w-[1120px] mx-auto px-6 h-[52px] flex items-center justify-between">
      <button onClick={scrollToTop} className="text-[19px] font-semibold tracking-[-0.02em] text-ink">
        manus nova.
      </button>
      <div className="flex items-center gap-6">
        <a href={DONATE_MAILTO} className="link-quiet text-[12px] tracking-[-0.01em]">
          Donate
        </a>
        <button onClick={openRequestSheet} className="btn-primary btn-small">
          Request
        </button>
      </div>
    </div>
  </nav>
);

export default Navigation;

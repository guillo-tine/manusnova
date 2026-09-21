import { Suspense, lazy, useEffect } from "react";
import Intro from "@/components/Intro";
import Navigation from "@/components/Navigation";
import RequestSheet from "@/components/RequestSheet";
import ErrorBoundary from "@/components/ErrorBoundary";
import Hero from "@/components/Hero";
import Story from "@/components/Story";
import Team from "@/components/Team";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { startSmoothScroll } from "@/lib/stage";

const HandStage = lazy(() => import("@/components/three/HandStage"));

/** Apple's trigger point: a block animates in once its top passes 70% down the viewport. */
function useRevealOnArrival() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal], [data-reveal-stagger]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -30% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const Index = () => {
  useEffect(() => startSmoothScroll(), []);
  useRevealOnArrival();

  return (
    <div className="min-h-screen text-ink">
      <Intro />
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <HandStage />
        </Suspense>
      </ErrorBoundary>
      <Navigation />
      <RequestSheet />
      <main className="relative z-10">
        <Hero />
        <Story />
        <Team />
        <Contact />
      </main>
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default Index;

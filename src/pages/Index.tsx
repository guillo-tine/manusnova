import { Suspense, lazy, useEffect, useMemo } from "react";
import Intro from "@/components/Intro";
import Navigation from "@/components/Navigation";
import RequestSheet from "@/components/RequestSheet";
import ErrorBoundary from "@/components/ErrorBoundary";
import Hero from "@/components/Hero";
import Story from "@/components/Story";
import Team from "@/components/Team";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { gpuAvailable, skipHeavyScene, stage, startSmoothScroll } from "@/lib/stage";

const HandStage = lazy(() => import("@/components/three/HandStage"));

/**
 * A block animates in once its top passes 70% down the viewport (Apple's trigger point),
 * or once most of it is on screen. The second rule matters on phones, where the showpiece
 * sections put their text at the bottom: framed exactly, that text can sit just below the
 * 70% line and would otherwise stay hidden while the reader is looking straight at it.
 */
function useRevealOnArrival() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal], [data-reveal-stagger]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const arrived = e.boundingClientRect.top < e.rootBounds!.height * 0.7;
          if (e.isIntersecting && (arrived || e.intersectionRatio >= 0.6)) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const Index = () => {
  useEffect(() => startSmoothScroll(), []);
  useRevealOnArrival();
  // on data-saver, a 2G-class link, or a machine with no real GPU, the model is skipped
  const scene = useMemo(() => {
    const on = !skipHeavyScene() && gpuAvailable();
    if (!on) {
      stage.sceneReady = true;
    } else {
      // start the model download now, in parallel with the 3D code, at low priority so it
      // never starves the page itself; visitors who won't see the model never fetch it
      const l = Object.assign(document.createElement("link"), {
        rel: "preload", as: "fetch", href: "/models/hand-parts.glb", crossOrigin: "anonymous",
      });
      l.setAttribute("fetchpriority", "low");
      document.head.appendChild(l);
    }
    return on;
  }, []);

  return (
    <div className="min-h-screen text-ink">
      <Intro />
      {scene && (
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <HandStage />
          </Suspense>
        </ErrorBoundary>
      )}
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

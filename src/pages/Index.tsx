import Navigation from "@/components/Navigation";
import RequestSheet from "@/components/RequestSheet";
import Hero from "@/components/Hero";
import Mission from "@/components/Mission";
import Process from "@/components/Process";
import Zero from "@/components/Zero";
import Team from "@/components/Team";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen bg-bone text-ink">
    <Navigation />
    <RequestSheet />
    <main>
      <Hero />
      <Mission />
      <Process />
      <Zero />
      <Team />
      <Contact />
    </main>
    <Footer />
  </div>
);

export default Index;

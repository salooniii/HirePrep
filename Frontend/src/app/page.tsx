import Navbar from "@/components/sections/Navbar";
import Hero from "@/components/sections/Hero";
import Process from "@/components/sections/Process";
import Features from "@/components/sections/Features";
import BeforeAfter from "@/components/sections/BeforeAfter";
import CTA from "@/components/sections/CTA";
import FAQ from "@/components/sections/FAQ";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Process />
      <Features />
      <CTA />
      <FAQ />
      <Footer />
    </main>
  );
}
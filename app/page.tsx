import { Features } from "@/components/landing/Features";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { UseCases } from "@/components/landing/UseCases";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <LandingHeader />

      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <UseCases />
        <FinalCTA />
      </main>

      <LandingFooter />
    </div>
  );
}

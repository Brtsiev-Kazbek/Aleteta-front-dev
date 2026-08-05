import { Audience } from "@/components/landing/Audience";
import { CapabilityIndex } from "@/components/landing/CapabilityIndex";
import { ComparisonSlider } from "@/components/landing/ComparisonSlider";
import { DocumentMarquee } from "@/components/landing/DocumentMarquee";
import { FAQ } from "@/components/landing/FAQ";
import { FeatureShowcase } from "@/components/landing/FeatureShowcase";
import {
  ANALYSIS_FEATURES,
  PRODUCTION_FEATURES,
} from "@/components/landing/features-data";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { GenerationShowcase } from "@/components/landing/GenerationShowcase";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { PackageBuilder } from "@/components/landing/PackageBuilder";
import { Pricing } from "@/components/landing/Pricing";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { ScrollProgress } from "@/components/landing/ScrollProgress";
import { SocialProof } from "@/components/landing/SocialProof";
import { SolutionIntro } from "@/components/landing/SolutionIntro";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <ScrollProgress />
      <LandingHeader />

      <main>
        <Hero />
        <DocumentMarquee />

        {/* 01 — где уходит время */}
        <ProblemSection />

        {/* 02 — до и после, перетаскиванием */}
        <ComparisonSlider />

        {/* 03 — что такое Алетейя */}
        <SolutionIntro />

        {/* 04 — подготовка и выпуск документов */}
        <FeatureShowcase
          id="features"
          eyebrow="Подготовка документов"
          title="Пять инструментов для выпуска документов"
          description="Демонстрации ниже показывают реальные экраны продукта."
          features={PRODUCTION_FEATURES}
        />

        {/* 05 — кинематографичная генерация пакета */}
        <GenerationShowcase />

        {/* 06 — анализ, проверка и правовая позиция */}
        <FeatureShowcase
          id="analysis"
          eyebrow="Анализ и проверка"
          title="Четыре инструмента для работы с чужими документами"
          description="Разбор по пунктам, судебная практика и проверка сразу нескольких договоров."
          features={ANALYSIS_FEATURES}
        />

        {/* 07 — полный перечень возможностей */}
        <CapabilityIndex />

        {/* 08 — расчёт на своём объёме */}
        <PackageBuilder />

        {/* 09 — кому подходит */}
        <Audience />

        {/* 10 — как это работает */}
        <HowItWorks />

        {/* 11 — показатели и отзывы */}
        <SocialProof />

        {/* 12 — тарифы */}
        <Pricing />

        {/* 13 — вопросы */}
        <FAQ />

        <FinalCTA />
      </main>

      <LandingFooter />
    </div>
  );
}

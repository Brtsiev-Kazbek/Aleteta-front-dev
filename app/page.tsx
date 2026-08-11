import { Audience } from "@/components/landing/Audience";
import { Bento } from "@/components/landing/Bento";
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
import { Pricing } from "@/components/landing/Pricing";
import { ScrollProgress } from "@/components/landing/ScrollProgress";

/**
 * Лендинг.
 *
 * Разделов стало вдвое меньше — было тринадцать. Тринадцать разделов не читает
 * никто: человек долистывает до середины, теряет нить и уходит, так и не
 * добравшись до тарифов. Убраны те, что пересказывали друг друга: перечень
 * возможностей повторял показ возможностей, «до и после» повторял раздел про
 * потерянное время, а блок с отзывами стоял с заготовками вместо цитат —
 * выдуманные отзывы публиковать нельзя, а настоящих пока нет.
 *
 * Порядок держится на одном вопросе за раз:
 *
 *   что это           → первый экран
 *   что оно делает    → бенто-сетка
 *   покажи            → показ возможностей, генерация пакета
 *   как начать        → три шага
 *   это про меня?     → кому подходит
 *   сколько           → тарифы
 *   а если…           → вопросы
 *   ну хорошо         → последний экран
 *
 * ТОН РАЗДЕЛОВ ЧЕРЕДУЕТСЯ, и это единственная роскошь, которую страница себе
 * позволяет. Тёмных полей три: входное (первый экран вместе с бегущей строкой
 * читается как одно), генерация пакета и последнее. Первое и последнее работают
 * скобками вокруг светлой середины, где объясняют; среднее — единственная
 * остановка внутри неё, и стоит оно там, где показывают главное действие
 * продукта. Четвёртое сломало бы приём: страница стала бы полосатой.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <ScrollProgress />
      <LandingHeader />

      <main>
        {/* Что это */}
        <Hero />
        <DocumentMarquee />

        {/* Что оно делает */}
        <Bento />

        {/* Покажи */}
        <FeatureShowcase
          id="production"
          eyebrow="Подготовка документов"
          title="Пять инструментов для выпуска документов"
          description="Ниже — настоящие экраны продукта, а не рисунки к ним."
          features={PRODUCTION_FEATURES}
        />

        <GenerationShowcase />

        <FeatureShowcase
          id="analysis"
          eyebrow="Анализ и проверка"
          title="Четыре инструмента для работы с чужими документами"
          description="Разбор по пунктам, судебная практика и проверка сразу нескольких договоров."
          features={ANALYSIS_FEATURES}
        />

        {/* Как начать */}
        <HowItWorks />

        {/* Это про меня? */}
        <Audience />

        {/* Сколько */}
        <Pricing />

        {/* А если… */}
        <FAQ />

        {/* Ну хорошо */}
        <FinalCTA />
      </main>

      <LandingFooter />
    </div>
  );
}

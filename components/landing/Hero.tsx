"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

import { ProductPreview } from "@/components/landing/ProductPreview";

/**
 * Первый экран.
 *
 * Здесь решается всё: у страницы примерно пять секунд, чтобы объяснить, что это
 * и зачем. Отсюда устройство кадра — оно намеренно повторяет приём, которым
 * пользуются те, у кого это получается лучше всех.
 *
 * ОДНО ОБЕЩАНИЕ, НАБРАННОЕ КРУПНО. Заголовок занимает половину экрана и говорит
 * одну вещь. Не три преимущества через запятую, не список возможностей — одно
 * предложение, которое человек дочитает до конца. Всё остальное ниже.
 *
 * ПРОДУКТ В КАДРЕ, А НЕ ИЛЛЮСТРАЦИЯ. Под заголовком стоит настоящий интерфейс,
 * крупно и с тенью, как предмет, положенный на страницу. Абстрактные картинки
 * из фотостока в деловом продукте работают против него: они говорят «нам нечего
 * показать».
 *
 * ТЁМНЫЙ ФОН СО СВЕЧЕНИЕМ. Тёмное поле даёт светлому снимку интерфейса выступить
 * вперёд — тот же приём, что у витрины с подсветкой. Свечение собрано из трёх
 * пятен разного радиуса: одно читалось бы как виньетка и удешевляло кадр.
 */

/** Заголовок по строкам: последняя идёт градиентом — в ней и есть обещание. */
const HEADLINE = [
  { text: "Документы по делу —", accent: false },
  { text: "без перепечатывания", accent: true },
];

/** Только проверяемое. Обещания, которых продукт не выполняет, тут дороже всего. */
const FACTS = [
  "Распознаёт сканы и PDF",
  "Проверяет реквизиты до генерации",
  "Экспорт в DOCX",
];

export function Hero() {
  const reduceMotion = useReducedMotion();
  const previewRef = useRef<HTMLDivElement>(null);

  /*
   * Снимок продукта «встаёт» по мере подхода к нему. Приём старый и работает
   * ровно потому, что почти незаметен: глаз ловит, что предмет объёмный, но
   * движения не замечает.
   */
  const { scrollYProgress } = useScroll({
    target: previewRef,
    offset: ["start 0.95", "start 0.35"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 1], [14, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const lift = useTransform(scrollYProgress, [0, 1], [40, 0]);

  const appear = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.22, 0.61, 0.36, 1] },
        };

  return (
    <section className="relative overflow-hidden bg-inverse">
      {/* Свечение и зерно */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="mesh-dark absolute inset-0" />
        <div className="bg-grid-dark absolute inset-0 opacity-[0.55]" />
        {/* Растворение к низу: секция должна перетекать в следующую, а не обрываться. */}
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-b from-transparent to-inverse" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-32 sm:pt-40 lg:pb-32">
        {/* Пометка над заголовком */}
        <motion.div {...appear(0)} className="flex justify-center">
          <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-brand opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
            </span>
            <span className="text-caption text-inverse-fg/70">
              Распознавание уже работает — попробуйте на своём файле
            </span>
          </span>
        </motion.div>

        {/* Обещание */}
        <h1 className="mx-auto mt-8 max-w-4xl text-center text-hero font-medium text-inverse-fg">
          {HEADLINE.map((line, index) => (
            <motion.span
              key={line.text}
              {...appear(0.08 + index * 0.09)}
              className="block"
            >
              {line.accent ? (
                <span className="text-brand-gradient">{line.text}</span>
              ) : (
                line.text
              )}
            </motion.span>
          ))}
        </h1>

        <motion.p
          {...appear(0.28)}
          className="mx-auto mt-7 max-w-2xl text-center text-lead text-inverse-fg/55"
        >
          Загрузите скан — Алетейя прочитает его и вынет реквизиты в карточку
          объекта: кадастровый номер, ИНН, адрес, даты. Дальше вы работаете с
          проверенными значениями, а не переносите их из PDF в шаблон руками.
        </motion.p>

        {/* Действия */}
        <motion.div
          {...appear(0.36)}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/auth/register"
            className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-inverse-fg px-7 text-body font-medium text-inverse transition-transform duration-200 hover:scale-[1.02] sm:w-auto"
          >
            Начать бесплатно
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="#product"
            className="glass inline-flex h-12 w-full items-center justify-center rounded-full px-7 text-body font-medium text-inverse-fg transition-colors duration-200 hover:bg-inverse-fg/10 sm:w-auto"
          >
            Посмотреть, как работает
          </Link>
        </motion.div>

        {/* Проверяемые утверждения */}
        <motion.ul
          {...appear(0.44)}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5"
        >
          {FACTS.map((fact) => (
            <li
              key={fact}
              className="flex items-center gap-1.5 text-caption text-inverse-fg/45"
            >
              <Check className="h-3.5 w-3.5 shrink-0 text-brand" strokeWidth={2.5} />
              {fact}
            </li>
          ))}
        </motion.ul>

        {/* Продукт */}
        <div
          id="product"
          ref={previewRef}
          className="mt-20 scroll-mt-24 [perspective:1800px] sm:mt-24"
        >
          <motion.div
            style={reduceMotion ? undefined : { rotateX, scale, y: lift }}
            className="product-shadow overflow-hidden rounded-2xl [transform-style:preserve-3d]"
          >
            <ProductPreview />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

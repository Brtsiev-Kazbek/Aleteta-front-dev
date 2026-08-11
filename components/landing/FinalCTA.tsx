"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

/**
 * Последний экран.
 *
 * Тёмный — второй и последний раз на странице. Первый экран и этот работают
 * скобками: между ними светлая середина, где объясняют, а на скобках просят
 * действия. Если тёмных секций больше двух, приём перестаёт работать и
 * страница просто становится пёстрой.
 *
 * Здесь нет ни списка возможностей, ни новых доводов. Всё уже сказано; здесь
 * одна фраза, одна кнопка и снятое возражение мелким шрифтом под ней — то,
 * из-за чего человек не нажимает: «сколько это стоит» и «сколько настраивать».
 */
export function FinalCTA() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-inverse">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="mesh-dark absolute inset-0" />
        <div className="bg-grid-dark absolute inset-0 opacity-40" />
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
        className="relative mx-auto max-w-3xl px-6 py-28 text-center sm:py-36"
      >
        <h2 className="text-section font-medium text-inverse-fg">
          <span className="block">Сорок объектов —</span>
          <span className="block text-brand-gradient">один пакет</span>
        </h2>

        <p className="mx-auto mt-6 max-w-xl text-lead text-inverse-fg/55">
          Заведите первое дело и загрузите свои файлы. Ровно те, с которыми
          сегодня работали, — так быстрее всего понять, подходит ли.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/register"
            className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-inverse-fg px-7 text-body font-medium text-inverse transition-transform duration-200 hover:scale-[1.02] sm:w-auto"
          >
            Начать бесплатно
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/auth/login"
            className="glass inline-flex h-12 w-full items-center justify-center rounded-full px-7 text-body font-medium text-inverse-fg transition-colors duration-200 hover:bg-inverse-fg/10 sm:w-auto"
          >
            У меня уже есть аккаунт
          </Link>
        </div>

        <p className="mt-7 text-caption text-inverse-fg/40">
          Без карты · Без установки · Данные выгружаются и удаляются по вашей
          команде
        </p>
      </motion.div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/landing/Reveal";

export function FinalCTA() {
  return (
    <section className="border-b border-line bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-violet-600" />
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-faint">
                  Ранний доступ
                </span>
              </div>

              <h2 className="mt-6 max-w-2xl text-3xl font-medium leading-[1.12] tracking-[-0.02em] text-fg sm:text-[2.75rem]">
                Сорок объектов — один пакет документов
              </h2>

              <p className="mt-5 max-w-lg text-base leading-relaxed text-fg-soft">
                Заведите первое дело и загрузите документы. Проверить на своих
                файлах можно бесплатно, без привязки карты.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 lg:col-span-5 lg:items-end">
              <Link
                href="/auth/register"
                className="group inline-flex h-12 items-center gap-2 rounded-md bg-inverse px-7 text-sm font-medium text-inverse-fg transition-colors hover:bg-fg"
              >
                Начать работу
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>

              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-faint">
                Настройка не требуется
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

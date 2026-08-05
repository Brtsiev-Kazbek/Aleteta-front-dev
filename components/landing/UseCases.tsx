"use client";

import { motion } from "framer-motion";
import { Building2, GraduationCap, Scale } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Reveal } from "@/components/landing/Reveal";

interface UseCase {
  icon: LucideIcon;
  role: string;
  task: string;
  result: string;
}

const USE_CASES: UseCase[] = [
  {
    icon: Scale,
    role: "Юристу",
    task: "Сделка с недвижимостью: 40 участков, у каждого свои реквизиты",
    result:
      "Матрица показывает, где не хватает кадастрового номера или назначения земель, — пакет собирается только по готовым строкам.",
  },
  {
    icon: Building2,
    role: "Предпринимателю",
    task: "Договоры с подрядчиками по муниципальному контракту",
    result:
      "Реквизиты контрагентов подтягиваются из уставных документов, договоры формируются по единому шаблону.",
  },
  {
    icon: GraduationCap,
    role: "Кафедре",
    task: "Проверка курсовых работ на соответствие требованиям",
    result:
      "Работы разбираются по пунктам методички, замечания привязываются к конкретным абзацам.",
  },
];

export function UseCases() {
  return (
    <section id="cases" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-medium uppercase tracking-wider text-indigo-600">
          Кому подходит
        </span>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Одна система на разные типы дел
        </h2>
      </Reveal>

      <div className="mt-14 flex flex-col gap-4">
        {USE_CASES.map((useCase, index) => (
          <Reveal key={useCase.role} delay={index * 0.09}>
            <motion.div
              whileHover={{ x: 6 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="group flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-lg sm:flex-row sm:items-center"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 transition-colors duration-300 group-hover:bg-indigo-50">
                <useCase.icon className="h-5 w-5 text-zinc-500 transition-colors duration-300 group-hover:text-indigo-600" />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
                <div className="sm:w-52 sm:shrink-0">
                  <span className="text-xs font-medium uppercase tracking-wide text-indigo-600">
                    {useCase.role}
                  </span>
                  <p className="mt-1 text-sm font-medium leading-snug text-zinc-900">
                    {useCase.task}
                  </p>
                </div>

                <p className="text-sm leading-relaxed text-zinc-500">
                  {useCase.result}
                </p>
              </div>
            </motion.div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

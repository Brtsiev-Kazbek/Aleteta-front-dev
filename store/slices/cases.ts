import { createCaseAction } from "@/app/actions/cases";
import { MOCK_CASES } from "@/data/mock-data";
import type { Case } from "@/types";

import { createSync, isRemote, nextId } from "../sync";
import type { CasesSlice, SliceCreator } from "../types";

/** Дела: список и создание. */
export const createCasesSlice: SliceCreator<CasesSlice> = (set, get) => {
  const sync = createSync(set);

  return {
    cases: MOCK_CASES,

    createCase: async (title) => {
      const newCase: Case = {
        id: nextId("case"),
        title: title.trim() || "Новое дело",
        status: "collecting",
        tags: ["Черновик"],
        createdAt: new Date().toISOString(),
        description:
          "Новое рабочее пространство. Загрузите документы — Алетейя извлечёт реквизиты и соберёт сущности автоматически.",
        contextFile: "Файлы не загружены",
      };

      set({ cases: [newCase, ...get().cases] });

      if (!isRemote(get)) return newCase;

      /*
       * Здесь ответ базы ждём, в отличие от правки ячейки: сразу после создания
       * дела человека переносит на его страницу, а идти на страницу дела с
       * временным идентификатором некуда — после перезагрузки его не найти.
       */
      return sync(createCaseAction(newCase.title), {
        onSuccess: (created) =>
          set({
            cases: get().cases.map((item) =>
              item.id === newCase.id ? created : item
            ),
          }),
        onFailure: () =>
          set({ cases: get().cases.filter((item) => item.id !== newCase.id) }),
        fallback: "Не удалось создать дело.",
      });
    },
  };
};

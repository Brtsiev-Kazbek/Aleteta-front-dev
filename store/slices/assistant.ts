import { updateEntityDataAction } from "@/app/actions/entities";
import {
  ASSISTANT_CITATIONS,
  ASSISTANT_RISK_FINDINGS,
  INITIAL_CHAT_MESSAGES,
  INN_CITATION,
} from "@/data/mock-data";
import { findSchema, withValidation } from "@/lib/validation";
import type { ChatMessage } from "@/types";

import { AI_SUGGESTED_VALUES } from "../demo";
import { createSync, isRemote, nextId, replaceEntityId } from "../sync";
import type { AssistantSlice, SliceCreator } from "../types";

/**
 * Ассистент по делу.
 *
 * ЭТО ПОКА ИМИТАЦИЯ. Ответы подбираются по ключевым словам из заранее
 * заготовленного набора, «раздумье» длится ровно девятьсот миллисекунд.
 * Настоящий ассистент — это задание `assistant`, которое отвечает по
 * найденным фрагментам дела и обязано приводить цитаты; порядок описан в
 * docs/AI-BACKEND.md.
 *
 * Одно исключение — подстановка пустых полей: значения берутся выдуманные, но
 * записываются они в базу по-настоящему, через те же действия, что и правка
 * руками. Так сделано намеренно: заменять придётся источник значений, а не
 * весь путь до базы.
 */
export const createAssistantSlice: SliceCreator<AssistantSlice> = (set, get) => {
  const sync = createSync(set);

  return {
    isAssistantOpen: false,
    isAssistantThinking: false,
    chatMessages: INITIAL_CHAT_MESSAGES,

    toggleAssistant: (open) =>
      set((state) => ({ isAssistantOpen: open ?? !state.isAssistantOpen })),

    sendChatMessage: (text, caseId) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMessage: ChatMessage = {
        id: nextId("message"),
        role: "user",
        text: trimmed,
        timestamp: new Date().toISOString(),
      };

      set({
        chatMessages: [...get().chatMessages, userMessage],
        isAssistantThinking: true,
      });

      window.setTimeout(() => {
        const lower = trimmed.toLowerCase();
        const caseEntities = get().entities.filter(
          (entity) => entity.caseId === caseId
        );
        const invalid = caseEntities.filter(
          (entity) => entity.validationErrors.length > 0
        );

        let reply: ChatMessage;

        if (lower.includes("риск")) {
          reply = {
            id: nextId("message"),
            role: "assistant",
            text: "Проверил договор по делу. Обнаружены следующие риски:",
            findings: ASSISTANT_RISK_FINDINGS,
            timestamp: new Date().toISOString(),
          };
        } else if (lower.includes("инн")) {
          reply = {
            id: nextId("message"),
            role: "assistant",
            text: "Просканировал файлы дела. ИНН найден в уставных документах: 1513000000 (ООО «Альфа-Консалт»). Значение подставлено в карточку контрагента.",
            citations: [INN_CITATION],
            timestamp: new Date().toISOString(),
          };
        } else if (
          lower.includes("формулировк") ||
          lower.includes("найди") ||
          lower.includes("найти") ||
          lower.includes("где ")
        ) {
          // Поиск формулировки по всем файлам дела — ответ обязательно
          // сопровождается ссылкой на пункт и страницу источника.
          reply = {
            id: nextId("message"),
            role: "assistant",
            text: "Нашёл в материалах дела два фрагмента по вашему запросу. Формулировки привожу дословно — ниже указано, откуда они взяты.",
            citations: ASSISTANT_CITATIONS,
            timestamp: new Date().toISOString(),
          };
        } else if (lower.includes("заполн") || lower.includes("пуст")) {
          get().fillEmptyFieldsWithAI(caseId);
          reply = {
            id: nextId("message"),
            role: "assistant",
            text: "Заполнил пустые обязательные поля значениями из выписки ЕГРН. Проверьте подставленные данные в таблице — все строки готовы к генерации.",
            citations: ASSISTANT_CITATIONS.filter((item) =>
              item.document.includes("ЕГРН")
            ),
            timestamp: new Date().toISOString(),
          };
        } else if (invalid.length > 0) {
          reply = {
            id: nextId("message"),
            role: "assistant",
            text: `В деле ${invalid.length} из ${caseEntities.length} записей не готовы к генерации. Незаполненные обязательные поля подсвечены красным — можно исправить прямо в таблице или попросить меня заполнить их из файлов.`,
            timestamp: new Date().toISOString(),
          };
        } else {
          reply = {
            id: nextId("message"),
            role: "assistant",
            text: "Все сущности заполнены корректно — пакет документов можно генерировать.",
            timestamp: new Date().toISOString(),
          };
        }

        set({
          chatMessages: [...get().chatMessages, reply],
          isAssistantThinking: false,
        });
      }, 900);
    },

    fillEmptyFieldsWithAI: (caseId) => {
      // Что именно подставили — нужно и для отката, и для записи в базу.
      const patches = new Map<string, Record<string, string>>();

      set({
        entities: get().entities.map((entity) => {
          if (entity.caseId !== caseId) return entity;
          if (entity.validationErrors.length === 0) return entity;

          // Подставляем значения только в поля, которые есть в схеме этого типа.
          const schema = findSchema(get().entitySchemas, entity.type);
          const patch: Record<string, string> = {};
          for (const field of schema.fields) {
            const suggestion = AI_SUGGESTED_VALUES[field.key];
            if (suggestion && !(entity.data[field.key] ?? "").trim()) {
              patch[field.key] = suggestion;
            }
          }

          if (Object.keys(patch).length === 0) return entity;
          patches.set(entity.id, patch);

          return withValidation(
            { ...entity, data: { ...entity.data, ...patch } },
            schema
          );
        }),
      });

      if (!isRemote(get)) return;

      for (const [entityId, patch] of patches) {
        void sync(updateEntityDataAction(entityId, patch), {
          onSuccess: (saved) => replaceEntityId(set, entityId, saved),
          fallback: "Не удалось сохранить подставленные реквизиты.",
        });
      }
    },
  };
};

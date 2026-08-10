import { create } from "zustand";

import { createAssistantSlice } from "./slices/assistant";
import { createCasesSlice } from "./slices/cases";
import { createDocumentsSlice } from "./slices/documents";
import { createEntitiesSlice } from "./slices/entities";
import { createGenerationSlice } from "./slices/generation";
import {
  createRecognitionSlice,
  scheduleResume,
} from "./slices/recognition";
import { createReviewSlice } from "./slices/review";
import { createWorkspaceSlice } from "./slices/workspace";
import type { AppState } from "./types";

/**
 * Единый стор приложения, собранный из слоёв.
 *
 * Снаружи это по-прежнему один объект: компоненты обращаются к `useAppStore`
 * ровно так же, как до разделения, и ни один из двадцати потребителей не знает,
 * что файл перестал быть монолитом.
 *
 * Порядок сборки значения не имеет — имена полей в слоях не пересекаются.
 * Если однажды пересекутся, TypeScript об этом скажет: каждый слой объявлен
 * своим интерфейсом, а `AppState` — их пересечением.
 *
 * ГДЕ ЧТО ЛЕЖИТ:
 *
 *   slices/cases.ts        дела
 *   slices/entities.ts     объекты и пользовательские типы
 *   slices/documents.ts    файлы дела: загрузка, удаление, выделение
 *   slices/recognition.ts  распознавание — единственное, что работает по-настоящему
 *   slices/workspace.ts    вкладки, выделение дел, боковая панель
 *   slices/assistant.ts    чат            ← пока имитация
 *   slices/generation.ts   генерация      ← пока имитация
 *   slices/review.ts       разбор и риски ← пока имитация
 *   demo.ts                таймеры и заготовленные ответы имитации
 *   sync.ts                запись в базу с откатом
 */
export const useAppStore = create<AppState>((set, get) => ({
  ...createCasesSlice(set, get),
  ...createEntitiesSlice(set, get),
  ...createDocumentsSlice(set, get),
  ...createRecognitionSlice(set, get),
  ...createWorkspaceSlice(set, get),
  ...createAssistantSlice(set, get),
  ...createGenerationSlice(set, get),
  ...createReviewSlice(set, get),

  /* --- Обмен с базой ---------------------------------------------- */

  syncError: null,
  pendingWrites: 0,
  isBackedByDatabase: false,
  viewer: null,

  dismissSyncError: () => set({ syncError: null }),

  hydrate: (snapshot) => {
    set((state) => ({
      viewer: snapshot.viewer ?? state.viewer,
      cases: snapshot.cases ?? state.cases,
      entities: snapshot.entities ?? state.entities,
      documents: snapshot.documents ?? state.documents,
      entitySchemas: snapshot.entitySchemas ?? state.entitySchemas,
      isBackedByDatabase: true,
    }));

    /*
     * Распознавание идёт на сервере и продолжается, пока вкладка закрыта.
     * Поэтому после загрузки данных надо не начинать его заново, а снова
     * начать смотреть за файлами, которые ещё не дочитаны.
     */
    scheduleResume(get().resumeRecognition);
  },
}));

export type {
  AppState,
  BulkGenerationResult,
  CaseTab,
  CustomSchemaDraft,
  EditingCell,
  RecognitionJob,
  StoreSnapshot,
  UploadedFile,
  Viewer,
} from "./types";

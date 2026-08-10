import {
  deleteDocumentAction,
  prepareDocumentUploadAction,
  prepareLooseUploadAction,
  registerDocumentAction,
} from "@/app/actions/documents";
import { MOCK_DOCUMENTS } from "@/data/mock-data";
import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/types";

import { createSync, isRemote, nextId } from "../sync";
import type { DocumentsSlice, SliceCreator } from "../types";

/** Тип документа по расширению — для колонки во вкладке «Документы». */
function detectDocumentType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  switch (extension) {
    case "pdf":
      return "PDF-документ";
    case "doc":
    case "docx":
      return "Документ Word";
    case "xls":
    case "xlsx":
      return "Таблица";
    case "jpg":
    case "jpeg":
    case "png":
    case "webp":
    case "tif":
    case "tiff":
      return "Скан";
    default:
      return "Файл";
  }
}

/** Документы дела: загрузка, удаление, выделение. */
export const createDocumentsSlice: SliceCreator<DocumentsSlice> = (
  set,
  get
) => {
  const sync = createSync(set);

  return {
    documents: MOCK_DOCUMENTS,
    selectedDocumentIds: [],

    addDocument: (document) => {
      const created: Document = {
        ...document,
        id: nextId("doc"),
        createdAt: new Date().toISOString(),
      };
      set({ documents: [created, ...get().documents] });
      return created;
    },

    addDocuments: async (caseId, files) => {
      if (files.length === 0) return;

      const createdAt = new Date().toISOString();
      const created: Document[] = files.map((file) => ({
        id: nextId("doc"),
        caseId,
        title: file.name,
        type: detectDocumentType(file.name),
        status: "ready",
        url: "#",
        createdAt,
        ocrStatus: "pending",
        pagesDone: 0,
        pageCount: null,
        textSource: null,
      }));

      set({ documents: [...created, ...get().documents] });

      if (!isRemote(get)) return;

      /*
       * Файл уезжает в хранилище прямо из браузера, минуя серверное действие:
       * предел на тело действия — мегабайты, а скан договора весит десятки.
       * Сервер выдаёт путь и заводит строку, содержимое идёт напрямую.
       */
      await Promise.all(
        files.map(async (picked, index) => {
          const placeholder = created[index];
          if (!placeholder) return;

          const drop = () =>
            set({
              documents: get().documents.filter(
                (item) => item.id !== placeholder.id
              ),
            });

          // У демонстрационного примера содержимого нет — грузить нечего.
          if (!picked.file) {
            drop();
            return;
          }

          /*
           * Дела может не быть: файл, загруженный ради распознавания, живёт
           * сам по себе. Путь тогда выдаёт другое действие — в нём вместо дела
           * стоит `loose`, а проверка прав идёт по пространству.
           */
          const target = await sync(
            caseId === null
              ? prepareLooseUploadAction(picked.name)
              : prepareDocumentUploadAction(caseId, picked.name),
            { onFailure: drop, fallback: "Не удалось подготовить загрузку." }
          );
          if (!target) return;

          const supabase = createClient();
          const { error } = await supabase.storage
            .from(target.bucket)
            .upload(target.path, picked.file, {
              contentType: picked.file.type || undefined,
              upsert: false,
            });

          if (error) {
            drop();
            set({
              syncError: `Файл «${picked.name}» не загрузился: ${error.message}`,
            });
            return;
          }

          const saved = await sync(
            registerDocumentAction({
              caseId,
              title: picked.name,
              kind: detectDocumentType(picked.name),
              path: target.path,
              mimeType: picked.file.type || undefined,
              sizeBytes: picked.sizeBytes,
            }),
            {
              onSuccess: (document) =>
                set({
                  documents: get().documents.map((item) =>
                    item.id === placeholder.id ? document : item
                  ),
                }),
              onFailure: drop,
              fallback: "Файл загружен, но запись о нём не сохранилась.",
            }
          );

          /*
           * Распознавание ставится сразу после загрузки, а не по кнопке.
           *
           * Иначе получается странное: файл в деле есть, а спросить по нему
           * ничего нельзя, пока человек не догадается нажать. Платим мы за
           * страницу один раз в любом случае, так что откладывать нечего —
           * пусть текст будет готов к тому моменту, когда понадобится.
           */
          if (saved) void get().recognizeDocument(saved.id);
        })
      );
    },

    deleteDocument: (documentId) => {
      const removed = get().documents.find((item) => item.id === documentId);

      set({
        documents: get().documents.filter((item) => item.id !== documentId),
        selectedDocumentIds: get().selectedDocumentIds.filter(
          (id) => id !== documentId
        ),
        reviewDocumentId:
          get().reviewDocumentId === documentId ? null : get().reviewDocumentId,
      });

      if (!isRemote(get) || !removed) return;

      void sync(deleteDocumentAction(documentId), {
        onFailure: () => set({ documents: [removed, ...get().documents] }),
        fallback: "Не удалось удалить документ.",
      });
    },

    toggleDocumentSelection: (documentId) => {
      const selected = get().selectedDocumentIds;
      set({
        selectedDocumentIds: selected.includes(documentId)
          ? selected.filter((id) => id !== documentId)
          : [...selected, documentId],
      });
    },

    selectDocuments: (documentIds) => set({ selectedDocumentIds: documentIds }),

    clearDocumentSelection: () => set({ selectedDocumentIds: [] }),
  };
};

import {
  addEntityAction,
  archiveEntitySchemaAction,
  createEntitySchemaAction,
  deleteEntityAction,
  duplicateEntityAction,
  updateEntityFieldAction,
} from "@/app/actions/entities";
import { MOCK_ENTITIES } from "@/data/mock-data";
import { plural } from "@/lib/utils";
import { findSchema, withValidation } from "@/lib/validation";
import type { EntityFieldSchema, EntitySchema } from "@/types";

import { createSync, isRemote, nextId, replaceEntityId } from "../sync";
import type { EntitiesSlice, SliceCreator } from "../types";

const SEEDED_ENTITIES = MOCK_ENTITIES.map((entity) =>
  withValidation(entity, findSchema([], entity.type))
);

/**
 * Объекты дела и их типы.
 *
 * Два предмета в одном слое намеренно: удаление типа уносит объекты этого типа,
 * а создание типа заводит первый объект. Разделить их — значит завести между
 * половинами стора переписку, которой сейчас нет.
 */
export const createEntitiesSlice: SliceCreator<EntitiesSlice> = (set, get) => {
  const sync = createSync(set);

  return {
    entities: SEEDED_ENTITIES,
    customSchemas: [],
    editingCell: null,
    isCustomSchemaOpen: false,

    updateEntityField: (entityId, field, value) => {
      const custom = get().customSchemas;
      const previous = get().entities.find((entity) => entity.id === entityId);

      set({
        entities: get().entities.map((entity) =>
          entity.id === entityId
            ? withValidation(
                { ...entity, data: { ...entity.data, [field]: value } },
                findSchema(custom, entity.type)
              )
            : entity
        ),
      });

      if (!isRemote(get) || !previous) return;

      void sync(updateEntityFieldAction(entityId, field, value), {
        /*
         * Ответ базы кладём целиком: список ошибок в нём пересчитан триггером,
         * и он главнее того, что насчитал браузер. Расхождение возможно — в базе
         * шаблон проверки хранится строкой POSIX, а не выражением JavaScript.
         */
        onSuccess: (entity) => replaceEntityId(set, entityId, entity),
        onFailure: () =>
          set({
            entities: get().entities.map((entity) =>
              entity.id === entityId ? previous : entity
            ),
          }),
        fallback: "Не удалось сохранить значение.",
      });
    },

    addEntity: (caseId, typeId) => {
      const schema = findSchema(get().customSchemas, typeId);
      const entity = withValidation(
        {
          id: nextId("entity"),
          caseId,
          type: schema.id,
          data: {},
          validationErrors: [],
        },
        schema
      );

      set({
        entities: [...get().entities, entity],
        // Сразу открываем первое поле новой сущности на редактирование.
        editingCell: schema.fields[0]
          ? { entityId: entity.id, field: schema.fields[0].key }
          : null,
      });

      if (!isRemote(get)) return;

      void sync(addEntityAction(caseId, typeId), {
        onSuccess: (created) => replaceEntityId(set, entity.id, created),
        onFailure: () =>
          set({
            entities: get().entities.filter((item) => item.id !== entity.id),
            editingCell:
              get().editingCell?.entityId === entity.id
                ? null
                : get().editingCell,
          }),
        fallback: "Не удалось добавить объект.",
      });
    },

    deleteEntity: (entityId) => {
      const removed = get().entities.find((entity) => entity.id === entityId);
      const position = get().entities.findIndex(
        (entity) => entity.id === entityId
      );

      set({
        entities: get().entities.filter((entity) => entity.id !== entityId),
        editingCell:
          get().editingCell?.entityId === entityId ? null : get().editingCell,
      });

      if (!isRemote(get) || !removed) return;

      void sync(deleteEntityAction(entityId), {
        onFailure: () => {
          // Возвращаем на то же место: строка, «перепрыгнувшая» в конец таблицы,
          // читается как ещё одна ошибка.
          const entities = [...get().entities];
          entities.splice(Math.max(0, position), 0, removed);
          set({ entities });
        },
        fallback: "Не удалось удалить объект.",
      });
    },

    duplicateEntity: (entityId) => {
      const source = get().entities.find((entity) => entity.id === entityId);
      if (!source) return;

      const schema = findSchema(get().customSchemas, source.type);
      // Имя берём из первого поля схемы: у своих типов ключа `name` нет.
      const nameKey = schema.fields[0]?.key;
      const data = { ...source.data };
      if (nameKey && data[nameKey]) {
        data[nameKey] = `${data[nameKey]} (копия)`;
      }

      const copy = withValidation(
        { ...source, id: nextId("entity"), data },
        schema
      );

      const index = get().entities.findIndex((entity) => entity.id === entityId);
      const entities = [...get().entities];
      entities.splice(index + 1, 0, copy);

      set({ entities });

      if (!isRemote(get)) return;

      void sync(duplicateEntityAction(entityId), {
        onSuccess: (saved) => replaceEntityId(set, copy.id, saved),
        onFailure: () =>
          set({
            entities: get().entities.filter((entity) => entity.id !== copy.id),
          }),
        fallback: "Не удалось скопировать объект.",
      });
    },

    setEditingCell: (cell) => set({ editingCell: cell }),

    createCustomSchema: async (draft, caseId) => {
      const label = draft.label.trim() || "Свой тип объекта";

      const fields: EntityFieldSchema[] = draft.fields
        .filter((field) => field.label.trim())
        .map((field, index) => ({
          key: `field_${index + 1}`,
          label: field.label.trim(),
          required: field.required,
          placeholder: `Значение поля «${field.label.trim()}»`,
          width: 240,
        }));

      // Без полей сущность бессмысленна — гарантируем хотя бы наименование.
      const safeFields: EntityFieldSchema[] =
        fields.length > 0
          ? fields
          : [
              {
                key: "field_1",
                label: "Наименование",
                required: true,
                placeholder: "Наименование",
                width: 280,
              },
            ];

      const schema: EntitySchema = {
        id: nextId("schema"),
        label,
        hint: `Свой тип: ${safeFields.length} ${plural(
          safeFields.length,
          "поле",
          "поля",
          "полей"
        )}`,
        isCustom: true,
        fields: safeFields,
        templates: [`Документ по сущности «${label}»`],
      };

      // Объект нового типа заводим только если тип создают внутри дела.
      const entity = caseId
        ? withValidation(
            {
              id: nextId("entity"),
              caseId,
              type: schema.id,
              data: {},
              validationErrors: [],
            },
            schema
          )
        : null;

      set({
        customSchemas: [...get().customSchemas, schema],
        entities: entity ? [...get().entities, entity] : get().entities,
        isCustomSchemaOpen: false,
        editingCell:
          entity && safeFields[0]
            ? { entityId: entity.id, field: safeFields[0].key }
            : get().editingCell,
      });

      if (!isRemote(get)) return;

      const created = await sync(
        createEntitySchemaAction(
          label,
          draft.fields.map(({ label: fieldLabel, required }) => ({
            label: fieldLabel,
            required,
          }))
        ),
        {
          /*
           * Тип получил настоящий идентификатор — переписываем его и у самого
           * типа, и у объектов, которые успели на него сослаться. Иначе объект
           * останется висеть на временном идентификаторе, и после перезагрузки
           * страницы схема для него не найдётся.
           */
          onSuccess: (saved) =>
            set({
              customSchemas: get().customSchemas.map((item) =>
                item.id === schema.id ? saved : item
              ),
              entities: get().entities.map((item) =>
                item.type === schema.id ? { ...item, type: saved.id } : item
              ),
            }),
          onFailure: () =>
            set({
              customSchemas: get().customSchemas.filter(
                (item) => item.id !== schema.id
              ),
              entities: get().entities.filter(
                (item) => item.type !== schema.id
              ),
            }),
          fallback: "Не удалось создать тип.",
        }
      );

      if (!created || !caseId || !entity) return;

      await sync(addEntityAction(caseId, created.id), {
        onSuccess: (saved) => replaceEntityId(set, entity.id, saved),
        onFailure: () =>
          set({
            entities: get().entities.filter((item) => item.id !== entity.id),
          }),
        fallback: "Тип создан, но объект добавить не удалось.",
      });
    },

    setCustomSchemaOpen: (open) => set({ isCustomSchemaOpen: open }),

    deleteCustomSchema: (schemaId) => {
      const schema = get().customSchemas.find((item) => item.id === schemaId);
      const orphaned = get().entities.filter(
        (entity) => entity.type === schemaId
      );

      set({
        customSchemas: get().customSchemas.filter(
          (item) => item.id !== schemaId
        ),
        // Объекты осиротевшего типа держать негде — убираем вместе с типом.
        entities: get().entities.filter((entity) => entity.type !== schemaId),
      });

      if (!isRemote(get) || !schema) return;

      void sync(archiveEntitySchemaAction(schemaId), {
        onFailure: () =>
          set({
            customSchemas: [...get().customSchemas, schema],
            entities: [...get().entities, ...orphaned],
          }),
        fallback: "Не удалось удалить тип.",
      });
    },
  };
};

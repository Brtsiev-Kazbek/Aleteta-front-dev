import { EXTRACTION_RECIPES } from "@/data/mock-data";
import type { ExtractionRecipe } from "@/types";

/**
 * Всё, что пока только изображает работу модели.
 *
 * Это единственный файл, где живут таймеры и заранее заготовленные ответы.
 * Собран он не для красоты, а по необходимости: раньше имитация была
 * рассыпана по стору и выглядела ровно как рабочий код — разобрать, что уже
 * считает модель, а что рисует `setInterval`, можно было только чтением
 * построчно. Теперь граница видна по импорту.
 *
 * ЧТО ЗАМЕНЯЕТСЯ НАСТОЯЩИМ. Каждая функция отсюда должна однажды уступить
 * место заданию в `ai_jobs` — так же, как это уже произошло с распознаванием:
 * оно переехало в `slices/recognition.ts` и работает по-настоящему.
 *
 *   разбор файла        → задание `extract`
 *   генерация пакета    → задание `package`
 *   свободный запрос    → задание `freeform`
 *   массовая генерация  → задание `bulk`
 *   проверка на риски   → задание `review`
 *   ответы ассистента   → задание `assistant`
 */

/* ------------------------------------------------------------------ */
/*  ТАЙМЕРЫ                                                            */
/* ------------------------------------------------------------------ */

/**
 * Идентификаторы таймеров хранятся вне состояния: их нужно уметь погасить при
 * закрытии шторки, иначе таймер продолжает писать в стор уже закрытого экрана.
 */
const handles = new Map<string, number[]>();

export type DemoTimer =
  | "generation"
  | "batchReview"
  | "bulk"
  | "extraction"
  | "freeform";

export function startInterval(
  name: DemoTimer,
  callback: () => void,
  everyMs: number
): void {
  stopTimer(name);
  handles.set(name, [window.setInterval(callback, everyMs)]);
}

export function addTimeout(
  name: DemoTimer,
  callback: () => void,
  afterMs: number
): void {
  const existing = handles.get(name) ?? [];
  existing.push(window.setTimeout(callback, afterMs));
  handles.set(name, existing);
}

export function stopTimer(name: DemoTimer): void {
  for (const id of handles.get(name) ?? []) {
    window.clearInterval(id);
    window.clearTimeout(id);
  }
  handles.delete(name);
}

/* ------------------------------------------------------------------ */
/*  ЗАГОТОВЛЕННЫЕ ОТВЕТЫ                                               */
/* ------------------------------------------------------------------ */

/** Значения, которые «модель» подставляет в пустые поля по запросу. */
export const AI_SUGGESTED_VALUES: Record<string, string> = {
  landUse: "Для индивидуального жилищного строительства",
  owner: "Брциев К. Р.",
  cadastralNumber: "15:09:0000000:0002",
  area: "440 кв.м.",
  name: "Земельный участок (без наименования)",
  inn: "1513000000",
  kpp: "151301001",
  address: "г. Владикавказ, ул. Мира, д. 10",
  director: "Иванов И. И.",
  passport: "90 12 345678",
  snils: "123-456-789 00",
  registrationAddress: "г. Москва, ул. Тверская, д. 4",
};

/**
 * Подбирает рецепт разбора по имени файла. Если тип документа не узнан,
 * берём следующий рецепт по кругу: демонстрация должна показывать разные
 * карточки-приёмники, а не одну и ту же выписку.
 */
let recipeCursor = 0;

export function pickRecipe(fileName: string): ExtractionRecipe {
  const lower = fileName.toLowerCase();
  const matched = EXTRACTION_RECIPES.find((recipe) =>
    recipe.match.some((keyword) => lower.includes(keyword))
  );
  if (matched) return matched;

  const fallback =
    EXTRACTION_RECIPES[recipeCursor % EXTRACTION_RECIPES.length] ??
    EXTRACTION_RECIPES[0]!;
  recipeCursor += 1;
  return fallback;
}

/** Имя документа из свободного запроса: первая строка, до 70 знаков. */
export function titleFromPrompt(prompt: string): string {
  const firstLine = prompt.trim().split("\n")[0] ?? prompt.trim();
  const trimmed = firstLine.slice(0, 70).trim();
  return trimmed.length < firstLine.length ? `${trimmed}…` : trimmed;
}

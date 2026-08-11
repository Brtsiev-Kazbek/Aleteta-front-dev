"use client";

import { Fragment as Chunk, useMemo } from "react";

import { cn } from "@/lib/utils";

/**
 * Подсветка найденных слов.
 *
 * Двух видов, и оба здесь.
 *
 * Первый — фрагмент из базы: `ts_headline` уже расставил в нём `<mark>`. Второй
 * — текст страницы, в котором надо подсветить слова запроса самим.
 *
 * И в том и в другом случае строка режется на куски и собирается из обычных
 * элементов. Вставлять её как разметку нельзя ни при каких условиях: это текст
 * из чужого документа, а документ в приложение приносит кто угодно.
 *
 * О НУМЕРАЦИИ СОВПАДЕНИЙ. Подсветить мало — по совпадениям надо ходить
 * стрелками, а для этого у каждого должен быть свой номер, сквозной по всему
 * документу. Номера раздаются здесь: страница получает смещение — сколько
 * совпадений было до неё, — и нумерует свои от него. Считать эти смещения
 * умеет `countMatches`, и считает он ровно тем же разбором, что и подсветка:
 * две разные реализации разошлись бы на первом же необычном тексте.
 */

/** Фрагмент из `ts_headline`: метки уже расставлены, надо их развернуть. */
export function SearchFragment({ fragment }: { fragment: string }) {
  const parts = useMemo(() => splitByTags(fragment), [fragment]);

  return (
    <>
      {parts.map((part, index) => (
        <Chunk key={index}>
          {part.marked ? (
            <mark className="rounded-sm bg-amber-100 px-0.5 text-fg">
              {part.text}
            </mark>
          ) : (
            part.text
          )}
        </Chunk>
      ))}
    </>
  );
}

/**
 * Текст страницы с подсветкой слов запроса.
 *
 * Подсвечиваем по началу слова, а не по точному совпадению: человек ищет
 * «неустойка», а в договоре стоит «неустойки». Как это делается — в `stem`
 * ниже; главное требование к нему одно: не расходиться с тем, что нашла база.
 */
export function HighlightedText({
  text,
  terms,
  offset = 0,
  active = -1,
}: {
  text: string;
  terms: string[];
  /** Сколько совпадений было до этой страницы: отсюда идёт нумерация. */
  offset?: number;
  /** Номер совпадения, к которому сейчас перешли стрелками. */
  active?: number;
}) {
  const parts = useMemo(() => splitByTerms(text, terms), [text, terms]);

  let seen = -1;

  return (
    <>
      {parts.map((part, index) => {
        if (!part.marked) return <Chunk key={index}>{part.text}</Chunk>;

        seen += 1;
        const number = offset + seen;
        const isActive = number === active;

        return (
          <mark
            key={index}
            id={`match-${number}`}
            className={cn(
              "rounded-sm px-0.5 transition-colors",
              isActive
                ? "bg-amber-300 text-fg ring-1 ring-amber-500"
                : "bg-amber-100 text-fg"
            )}
          >
            {part.text}
          </mark>
        );
      })}
    </>
  );
}

/** Сколько совпадений даст `HighlightedText` на этом тексте. */
export function countMatches(text: string, terms: string[]): number {
  return splitByTerms(text, terms).filter((part) => part.marked).length;
}

interface Piece {
  text: string;
  marked: boolean;
}

const OPEN = "<mark>";
const CLOSE = "</mark>";

function splitByTags(fragment: string): Piece[] {
  const pieces: Piece[] = [];
  let rest = fragment;

  while (rest.length > 0) {
    const start = rest.indexOf(OPEN);

    if (start === -1) {
      pieces.push({ text: rest, marked: false });
      break;
    }

    if (start > 0) pieces.push({ text: rest.slice(0, start), marked: false });

    const after = rest.slice(start + OPEN.length);
    const end = after.indexOf(CLOSE);

    // Незакрытая метка — берём остаток как есть, лишь бы не потерять текст.
    if (end === -1) {
      pieces.push({ text: after, marked: true });
      break;
    }

    pieces.push({ text: after.slice(0, end), marked: true });
    rest = after.slice(end + CLOSE.length);
  }

  return pieces;
}

/**
 * Окончание, чтобы подсветка совпала с поиском.
 *
 * База ищет по основам: запрос «неустойка» находит и «неустойки», и
 * «неустойкой». Подсветка должна вести себя так же, иначе счётчик покажет одно
 * число, а глаз увидит другое — и доверия к поиску не будет.
 *
 * Полного разбора здесь не нужно и не место: достаточно отбросить хвост из
 * гласных и мягкого знака, оставив не меньше четырёх знаков. «Неустойкой»
 * становится «неустойк» и находит все свои формы; «договор» остаётся целым, а
 * формы добираются свободным хвостом справа.
 */
const ENDING = /[аяоеёиыуюьй]$/i;

function stem(term: string): string {
  let result = term;

  // Не больше двух знаков: дальше начинают склеиваться разные слова.
  for (let i = 0; i < 2 && result.length > 4 && ENDING.test(result); i += 1) {
    result = result.slice(0, -1);
  }

  return result;
}

function splitByTerms(text: string, terms: string[]): Piece[] {
  const usable = terms
    .map((term) => term.trim())
    .filter((term) => term.length >= 3)
    .map((term) => escapeRegExp(stem(term)));

  if (usable.length === 0) return [{ text, marked: false }];

  /*
   * Граница слова слева, свободный хвост справа: «неустойк» подсветит и
   * «неустойка», и «неустойки», но не найдёт себя внутри «переустойка».
   */
  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}])(${usable.join("|")})[\\p{L}]*`,
    "giu"
  );

  const pieces: Piece[] = [];
  let index = 0;

  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > index) pieces.push({ text: text.slice(index, at), marked: false });
    pieces.push({ text: match[0], marked: true });
    index = at + match[0].length;
  }

  if (index < text.length) pieces.push({ text: text.slice(index), marked: false });

  return pieces;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

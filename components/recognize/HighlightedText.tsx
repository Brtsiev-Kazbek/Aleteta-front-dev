"use client";

import { Fragment as Chunk, useMemo } from "react";

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
 */

/** Фрагмент из `ts_headline`: метки уже расставлены, надо их развернуть. */
export function SearchFragment({ fragment }: { fragment: string }) {
  const parts = useMemo(() => splitByTags(fragment), [fragment]);

  return (
    <>
      {parts.map((part, index) => (
        <Chunk key={index}>
          {part.marked ? (
            <mark className="rounded-sm bg-amber-100 px-0.5 text-stone-900">
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
 * «неустойка», а в договоре стоит «неустойки». Полного разбора по основам, как
 * в базе, здесь нет и не надо — это подсказка глазу на уже найденной странице.
 */
export function HighlightedText({
  text,
  terms,
}: {
  text: string;
  terms: string[];
}) {
  const parts = useMemo(() => splitByTerms(text, terms), [text, terms]);

  return (
    <>
      {parts.map((part, index) => (
        <Chunk key={index}>
          {part.marked ? (
            <mark className="rounded-sm bg-amber-100 px-0.5 text-stone-900">
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

function splitByTerms(text: string, terms: string[]): Piece[] {
  const usable = terms
    .map((term) => term.trim())
    .filter((term) => term.length >= 3)
    .map(escapeRegExp);

  if (usable.length === 0) return [{ text, marked: false }];

  /*
   * Граница слова слева, свободный хвост справа: «неустойка» подсветит
   * «неустойки», но не найдёт себя внутри «переустойка».
   */
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(${usable.join("|")})[\\p{L}]*`, "giu");

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

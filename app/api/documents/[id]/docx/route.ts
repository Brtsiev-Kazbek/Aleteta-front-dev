import { NextResponse } from "next/server";
import {
  AlignmentType,
  Document,
  HeadingLevel,
  PageBreak,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

import { isPersistedId } from "@/lib/ids";
import { requireSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";

const log = createLogger("docx");

/*
 * Выгрузка распознанного текста в Word.
 *
 * ПОЧЕМУ МАРШРУТ, А НЕ СЕРВЕРНОЕ ДЕЙСТВИЕ. Действие возвращает значение в
 * компонент, а тут нужен файл: заголовки с именем, тип содержимого, поток
 * байтов. Всё это умеет обычный обработчик запроса, и браузер сохраняет ответ
 * сам, без промежуточной ссылки и без base64 через пол-приложения.
 *
 * ПОЧЕМУ НА СЕРВЕРЕ, А НЕ В БРАУЗЕРЕ. Сборка .docx тянет за собой библиотеку
 * почти на мегабайт. Класть её в клиентский бандл ради кнопки, которую нажимают
 * раз в день, — плохая сделка: платят за неё все и на каждой загрузке страницы.
 *
 * ПРАВА ПРОВЕРЯЕТ БАЗА. Читаем под правами вошедшего: политики `document_pages`
 * привязаны к пространству, и чужой документ просто не найдётся. Своей проверки
 * владения здесь нет намеренно — она бы дублировала политику и однажды с ней
 * разошлась.
 */

/** Страница, не принёсшая ни одного символа, попадает в файл пометкой. */
const EMPTY_NOTE = "[страница пуста]";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isPersistedId(id)) {
    return NextResponse.json(
      { error: "Файл ещё не сохранён." },
      { status: 400 }
    );
  }

  try {
    await requireSession();
    const supabase = createClient();

    const [{ data: document }, { data: pages, error }] = await Promise.all([
      supabase
        .from("documents")
        .select("title, page_count")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("document_pages")
        .select("page, text, source")
        .eq("document_id", id)
        .order("page", { ascending: true }),
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!document || !pages || pages.length === 0) {
      return NextResponse.json(
        { error: "У документа ещё нет распознанного текста." },
        { status: 404 }
      );
    }

    const title = document.title ?? "Документ";

    /*
     * Каждая страница отбивается разрывом, а не пустой строкой. Человек,
     * открывший файл, должен видеть ту же нумерацию, что и в оригинале:
     * ссылаться потом будут на «страницу семь», и она обязана совпасть.
     */
    const body: Paragraph[] = [
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: `Распознанный текст · ${pages.length} ${plural(
              pages.length,
              "страница",
              "страницы",
              "страниц"
            )}`,
            italics: true,
            color: "767676",
          }),
        ],
        spacing: { after: 240 },
      }),
    ];

    for (const [index, row] of pages.entries()) {
      if (index > 0) {
        body.push(new Paragraph({ children: [new PageBreak()] }));
      }

      body.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Страница ${row.page}`,
              bold: true,
              size: 18,
              color: "767676",
            }),
          ],
          spacing: { after: 120 },
        })
      );

      const text = (row.text ?? "").trim();

      if (!text) {
        body.push(
          new Paragraph({
            children: [
              new TextRun({ text: EMPTY_NOTE, italics: true, color: "767676" }),
            ],
          })
        );
        continue;
      }

      /*
       * Абзацы разделяем по пустой строке, а не по каждому переводу строки:
       * модель переносит строки так, как они шли на листе, и построчный абзац
       * в Word превратил бы связный текст в лесенку.
       */
      for (const chunk of text.split(/\n{2,}/)) {
        body.push(
          new Paragraph({
            children: chunk
              .split("\n")
              .flatMap((line, lineIndex) =>
                lineIndex === 0
                  ? [new TextRun(line)]
                  : [new TextRun({ text: line, break: 1 })]
              ),
            spacing: { after: 120 },
          })
        );
      }
    }

    const file = new Document({
      creator: "Алетейя",
      title,
      description: "Распознанный текст документа",
      sections: [{ children: body }],
    });

    const buffer = await Packer.toBuffer(file);

    log.info("ready", {
      документ: id.slice(0, 8),
      страниц: pages.length,
      байт: buffer.byteLength,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        /*
         * Имя файла отдаём дважды. Латинская запись — для старых клиентов,
         * `filename*` в кодировке UTF-8 — для всех остальных: без неё браузер
         * сохранит русское название кракозябрами.
         */
        "Content-Disposition":
          `attachment; filename="document.docx"; ` +
          `filename*=UTF-8''${encodeURIComponent(safeName(title))}.docx`,
        "Cache-Control": "no-store",
      },
    });
  } catch (caught) {
    log.warn("fail", {
      документ: id.slice(0, 8),
      причина: caught instanceof Error ? caught.message : "неизвестно",
    });
    return NextResponse.json(
      { error: "Не удалось собрать файл." },
      { status: 500 }
    );
  }
}

/** Убирает из имени то, что ломает заголовок и файловую систему. */
function safeName(title: string): string {
  return title.replace(/[\\/:*?"<>|\n\r]+/g, " ").trim().slice(0, 80) || "Документ";
}

/** Склонение — копия из lib/utils, чтобы маршрут не тянул клиентский модуль. */
function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

/**
 * Разбор PDF: сколько страниц, что за текст, как выглядит страница.
 *
 * Движок — PDFium, тот же, что читает PDF в Chrome, собранный в WebAssembly.
 * Родных зависимостей у него нет, поэтому он одинаково работает в Edge
 * Function, в Node и в браузере — а значит, этот модуль можно проверить, не
 * поднимая Supabase.
 *
 * Зачем это вообще нужно. Распознавание берёт страницу картинкой и отправляет
 * её vision-модели. Чтобы получить картинку, PDF надо нарисовать — сам по себе
 * он не картинка, а описание того, что где нарисовать. Раньше на месте рендера
 * стояла заглушка: в модель уходила ссылка на сам файл, и любой документ
 * считался одностраничным.
 *
 * Второе, ради чего сюда пришёл PDFium: текстовый слой. У документа, набранного
 * в редакторе, текст уже лежит внутри файла — его достаточно прочитать. Такие
 * страницы не попадают в модель совсем, и это самая крупная экономия во всём
 * конвейере: договор из системы электронного документооборота обходится в ноль.
 *
 * Нумерация страниц здесь человеческая, с единицы — как в `document_pages` и
 * как в просмотрщике. Внутрь PDFium уходит его собственная, с нуля.
 */

/*
 * Имя без префикса `npm:` — намеренно. Версия прописана один раз в
 * `ai-worker/deno.json`, и благодаря этому тот же файл запускается под Node:
 * так его проверяет `npm run check:vision`, не поднимая Supabase.
 */
// deno-lint-ignore-file no-explicit-any
import { init } from "@embedpdf/pdfium";

/**
 * Где лежит сам движок.
 *
 * Пакет с npm — это тонкая обёртка, а код PDFium приходит отдельным файлом
 * `.wasm` на четыре с половиной мегабайта. Адрес вынесен в переменную: если
 * доступ к CDN закрыт, файл кладётся в своё хранилище и путь подменяется через
 * секрет `PDFIUM_WASM_URL`, не трогая код.
 */
const DEFAULT_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@embedpdf/pdfium@2.15.0/dist/pdfium.wasm";

/** Наибольшая сторона картинки страницы. Примерно 150 точек на дюйм для A4. */
const DEFAULT_MAX_SIDE = 1800;

/* Флаги отрисовки PDFium. */
const FPDF_ANNOT = 0x01; // рисовать аннотации: штампы и подписи живут в них
const FPDF_REVERSE_BYTE_ORDER = 0x10; // отдать RGBA вместо BGRA
const BITMAP_BGRA = 4;

/**
 * Движок загружается один раз на процесс.
 *
 * Разбор четырёх с половиной мегабайт wasm — заметная работа, а Edge Function
 * между вызовами живёт: на втором задании подряд движок уже готов.
 */
let engine: Promise<any> | null = null;

function loadEngine(wasmUrl: string): Promise<any> {
  if (engine) return engine;

  engine = (async () => {
    const response = await fetch(wasmUrl);
    if (!response.ok) {
      throw new Error(
        `Не удалось загрузить движок PDF (${response.status}) по адресу ${wasmUrl}`
      );
    }

    /*
     * `thisProgram` задаём явно, и это не украшательство.
     *
     * Движок собран Emscripten, а тот при запуске складывает внутрь wasm
     * подобие переменных окружения, и в переменную `_` кладёт путь к
     * запущенному файлу — по умолчанию `process.argv[1]`. Записывает он их
     * побайтово, с проверкой «символ помещается в байт». Пользователь с
     * кириллицей в имени папки — `C:\Users\Администратор\...` — роняет эту
     * проверку, и движок падает с `Aborted(Assertion failed)` ещё до того, как
     * увидит хоть один PDF.
     *
     * Разбирать такую ошибку по стеку внутри wasm — занятие на полдня, а
     * лечится она одной строкой: даём заведомо латинское имя.
     */
    const pdfium = await init({
      wasmBinary: await response.arrayBuffer(),
      thisProgram: "pdfium",
    });
    // Обязательный шаг: без него любой вызов PDFium возвращает ошибку.
    pdfium.PDFiumExt_Init();
    return pdfium;
  })().catch((error) => {
    // Неудачную попытку не кэшируем: следующее задание должно попробовать снова.
    engine = null;
    throw error;
  });

  return engine;
}

export interface PdfPageImage {
  /** PNG в виде `data:`-ссылки — в таком виде его принимает vision-модель. */
  dataUrl: string;
  width: number;
  height: number;
  /**
   * Доля закрашенных точек, от нуля до единицы.
   *
   * Нужна ради пустых страниц. В сшитом деле их всегда несколько — разделители,
   * обороты, чистые бланки. Отправлять их в модель значит платить за ответ
   * «страница пустая», который виден и так.
   */
  ink: number;
}

export interface PdfDocument {
  pageCount: number;
  /** Текстовый слой страницы. Пустая строка — слоя нет, это скан. */
  text(page: number): string;
  /** Страница картинкой. */
  render(page: number, maxSide?: number): Promise<PdfPageImage>;
  close(): void;
}

/** Похож ли файл на PDF. Смотрим сигнатуру, а не расширение и не mime. */
export function looksLikePdf(bytes: Uint8Array): boolean {
  return (
    bytes.length > 4 &&
    bytes[0] === 0x25 && // %
    bytes[1] === 0x50 && // P
    bytes[2] === 0x44 && // D
    bytes[3] === 0x46 // F
  );
}

/**
 * Открывает документ.
 *
 * Возвращённый объект держит память внутри wasm, поэтому `close()` обязателен —
 * иначе исполнитель, обрабатывающий задания подряд, вырастет на несколько
 * документов и упадёт по памяти.
 */
export async function openPdf(
  bytes: Uint8Array,
  options: { wasmUrl?: string } = {}
): Promise<PdfDocument> {
  const pdfium = await loadEngine(options.wasmUrl || DEFAULT_WASM_URL);
  const heap = pdfium.pdfium;

  const filePtr = heap.wasmExports.malloc(bytes.length);
  heap.HEAPU8.set(bytes, filePtr);

  const doc = pdfium.FPDF_LoadMemDocument(filePtr, bytes.length, "");

  if (!doc) {
    heap.wasmExports.free(filePtr);
    throw new Error(loadErrorMessage(pdfium.FPDF_GetLastError()));
  }

  const pageCount = pdfium.FPDF_GetPageCount(doc);

  /**
   * Страница открывается и закрывается вокруг каждой операции.
   *
   * Держать открытыми все страницы разом нельзя: PDFium хранит для каждой
   * разобранное содержимое, и на документе в двести страниц это сотни
   * мегабайт.
   */
  function withPage<T>(page: number, body: (handle: number) => T): T {
    if (page < 1 || page > pageCount) {
      throw new Error(`Страницы ${page} нет: в документе их ${pageCount}`);
    }

    const handle = pdfium.FPDF_LoadPage(doc, page - 1);
    if (!handle) throw new Error(`Страница ${page} не открывается`);

    try {
      return body(handle);
    } finally {
      pdfium.FPDF_ClosePage(handle);
    }
  }

  return {
    pageCount,

    text(page) {
      return withPage(page, (handle) => {
        const textPage = pdfium.FPDFText_LoadPage(handle);
        if (!textPage) return "";

        try {
          const chars = pdfium.FPDFText_CountChars(textPage);
          if (chars <= 0) return "";

          // PDFium отдаёт UTF-16 и дописывает нулевой символ — отсюда +1.
          const bufferPtr = heap.wasmExports.malloc((chars + 1) * 2);
          try {
            pdfium.FPDFText_GetText(textPage, 0, chars, bufferPtr);
            return normalizeText(heap.UTF16ToString(bufferPtr));
          } finally {
            heap.wasmExports.free(bufferPtr);
          }
        } finally {
          pdfium.FPDFText_ClosePage(textPage);
        }
      });
    },

    render(page, maxSide = DEFAULT_MAX_SIDE) {
      const raster = withPage(page, (handle) => {
        /*
         * Размер страницы PDF задан в пунктах — семьдесят вторых долях дюйма.
         * Масштаб считаем от наибольшей стороны, чтобы альбомная страница не
         * оказалась вчетверо крупнее книжной.
         */
        const widthPt = pdfium.FPDF_GetPageWidthF(handle);
        const heightPt = pdfium.FPDF_GetPageHeightF(handle);
        const scale = maxSide / Math.max(widthPt, heightPt);

        const width = Math.max(1, Math.round(widthPt * scale));
        const height = Math.max(1, Math.round(heightPt * scale));
        const stride = width * 4;

        const bufferPtr = heap.wasmExports.malloc(stride * height);
        const bitmap = pdfium.FPDFBitmap_CreateEx(
          width,
          height,
          BITMAP_BGRA,
          bufferPtr,
          stride
        );

        try {
          // Белая подложка: без неё прозрачные места станут чёрными.
          pdfium.FPDFBitmap_FillRect(bitmap, 0, 0, width, height, 0xffffffff);
          pdfium.FPDF_RenderPageBitmap(
            bitmap,
            handle,
            0,
            0,
            width,
            height,
            0,
            FPDF_ANNOT | FPDF_REVERSE_BYTE_ORDER
          );

          // Копия обязательна: после free эта область памяти будет чужой.
          const rgba = heap.HEAPU8.slice(bufferPtr, bufferPtr + stride * height);
          return { rgba, width, height };
        } finally {
          pdfium.FPDFBitmap_Destroy(bitmap);
          heap.wasmExports.free(bufferPtr);
        }
      });

      return encodePng(raster.rgba, raster.width, raster.height).then((png) => ({
        dataUrl: `data:image/png;base64,${base64(png)}`,
        width: raster.width,
        height: raster.height,
        ink: inkRatio(raster.rgba),
      }));
    },

    close() {
      pdfium.FPDF_CloseDocument(doc);
      heap.wasmExports.free(filePtr);
    },
  };
}

/** Готовая картинка — тоже страница, только сразу. */
export function imageDataUrl(bytes: Uint8Array, mimeType: string): string {
  return `data:${mimeType};base64,${base64(bytes)}`;
}

/* ------------------------------------------------------------------ */
/*  ТЕКСТ                                                              */
/* ------------------------------------------------------------------ */

/**
 * Чистка текстового слоя.
 *
 * PDFium отдаёт то, что записано в файле, а там встречается мусор: разрыв
 * строки внутри слова, неразрывные пробелы вместо обычных, символ подстановки
 * на месте шрифта без кодировки. Модели это мешает не сильно, а вот поиску по
 * тексту и сравнению — заметно.
 */
function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    .replace(/�/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Сколько на странице краски.
 *
 * По каждой шестнадцатой точке: для решения «пусто или нет» этого с избытком,
 * а полный проход по восьми мегабайтам стоил бы столько же, сколько сам
 * рендер.
 */
function inkRatio(rgba: Uint8Array): number {
  const STEP = 16 * 4;
  let seen = 0;
  let inked = 0;

  for (let i = 0; i < rgba.length; i += STEP) {
    seen += 1;
    // Порог мягкий: сероватый фон скана — это ещё не текст.
    if (rgba[i] < 230 || rgba[i + 1] < 230 || rgba[i + 2] < 230) inked += 1;
  }

  return seen === 0 ? 0 : inked / seen;
}

/* ------------------------------------------------------------------ */
/*  PNG                                                                */
/* ------------------------------------------------------------------ */

/*
 * Кодировщик PNG на полсотни строк вместо ещё одной зависимости.
 *
 * Всё сложное в PNG — это сжатие, а оно есть в самой платформе:
 * `CompressionStream("deflate")` выдаёт ровно тот формат, который лежит внутри
 * блока IDAT. Остаётся расставить заголовки и посчитать контрольные суммы.
 *
 * Формат выбран не от хорошей жизни: JPEG для скана был бы в несколько раз
 * компактнее, но его кодировщик в платформу не встроен, а тянуть родную
 * библиотеку в Edge Function нельзя. Документ, который в основном белый,
 * сжимается PNG хорошо, так что разница терпимая.
 */

const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

async function encodePng(
  rgba: Uint8Array,
  width: number,
  height: number
): Promise<Uint8Array> {
  /*
   * Прозрачность отбрасываем: страница уже нарисована на белом, альфа-канал
   * лишь добавил бы четверть объёма.
   *
   * Каждая строка предваряется байтом фильтра. Фильтр 2 — «вычесть строку
   * выше»: у документа соседние строки почти одинаковы, и после вычитания
   * получаются нули, которые сжимаются в ничто.
   */
  const rowLength = width * 3;
  const raw = new Uint8Array((rowLength + 1) * height);
  const previous = new Uint8Array(rowLength);
  const current = new Uint8Array(rowLength);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const from = (y * width + x) * 4;
      const to = x * 3;
      current[to] = rgba[from];
      current[to + 1] = rgba[from + 1];
      current[to + 2] = rgba[from + 2];
    }

    const rowStart = y * (rowLength + 1);
    raw[rowStart] = 2;
    for (let i = 0; i < rowLength; i += 1) {
      raw[rowStart + 1 + i] = (current[i] - previous[i]) & 0xff;
    }

    previous.set(current);
  }

  const compressed = await deflate(raw);

  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  header[8] = 8; // восемь бит на канал
  header[9] = 2; // цвет: три канала без прозрачности
  header[10] = 0; // сжатие: другого в PNG не бывает
  header[11] = 0; // набор фильтров: тоже единственный
  header[12] = 0; // без чересстрочности

  return concat([
    PNG_SIGNATURE,
    chunk("IHDR", header),
    chunk("IDAT", compressed),
    chunk("IEND", new Uint8Array(0)),
  ]);
}

async function deflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new CompressionStream("deflate"));

  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Блок PNG: длина, имя, данные, контрольная сумма имени вместе с данными. */
function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length + 12);
  const view = new DataView(out.buffer);

  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i += 1) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));

  return out;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let value = i;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[i] = value >>> 0;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i += 1) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);

  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }

  return out;
}

/**
 * Двоичные данные в base64.
 *
 * Порциями, а не одним вызовом: `String.fromCharCode(...массив)` на картинке в
 * мегабайт переполняет стек аргументов.
 */
function base64(bytes: Uint8Array): string {
  const CHUNK = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }

  return btoa(binary);
}

/** Коды ошибок открытия из `fpdfview.h` — человеку от номера толку нет. */
function loadErrorMessage(code: number): string {
  switch (code) {
    case 3:
      return "Файл не читается как PDF: возможно, он повреждён";
    case 4:
      return "PDF защищён паролем — распознать его нельзя";
    case 5:
      return "PDF защищён от чтения";
    default:
      return `PDF не открывается (код ${code})`;
  }
}

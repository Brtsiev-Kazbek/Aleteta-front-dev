/**
 * Кодировщик JPEG для страниц документа.
 *
 * Зачем он вообще нужен, если PNG платформа умеет сама и умеет без потерь.
 * Затем, что на сканах PNG перестаёт работать. Бумажный шум — набор случайных
 * точек, а случайное сжатием без потерь не жмётся: обычная страница договора
 * укладывается в двадцать килобайт, а тот же лист со сканера раздувается до
 * семисот. Сто страниц — семьдесят мегабайт, и это при десятке страниц в
 * работе разом.
 *
 * Поэтому основной формат всё-таки PNG, а этот кодировщик — отступление для
 * страниц, где без потерь получается неподъёмно (см. `maxBytes` в pdf.ts).
 * JPEG выбрасывает мелкие переходы яркости, то есть ровно тот самый шум.
 *
 * ЧТО ИМЕННО ТЕРЯЕТСЯ. Замер на странице договора при качестве 85: средняя
 * ошибка по странице 0.11 уровня яркости из 255, на самих буквах 4.1, границу
 * «тёмное/светлое» переходят 0.018 % точек. Очертания букв остаются на месте —
 * плывёт сглаживание по краю штриха.
 *
 * ЧЕГО ЭТО НЕ ДАЁТ. Денег это не экономит. Модель считает картинку не в
 * байтах, а в точках: изображение одного размера стоит одинаково, хоть PNG,
 * хоть JPEG. Выгода здесь в скорости и в объёме передачи, а счёт определяется
 * размером страницы в точках и длиной ответа.
 *
 * Кодировщик самый простой из возможных: последовательный, в оттенках серого,
 * со стандартными таблицами из приложения K к спецификации. Цвет не нужен —
 * страницу мы и рисуем серой.
 */

/* ------------------------------------------------------------------ */
/*  ТАБЛИЦЫ ИЗ СПЕЦИФИКАЦИИ                                            */
/* ------------------------------------------------------------------ */

/** Порядок обхода блока 8×8 «змейкой»: от низких частот к высоким. */
const ZIGZAG = [
  0, 1, 8, 16, 9, 2, 3, 10, 17, 24, 32, 25, 18, 11, 4, 5, 12, 19, 26, 33, 40,
  48, 41, 34, 27, 20, 13, 6, 7, 14, 21, 28, 35, 42, 49, 56, 57, 50, 43, 36, 29,
  22, 15, 23, 30, 37, 44, 51, 58, 59, 52, 45, 38, 31, 39, 46, 53, 60, 61, 54,
  47, 55, 62, 63,
];

/**
 * Таблица квантования яркости.
 *
 * Здесь и происходит потеря: чем больше число, тем грубее округляется
 * соответствующая частота. Числа растут к правому нижнему углу — там живут
 * самые мелкие детали, которые глаз почти не различает.
 */
const QUANT_LUMINANCE = [
  16, 11, 10, 16, 24, 40, 51, 61, 12, 12, 14, 19, 26, 58, 60, 55, 14, 13, 16,
  24, 40, 57, 69, 56, 14, 17, 22, 29, 51, 87, 80, 62, 18, 22, 37, 56, 68, 109,
  103, 77, 24, 35, 55, 64, 81, 104, 113, 92, 49, 64, 78, 87, 103, 121, 120,
  101, 72, 92, 95, 98, 112, 100, 103, 99,
];

/* Стандартные коды Хаффмана: сколько кодов какой длины и какие значения. */

const DC_BITS = [0, 0, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0];
const DC_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const AC_BITS = [
  0, 0, 2, 1, 3, 3, 2, 4, 3, 5, 5, 4, 4, 0, 0, 1, 0x7d,
];

const AC_VALUES = [
  0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06, 0x13,
  0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xa1, 0x08, 0x23, 0x42,
  0xb1, 0xc1, 0x15, 0x52, 0xd1, 0xf0, 0x24, 0x33, 0x62, 0x72, 0x82, 0x09, 0x0a,
  0x16, 0x17, 0x18, 0x19, 0x1a, 0x25, 0x26, 0x27, 0x28, 0x29, 0x2a, 0x34, 0x35,
  0x36, 0x37, 0x38, 0x39, 0x3a, 0x43, 0x44, 0x45, 0x46, 0x47, 0x48, 0x49, 0x4a,
  0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59, 0x5a, 0x63, 0x64, 0x65, 0x66, 0x67,
  0x68, 0x69, 0x6a, 0x73, 0x74, 0x75, 0x76, 0x77, 0x78, 0x79, 0x7a, 0x83, 0x84,
  0x85, 0x86, 0x87, 0x88, 0x89, 0x8a, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98,
  0x99, 0x9a, 0xa2, 0xa3, 0xa4, 0xa5, 0xa6, 0xa7, 0xa8, 0xa9, 0xaa, 0xb2, 0xb3,
  0xb4, 0xb5, 0xb6, 0xb7, 0xb8, 0xb9, 0xba, 0xc2, 0xc3, 0xc4, 0xc5, 0xc6, 0xc7,
  0xc8, 0xc9, 0xca, 0xd2, 0xd3, 0xd4, 0xd5, 0xd6, 0xd7, 0xd8, 0xd9, 0xda, 0xe1,
  0xe2, 0xe3, 0xe4, 0xe5, 0xe6, 0xe7, 0xe8, 0xe9, 0xea, 0xf1, 0xf2, 0xf3, 0xf4,
  0xf5, 0xf6, 0xf7, 0xf8, 0xf9, 0xfa,
];

/* ------------------------------------------------------------------ */
/*  КОДЫ ХАФФМАНА                                                      */
/* ------------------------------------------------------------------ */

interface Code {
  value: number;
  length: number;
}

/**
 * Строит таблицу кодов из «сколько кодов какой длины».
 *
 * Порядок обхода задан спецификацией и подобран так, что более частым
 * значениям достаются короткие коды. Отступать от него нельзя: декодер строит
 * ту же таблицу по тем же правилам.
 */
function buildCodes(bits: number[], values: number[]): Map<number, Code> {
  const codes = new Map<number, Code>();

  let code = 0;
  let index = 0;

  for (let length = 1; length <= 16; length += 1) {
    for (let i = 0; i < (bits[length] ?? 0); i += 1) {
      const value = values[index];
      index += 1;
      if (value === undefined) continue;
      codes.set(value, { value: code, length });
      code += 1;
    }
    code <<= 1;
  }

  return codes;
}

const DC_CODES = buildCodes(DC_BITS, DC_VALUES);
const AC_CODES = buildCodes(AC_BITS, AC_VALUES);

/* ------------------------------------------------------------------ */
/*  ЗАПИСЬ                                                             */
/* ------------------------------------------------------------------ */

/**
 * Поток с побитовой записью.
 *
 * Коды Хаффмана не выравнены по байтам, поэтому биты копятся в буфере и
 * уходят целыми байтами. Отдельное правило: байт 0xFF в потоке данных
 * обязательно дополняется нулём — иначе декодер примет его за начало метки.
 */
class BitWriter {
  private readonly bytes: number[] = [];
  private buffer = 0;
  private filled = 0;

  writeByte(value: number): void {
    this.bytes.push(value & 0xff);
  }

  writeWord(value: number): void {
    this.writeByte(value >> 8);
    this.writeByte(value);
  }

  writeBits(value: number, length: number): void {
    for (let i = length - 1; i >= 0; i -= 1) {
      this.buffer = (this.buffer << 1) | ((value >> i) & 1);
      this.filled += 1;

      if (this.filled === 8) {
        this.bytes.push(this.buffer);
        // Экранирование: 0xFF в данных не должен выглядеть началом метки.
        if (this.buffer === 0xff) this.bytes.push(0);
        this.buffer = 0;
        this.filled = 0;
      }
    }
  }

  /** Добивает последний байт единицами, как требует спецификация. */
  flushBits(): void {
    while (this.filled > 0) this.writeBits(1, 1);
  }

  toBytes(): Uint8Array {
    return new Uint8Array(this.bytes);
  }
}

/* ------------------------------------------------------------------ */
/*  ПРЕОБРАЗОВАНИЕ                                                     */
/* ------------------------------------------------------------------ */

/**
 * Дискретное косинусное преобразование блока 8×8 по схеме Араи—Агуи—Накадзимы.
 *
 * Прямое определение требует четырёх тысяч умножений на блок, разделение по
 * строкам и столбцам — тысячи, эта схема — восьмидесяти. На странице двадцать
 * тысяч блоков, и разница между вариантами получается такой: треть секунды
 * процессора, сто двадцать миллисекунд и тридцать. При двух секундах на весь
 * запуск исполнителя выбор очевиден.
 *
 * Плата за скорость одна: коэффициенты выходят умноженными на
 * `8·s[u]·s[v]`. Это не приближение и не потеря точности — просто другой
 * масштаб, и он складывается в таблицу квантования, на которую всё равно
 * делить. Проверено сравнением с прямым определением: после деления
 * коэффициенты совпадают.
 */

/** Множители масштаба, которые схема оставляет в ответе. */
function aanScale(u: number): number {
  return u === 0 ? 1 : Math.cos((u * Math.PI) / 16) * Math.SQRT2;
}

/** Постоянные схемы: косинусы, сведённые к пяти умножениям на проход. */
const C4 = 0.707106781186548; // cos(4π/16)
const C2_6 = 0.382683432365090; // sin(6π/16) − cos(6π/16)
const C2 = 0.541196100146197; // cos(6π/16)·√2
const C6 = 1.306562964876377; // cos(2π/16)·√2

/**
 * Одномерное преобразование восьми значений.
 *
 * Сначала складываем и вычитаем зеркальные пары — так задача распадается на
 * чётную и нечётную половины, каждая вдвое меньше. Дальше то же самое внутри
 * половин. Умножения остаются только там, где без них не обойтись.
 */
function dct1d(x: Float32Array, offset: number, stride: number, out: Float32Array): void {
  const x0 = x[offset]!;
  const x1 = x[offset + stride]!;
  const x2 = x[offset + stride * 2]!;
  const x3 = x[offset + stride * 3]!;
  const x4 = x[offset + stride * 4]!;
  const x5 = x[offset + stride * 5]!;
  const x6 = x[offset + stride * 6]!;
  const x7 = x[offset + stride * 7]!;

  const t0 = x0 + x7;
  const t7 = x0 - x7;
  const t1 = x1 + x6;
  const t6 = x1 - x6;
  const t2 = x2 + x5;
  const t5 = x2 - x5;
  const t3 = x3 + x4;
  const t4 = x3 - x4;

  /* Чётная половина. */
  const e0 = t0 + t3;
  const e3 = t0 - t3;
  const e1 = t1 + t2;
  const e2 = t1 - t2;

  out[0] = e0 + e1;
  out[4] = e0 - e1;

  const z1 = (e2 + e3) * C4;
  out[2] = e3 + z1;
  out[6] = e3 - z1;

  /* Нечётная половина. */
  const u0 = t4 + t5;
  const u1 = t5 + t6;
  const u2 = t6 + t7;

  const z5 = (u0 - u2) * C2_6;
  const z2 = C2 * u0 + z5;
  const z4 = C6 * u2 + z5;
  const z3 = u1 * C4;

  const z11 = t7 + z3;
  const z13 = t7 - z3;

  out[5] = z13 + z2;
  out[3] = z13 - z2;
  out[1] = z11 + z4;
  out[7] = z11 - z4;
}

/** Промежуточные буферы. Одни на все блоки: их на странице двадцать тысяч. */
const ROWS = new Float32Array(64);
const LINE = new Float32Array(8);

function forwardDct(block: Float32Array, out: Float32Array): void {
  for (let y = 0; y < 8; y += 1) {
    dct1d(block, y * 8, 1, LINE);
    for (let u = 0; u < 8; u += 1) ROWS[y * 8 + u] = LINE[u]!;
  }

  for (let u = 0; u < 8; u += 1) {
    dct1d(ROWS, u, 8, LINE);
    for (let v = 0; v < 8; v += 1) out[v * 8 + u] = LINE[v]!;
  }
}

/** Сколько бит нужно на число и как оно кодируется. */
function magnitude(value: number): { size: number; bits: number } {
  if (value === 0) return { size: 0, bits: 0 };

  const absolute = Math.abs(value);
  let size = 0;
  while (absolute >> size) size += 1;

  // Отрицательные пишутся дополнением: −1 при размере 1 это ноль.
  return { size, bits: value > 0 ? value : value + (1 << size) - 1 };
}

/* ------------------------------------------------------------------ */
/*  КОДИРОВАНИЕ                                                        */
/* ------------------------------------------------------------------ */

/**
 * Страница в оттенках серого → JPEG.
 *
 * @param gray один байт яркости на точку, слева направо и сверху вниз
 * @param quality 1–100. Для сканов разумны 80–90: выше быстро растёт вес,
 *   ниже начинают плыть тонкие линии букв.
 */
export function encodeJpegGray(
  gray: Uint8Array,
  width: number,
  height: number,
  quality = 85
): Uint8Array {
  const quant = scaleQuantization(quality);
  const divisors = foldAanScale(quant);
  const writer = new BitWriter();

  writeHeaders(writer, width, height, quant);

  const block = new Float32Array(64);
  const transformed = new Float32Array(64);
  let previousDc = 0;

  // Блоки идут слева направо, сверху вниз — так требует последовательный JPEG.
  for (let blockY = 0; blockY < height; blockY += 8) {
    for (let blockX = 0; blockX < width; blockX += 8) {
      /*
       * Края изображения редко кратны восьми. Недостающие точки повторяют
       * последнюю имеющуюся: нули дали бы на краю чёрную полосу, а резкий
       * перепад — заметный ореол вдоль неё.
       */
      for (let y = 0; y < 8; y += 1) {
        const sourceY = Math.min(blockY + y, height - 1);
        for (let x = 0; x < 8; x += 1) {
          const sourceX = Math.min(blockX + x, width - 1);
          // Сдвиг на 128: преобразование работает вокруг нуля.
          block[y * 8 + x] = (gray[sourceY * width + sourceX] ?? 255) - 128;
        }
      }

      forwardDct(block, transformed);
      previousDc = writeBlock(writer, transformed, divisors, previousDc);
    }
  }

  writer.flushBits();
  writer.writeWord(0xffd9); // конец изображения

  return writer.toBytes();
}

/** Один блок: разность постоянной составляющей и серии переменных. */
function writeBlock(
  writer: BitWriter,
  transformed: Float32Array,
  divisors: Float32Array,
  previousDc: number
): number {
  const quantized = new Int32Array(64);

  for (let i = 0; i < 64; i += 1) {
    const at = ZIGZAG[i]!;
    quantized[i] = Math.round(transformed[at]! / divisors[at]!);
  }

  /* Постоянная составляющая пишется разностью с предыдущим блоком: у
     соседних участков бумаги яркость почти одинакова, и разность близка к нулю. */
  const dc = quantized[0]!;
  const diff = magnitude(dc - previousDc);
  writeCode(writer, DC_CODES, diff.size);
  if (diff.size > 0) writer.writeBits(diff.bits, diff.size);

  /* Переменные составляющие: пары «сколько нулей подряд» и значение. */
  let zeros = 0;

  for (let i = 1; i < 64; i += 1) {
    const value = quantized[i]!;

    if (value === 0) {
      zeros += 1;
      continue;
    }

    // Больше пятнадцати нулей подряд одной парой не описать.
    while (zeros > 15) {
      writeCode(writer, AC_CODES, 0xf0);
      zeros -= 16;
    }

    const encoded = magnitude(value);
    writeCode(writer, AC_CODES, (zeros << 4) | encoded.size);
    writer.writeBits(encoded.bits, encoded.size);
    zeros = 0;
  }

  // Хвост из нулей описывается одним кодом «дальше пусто».
  if (zeros > 0) writeCode(writer, AC_CODES, 0x00);

  return dc;
}

function writeCode(writer: BitWriter, codes: Map<number, Code>, key: number): void {
  const code = codes.get(key);
  if (!code) throw new Error(`Нет кода Хаффмана для ${key}`);
  writer.writeBits(code.value, code.length);
}

/**
 * Делители для быстрого преобразования.
 *
 * Схема оставляет в ответе множитель `8·s[u]·s[v]`, и убирать его отдельным
 * проходом было бы расточительством: делить на таблицу квантования всё равно
 * придётся, так пусть множитель делится заодно.
 *
 * В заголовок файла уходит при этом обычная таблица, без множителя: декодер о
 * нашей схеме ничего не знает и знать не должен.
 */
function foldAanScale(quant: Int32Array): Float32Array {
  const divisors = new Float32Array(64);

  for (let v = 0; v < 8; v += 1) {
    for (let u = 0; u < 8; u += 1) {
      divisors[v * 8 + u] = quant[v * 8 + u]! * 8 * aanScale(u) * aanScale(v);
    }
  }

  return divisors;
}

/**
 * Таблица квантования под заданное качество.
 *
 * Формула из спецификации: качество пересчитывается в множитель, на который
 * умножаются табличные числа. Ниже пятидесяти — растёт грубее, выше — мельче.
 */
function scaleQuantization(quality: number): Int32Array {
  const clamped = Math.min(Math.max(quality, 1), 100);
  const factor = clamped < 50 ? 5000 / clamped : 200 - clamped * 2;

  const table = new Int32Array(64);
  for (let i = 0; i < 64; i += 1) {
    const value = Math.floor((QUANT_LUMINANCE[i]! * factor + 50) / 100);
    table[i] = Math.min(Math.max(value, 1), 255);
  }

  return table;
}

/* ------------------------------------------------------------------ */
/*  ЗАГОЛОВКИ                                                          */
/* ------------------------------------------------------------------ */

function writeHeaders(
  writer: BitWriter,
  width: number,
  height: number,
  table: Int32Array
): void {
  writer.writeWord(0xffd8); // начало изображения

  // Опознавательный блок JFIF: без него часть просмотрщиков капризничает.
  writer.writeWord(0xffe0);
  writer.writeWord(16);
  for (const char of "JFIF") writer.writeByte(char.charCodeAt(0));
  writer.writeByte(0);
  writer.writeWord(0x0101); // версия 1.1
  writer.writeByte(0); // единицы плотности не заданы
  writer.writeWord(1);
  writer.writeWord(1);
  writer.writeByte(0);
  writer.writeByte(0);

  // Таблица квантования — в том же порядке «змейкой», в каком её ждёт декодер.
  writer.writeWord(0xffdb);
  writer.writeWord(67);
  writer.writeByte(0);
  for (let i = 0; i < 64; i += 1) writer.writeByte(table[ZIGZAG[i]!]!);

  // Кадр: размеры и единственная составляющая — яркость.
  writer.writeWord(0xffc0);
  writer.writeWord(11);
  writer.writeByte(8); // точность
  writer.writeWord(height);
  writer.writeWord(width);
  writer.writeByte(1); // одна составляющая
  writer.writeByte(1); // её номер
  writer.writeByte(0x11); // без прореживания
  writer.writeByte(0); // таблица квантования номер ноль

  writeHuffmanTable(writer, 0x00, DC_BITS, DC_VALUES);
  writeHuffmanTable(writer, 0x10, AC_BITS, AC_VALUES);

  // Начало данных.
  writer.writeWord(0xffda);
  writer.writeWord(8);
  writer.writeByte(1);
  writer.writeByte(1);
  writer.writeByte(0x00); // таблицы Хаффмана: постоянная 0, переменная 0
  writer.writeByte(0);
  writer.writeByte(63);
  writer.writeByte(0);
}

function writeHuffmanTable(
  writer: BitWriter,
  id: number,
  bits: number[],
  values: number[]
): void {
  writer.writeWord(0xffc4);
  writer.writeWord(19 + values.length);
  writer.writeByte(id);
  for (let i = 1; i <= 16; i += 1) writer.writeByte(bits[i] ?? 0);
  for (const value of values) writer.writeByte(value);
}

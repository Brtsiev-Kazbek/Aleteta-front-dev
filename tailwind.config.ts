import type { Config } from "tailwindcss";

/**
 * Тема.
 *
 * Раньше этот файл был заготовкой shadcn, к которой почти не притрагивались:
 * ни шрифтов, ни шкалы кеглей, ни отступов, ни теней. Весь стиль жил классами
 * прямо в компонентах — тысяча двести `stone-*` на сотню файлов, — и сменить
 * оформление можно было только обойдя их все руками. Второй раз то же самое
 * пришлось бы делать ради тёмной темы.
 *
 * Теперь здесь описан слой смысла: не «серый девятисотый», а «основной текст».
 * Значения лежат в `globals.css` переменными, а переменные — единственное, что
 * меняется при смене оформления и при переключении темы.
 *
 * ПОЧЕМУ КАНАЛЫ, А НЕ ГОТОВЫЙ ЦВЕТ. Переменная хранит `28 25 23`, а не
 * `rgb(28 25 23)`, потому что иначе перестают работать модификаторы прозрачности
 * — `bg-surface/70`, которых в проекте больше сотни. Форма `rgb(var(--x) /
 * <alpha-value>)` даёт и цвет, и прозрачность.
 *
 * СТАРЫЕ ТОКЕНЫ shadcn (`background`, `muted`, `ring` и прочие) оставлены
 * нетронутыми: на них ещё держатся четыре примитива. Уедут вместе с ними.
 */

/** Цвет из переменной с поддержкой модификатора прозрачности. */
function channel(name: string) {
  return `rgb(var(--${name}) / <alpha-value>)`;
}

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* --- Поверхности ------------------------------------------ */
        bg: channel("bg"),
        surface: {
          DEFAULT: channel("surface"),
          2: channel("surface-2"),
          3: channel("surface-3"),
        },
        /*
         * Намеренно тёмная поверхность: герой лендинга, обложка рабочего стола,
         * левая половина экрана входа. Она тёмная в любой теме — это приём, а не
         * следствие настроек, и переворачивать её вместе с темой нельзя, иначе
         * акцент перестанет быть акцентом.
         */
        inverse: {
          DEFAULT: channel("inverse"),
          2: channel("inverse-2"),
          3: channel("inverse-3"),
          fg: channel("inverse-fg"),
          line: channel("inverse-line"),
        },

        /* --- Текст ------------------------------------------------- */
        fg: {
          DEFAULT: channel("fg"),
          muted: channel("fg-muted"),
          soft: channel("fg-soft"),
          subtle: channel("fg-subtle"),
          faint: channel("fg-faint"),
          ghost: channel("fg-ghost"),
        },

        /* --- Линии ------------------------------------------------- */
        line: {
          DEFAULT: channel("line"),
          soft: channel("line-soft"),
          strong: channel("line-strong"),
        },

        /* --- Фирменный акцент -------------------------------------- */
        /*
         * `brand`, а не `accent`: имя `accent` занято остатками shadcn, и два
         * разных смысла под одним именем — верный способ перекрасить не то.
         */
        brand: {
          DEFAULT: channel("brand"),
          strong: channel("brand-strong"),
          soft: channel("brand-soft"),
          line: channel("brand-line"),
          fg: channel("brand-fg"),
        },

        /* --- Сигналы ------------------------------------------------ */
        /*
         * Три состояния, которые в юридическом продукте значат разное и никогда
         * не должны сливаться: проверено, требует внимания, ошибка.
         */
        ok: {
          DEFAULT: channel("ok"),
          fg: channel("ok-fg"),
          bg: channel("ok-bg"),
          line: channel("ok-line"),
        },
        warn: {
          DEFAULT: channel("warn"),
          fg: channel("warn-fg"),
          bg: channel("warn-bg"),
          line: channel("warn-line"),
        },
        danger: {
          DEFAULT: channel("danger"),
          fg: channel("danger-fg"),
          bg: channel("danger-bg"),
          line: channel("danger-line"),
        },

        focus: channel("focus"),

        /* --- Наследие shadcn: уедет вместе с примитивами ------------ */
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },

      /**
       * Шкала кеглей.
       *
       * Взамен пятисот пятидесяти произвольных значений, вписанных прямо в
       * компоненты: `text-[9px]`, `text-[10px]`, `text-[11px]`, `text-[12px]`,
       * `text-[12.5px]`, `text-[13px]` — шесть ступеней там, где нужно три,
       * и ни одна не совпадает со шкалой Tailwind.
       *
       * Имена по роли, а не по размеру: `label` останется подписью, даже если
       * когда-нибудь вырастет с одиннадцати до двенадцати.
       *
       * Межстрочный интервал задан вместе с кеглем — иначе он теряется, и
       * подпись в одну строку и абзац в пять получают одинаковый.
       */
      fontSize: {
        label: ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.06em" }],
        caption: ["0.75rem", { lineHeight: "1.125rem" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.25rem" }],
        body: ["0.9375rem", { lineHeight: "1.5rem" }],
        "body-lg": ["1rem", { lineHeight: "1.625rem" }],
        "title-sm": ["1.0625rem", { lineHeight: "1.4", letterSpacing: "-0.01em" }],
        title: ["1.25rem", { lineHeight: "1.3", letterSpacing: "-0.015em" }],
        heading: ["1.625rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        display: ["2.125rem", { lineHeight: "1.12", letterSpacing: "-0.03em" }],
        "display-lg": ["2.75rem", { lineHeight: "1.06", letterSpacing: "-0.035em" }],
      },

      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      /**
       * Высота строки списка и таблицы — переменной.
       *
       * В таблице реквизитов высота продублирована в семи ветках ячейки, и
       * расхождение хотя бы в одной даёт рваную сетку. Переменная убирает саму
       * возможность разойтись и заодно даёт вторую плотность: поверхности
       * чтения свободные, поверхности данных плотные.
       */
      height: { row: "var(--row-h)" },
      minHeight: { row: "var(--row-h)" },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;

import { cn } from "@/lib/utils";

/** Что система умеет собирать — по разным отраслям сразу. */
const ROW_ONE = [
  "Договор купли-продажи",
  "Трудовой договор",
  "Акт приёма-передачи",
  "Договор оказания услуг",
  "Согласие на обработку ПДн",
  "Заявление в Росреестр",
  "Приказ о приёме на работу",
  "Карточка контрагента",
];

const ROW_TWO = [
  "Дополнительное соглашение",
  "Доверенность",
  "Акт выполненных работ",
  "Уведомление о переносе сроков",
  "Договор аренды",
  "Рецензия на работу",
  "Претензия",
  "Соглашение о расторжении",
];

function Row({
  items,
  reverse = false,
}: {
  items: string[];
  reverse?: boolean;
}) {
  // Дублируем список, чтобы прокрутка была бесшовной.
  const doubled = [...items, ...items];

  return (
    <div
      className={cn(
        "flex w-max gap-3",
        reverse ? "animate-marquee-reverse" : "animate-marquee"
      )}
    >
      {doubled.map((item, index) => (
        <span
          key={`${item}-${index}`}
          className="whitespace-nowrap rounded-md border border-inverse-line bg-fg/60 px-4 py-2.5 text-body text-fg-faint transition-colors hover:border-inverse-line hover:text-inverse-fg"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function DocumentMarquee() {
  return (
    <section
      aria-label="Типы документов, которые формирует система"
      className="bg-inverse pb-16 pt-4"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-center gap-3">
          <span className="font-mono text-label uppercase text-inverse-fg/35">
            Документы, которые готовит Алетейя
          </span>
        </div>
      </div>

      {/* marquee-host: при наведении лента замирает, чтобы её можно было прочитать */}
      <div className="marquee-host mt-7 flex flex-col gap-3 overflow-hidden mask-fade-x">
        <Row items={ROW_ONE} />
        <Row items={ROW_TWO} reverse />
      </div>

      <div className="mx-auto mt-7 max-w-6xl px-6">
        <p className="mx-auto max-w-xl text-center text-body leading-relaxed text-inverse-fg/40">
          Список не закрытый: свои шаблоны и свои типы объектов добавляются без
          участия разработчиков.
        </p>
      </div>
    </section>
  );
}

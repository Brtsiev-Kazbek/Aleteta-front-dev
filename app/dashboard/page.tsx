import { Sidebar } from "@/components/layout/Sidebar";
import { MetaLabel } from "@/components/layout/PanelHeading";
import { StoreBootstrap } from "@/components/layout/StoreBootstrap";
import { loadWorkspaceSnapshot } from "@/lib/data/bootstrap";
import { CabinetBento } from "@/components/dashboard/CabinetBento";
import { CabinetHeader } from "@/components/dashboard/CabinetHeader";
import { CapabilityGrid } from "@/components/dashboard/CapabilityGrid";
import { CustomTypesPanel } from "@/components/dashboard/CustomTypesPanel";
import { RecentCases } from "@/components/dashboard/RecentCases";

/*
 * Страница читает данные вошедшего, поэтому всегда отрисовывается по запросу.
 * Без этой пометки сборка без переменных окружения зафиксировала бы страницу
 * как статическую — и на боевом сервере, где база подключена, она отдавала бы
 * встроенный набор вместо настоящих дел.
 */
export const dynamic = "force-dynamic";

/**
 * Кабинет.
 *
 * ЧТО БЫЛО НЕ ТАК. Рабочий стол был витриной: первый экран с обещанием «девять
 * инструментов, весь цикл работы» и следом эти самые девять инструментов
 * одинаковыми плитками. Витрина уместна ровно один раз — когда человек ещё
 * решает, брать ли. Дальше он заходит сюда по десять раз в день, и каждый раз
 * страница рассказывала ему, что она умеет, вместо того чтобы сказать, что у
 * него происходит. Ответ на «нужно ли мне сегодня что-то делать» приходилось
 * собирать вручную, обойдя все дела.
 *
 * ПОРЯДОК ЭКРАНА — ПОРЯДОК ВОПРОСОВ, с которыми в кабинет заходят:
 *
 *   где я и что нового     → шапка: обращение, состояние, два частых действия
 *   что от меня нужно      → бенто: объекты с ошибками и неподтверждённым
 *   с чего начать          → инструменты
 *   над чем я работаю      → дела
 *   чем настроено          → свои типы объектов
 *
 * Инструменты никуда не делись и работают по-прежнему — они просто перестали
 * быть первым, что видно. Витрину подвинул ответ на вопрос, ради которого сюда
 * и заходят.
 */
export default async function DashboardPage() {
  const snapshot = await loadWorkspaceSnapshot();

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {snapshot && <StoreBootstrap snapshot={snapshot} />}
      <Sidebar />

      <main className="scrollable-area min-w-0 flex-1 overflow-y-auto">
        <CabinetHeader />

        <div className="mx-auto max-w-6xl px-8 pb-16">
          {/*
            Бенто заходит на тёмную полосу: карточки перекрывают её нижнюю
            кромку и читаются как предметы, положенные поверх, а не как
            следующий раздел. Тот же приём, что под первым экраном лендинга.
          */}
          <div className="relative z-10 -mt-8">
            <CabinetBento />
          </div>

          <section className="mt-14">
            <CapabilityGrid />
          </section>

          <section className="mt-14">
            <div className="flex items-baseline justify-between gap-3">
              <MetaLabel>Дела</MetaLabel>
            </div>

            <div className="mt-4">
              <RecentCases />
            </div>
          </section>

          <section className="mt-14">
            <CustomTypesPanel />
          </section>
        </div>
      </main>
    </div>
  );
}

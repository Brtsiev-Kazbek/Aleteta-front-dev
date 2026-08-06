import type { ReactNode } from "react";

import { StoreBootstrap } from "@/components/layout/StoreBootstrap";
import { loadWorkspaceSnapshot } from "@/lib/data/bootstrap";

/**
 * Серверная обёртка рабочего пространства дела.
 *
 * Сама страница — клиентская: ей нужны состояние вкладок, шторки и правка
 * ячеек. Чтение данных вынесено сюда, чтобы подключить базу без переписывания
 * страницы на серверные компоненты.
 */
/*
 * Страница читает данные вошедшего, поэтому всегда отрисовывается по запросу.
 * Без этой пометки сборка без переменных окружения зафиксировала бы страницу
 * как статическую — и на боевом сервере, где база подключена, она отдавала бы
 * встроенный набор вместо настоящих дел.
 */
export const dynamic = "force-dynamic";

export default async function CaseLayout({
  children,
}: {
  children: ReactNode;
}) {
  const snapshot = await loadWorkspaceSnapshot();

  return (
    <>
      {snapshot && <StoreBootstrap snapshot={snapshot} />}
      {children}
    </>
  );
}

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

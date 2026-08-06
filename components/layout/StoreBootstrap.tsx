"use client";

import { useEffect, useRef } from "react";

import { useAppStore, type StoreSnapshot } from "@/store/useAppStore";

/**
 * Перенос серверных данных в стор.
 *
 * Гидратация выполняется один раз за монтирование: повтор затирал бы правки,
 * сделанные пользователем после загрузки страницы. Обновление после мутаций
 * идёт через revalidatePath — тогда компонент перемонтируется с новыми данными.
 */
export function StoreBootstrap({ snapshot }: { snapshot: StoreSnapshot }) {
  const hydrate = useAppStore((state) => state.hydrate);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    hydrate(snapshot);
  }, [hydrate, snapshot]);

  return null;
}

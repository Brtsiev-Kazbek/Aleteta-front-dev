"use server";

import {
  actionError,
  actionOk,
  type ActionResult,
} from "@/lib/actions/result";
import { requireSession } from "@/lib/data/session";
import { loadUsage, type UsageReport } from "@/lib/data/usage";

/**
 * Отчёт о расходе за период.
 *
 * Нужен отдельным действием, а не только при отрисовке страницы: период
 * переключают кнопками, и перезагружать всю страницу настроек ради смены
 * «30 дней» на «7 дней» — расточительство.
 */
export async function getUsageAction(
  days: number
): Promise<ActionResult<UsageReport>> {
  try {
    await requireSession();

    // Границы разумного: год назад считать незачем, а меньше суток — нечего.
    const period = Math.min(Math.max(Math.round(days), 1), 365);

    return actionOk(await loadUsage(period));
  } catch (caught) {
    return actionError(caught, "Не удалось собрать отчёт о расходе.");
  }
}

import { AlertTriangle } from "lucide-react";

/**
 * Раздел открылся, данные не пришли.
 *
 * Отдельный вид, а не пустая таблица: пустая таблица говорит «ничего нет», и
 * администратор пойдёт искать проблему в продукте вместо развёртывания. Здесь
 * прямо сказано, что случилось и что сделать.
 */
export function AdminFailureNotice({ reason }: { reason: string }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-warn-line bg-warn-bg px-5 py-4">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn-fg" />
      <div className="min-w-0">
        <p className="text-body font-medium text-warn-fg">
          Данные не пришли
        </p>
        <p className="mt-1 text-body leading-relaxed text-warn-fg/80">
          {reason}
        </p>
      </div>
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Loader2, X } from "lucide-react";

import { useAppStore } from "@/store/useAppStore";

/**
 * Состояние записи в базу.
 *
 * Правки применяются к интерфейсу сразу, поэтому неудачную запись человек без
 * подсказки не заметит: значение вернулось к прежнему, а почему — непонятно.
 * Это единственное место, где такие отказы становятся видимыми, поэтому
 * компонент висит рядом с сайдбаром и показывается на всех экранах приложения.
 */
export function SyncStatus() {
  const error = useAppStore((state) => state.syncError);
  const dismiss = useAppStore((state) => state.dismissSyncError);
  const pending = useAppStore((state) => state.pendingWrites);
  const isRemote = useAppStore((state) => state.isBackedByDatabase);

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      <AnimatePresence initial={false}>
        {/* Индикатор сохранения — только когда база подключена. */}
        {isRemote && pending > 0 && !error && (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 shadow-sm"
          >
            <Loader2 className="h-3 w-3 animate-spin text-fg-faint" />
            <span className="font-mono text-label uppercase text-fg-subtle">
              Сохраняется
            </span>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            role="alert"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto flex max-w-lg items-start gap-2.5 rounded-lg border border-danger-line bg-surface py-2.5 pl-3 pr-2 shadow-sm"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger-fg" />
            <span className="text-body leading-relaxed text-fg-muted">
              {error}
            </span>
            <button
              type="button"
              onClick={dismiss}
              className="ml-1 shrink-0 rounded-xl p-1 text-fg-faint transition-colors hover:bg-surface-2 hover:text-fg"
              aria-label="Скрыть сообщение"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MetaLabel } from "@/components/layout/PanelHeading";
import { cn, plural } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { CASE_STATUS_META } from "@/types";

interface CasePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eyebrow: string;
  title: string;
  description: string;
  onPick: (caseId: string) => void;
}

/**
 * Выбор дела для действий, которые без него не имеют смысла. Молча брать
 * первое дело нельзя: пользователь не поймёт, куда его перенесло.
 */
export function CasePickerDialog({
  open,
  onOpenChange,
  eyebrow,
  title,
  description,
  onPick,
}: CasePickerDialogProps) {
  const cases = useAppStore((state) => state.cases);
  const entities = useAppStore((state) => state.entities);
  const documents = useAppStore((state) => state.documents);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <MetaLabel>{eyebrow}</MetaLabel>
          <DialogTitle className="mt-1">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col divide-y divide-line border-y border-line">
          {cases.map((item, index) => {
            const statusMeta = CASE_STATUS_META[item.status];
            const entityCount = entities.filter(
              (entity) => entity.caseId === item.id
            ).length;
            const documentCount = documents.filter(
              (document) => document.caseId === item.id
            ).length;

            return (
              <motion.button
                key={item.id}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onClick={() => onPick(item.id)}
                className="group flex items-center gap-3 py-3.5 text-left transition-colors hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    statusMeta.dotClassName
                  )}
                />

                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] text-fg">
                    {item.title}
                  </span>
                  <span className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.1em] text-fg-faint">
                    {entityCount}{" "}
                    {plural(entityCount, "объект", "объекта", "объектов")} ·{" "}
                    {documentCount}{" "}
                    {plural(
                      documentCount,
                      "документ",
                      "документа",
                      "документов"
                    )}
                  </span>
                </span>

                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-fg-ghost transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-fg" />
              </motion.button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

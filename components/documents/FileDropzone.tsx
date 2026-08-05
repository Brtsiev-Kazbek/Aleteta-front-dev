"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PickedFile {
  name: string;
  sizeBytes: number;
}

interface FileDropzoneProps {
  onPick: (file: PickedFile) => void;
  /** Список расширений для системного диалога выбора файла. */
  accept: string;
  /** Подпись под основной строкой — что именно принимается. */
  hint: string;
  /** Файл, на котором можно посмотреть работу без своей загрузки. */
  demoFile?: PickedFile;
  demoLabel?: string;
  className?: string;
}

/**
 * Приём файла: перетаскиванием, выбором или на демонстрационном примере.
 * Собственной логики обработки не содержит — что делать с файлом, решает
 * вызывающий экран.
 */
export function FileDropzone({
  onPick,
  accept,
  hint,
  demoFile,
  demoLabel = "Или посмотрите на демо-файле",
  className,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);

  function handleFiles(list: FileList | null) {
    const picked = list?.[0];
    if (!picked) return;
    onPick({ name: picked.name, sizeBytes: picked.size });
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-8 py-14 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400",
          isDragging
            ? "border-stone-900 bg-stone-50"
            : "border-stone-300 bg-white hover:border-stone-400 hover:bg-stone-50/60"
        )}
      >
        <Upload
          className={cn(
            "h-5 w-5 transition-colors",
            isDragging ? "text-stone-900" : "text-stone-300"
          )}
        />

        <div className="flex flex-col gap-1.5">
          <p className="text-sm text-stone-900">
            Перетащите файл или нажмите, чтобы выбрать
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
            {hint}
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={(event) => {
          handleFiles(event.target.files);
          // Сбрасываем значение, иначе повторный выбор того же файла молчит.
          event.target.value = "";
        }}
      />

      {demoFile && (
        <button
          type="button"
          onClick={() => onPick(demoFile)}
          className="self-center border-b border-stone-200 pb-0.5 text-xs text-stone-500 transition-colors hover:border-stone-400 hover:text-stone-900"
        >
          {demoLabel}
        </button>
      )}
    </div>
  );
}

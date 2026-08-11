"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Значение от 0 до 100. */
  value: number;
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, indicatorClassName, ...props }, ref) => {
    const clamped = Math.min(100, Math.max(0, value));
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        className={cn(
          "relative h-px w-full overflow-hidden bg-surface-3",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full bg-stone-900 transition-[width] duration-500 ease-out",
            indicatorClassName
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

export { Progress };

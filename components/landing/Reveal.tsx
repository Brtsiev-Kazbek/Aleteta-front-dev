"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface RevealProps {
  children: ReactNode;
  /** Задержка появления, сек. */
  delay?: number;
  /** Насколько снизу выезжает блок, px. */
  offsetY?: number;
  className?: string;
}

/**
 * Появление блока при попадании в вьюпорт.
 * При включённом «уменьшении движения» анимация отключается полностью.
 */
export function Reveal({
  children,
  delay = 0,
  offsetY = 18,
  className,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: offsetY }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

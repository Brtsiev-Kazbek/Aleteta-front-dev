"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  durationMs?: number;
}

/**
 * Число, которое доезжает до нового значения вместо мгновенной подмены.
 * В отличие от счётчика на лендинге, реагирует на каждое изменение: в
 * приложении показатели меняются по ходу правок, и скачок цифры читается
 * как сбой, а не как результат действия.
 */
export function AnimatedNumber({
  value,
  durationMs = 600,
}: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    const from = fromRef.current;
    if (from === value) return;

    let frame = 0;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / durationMs, 1);
      // Плавное замедление к концу отсчёта.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));

      if (progress < 1) frame = requestAnimationFrame(tick);
      else fromRef.current = value;
    }

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      fromRef.current = value;
    };
  }, [value, durationMs, reduceMotion]);

  return <>{display}</>;
}

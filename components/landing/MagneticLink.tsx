"use client";

import { useRef, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

interface MagneticLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  /** Насколько сильно элемент тянется к курсору, px. */
  strength?: number;
}

/**
 * Ссылка, слегка притягивающаяся к курсору. Микровзаимодействие, которое
 * даёт ощущение отзывчивости без визуального шума.
 */
export function MagneticLink({
  href,
  children,
  className,
  strength = 8,
}: MagneticLinkProps) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 240, damping: 18 });
  const springY = useSpring(y, { stiffness: 240, damping: 18 });

  function handleMove(event: MouseEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    // Смещение курсора от центра, нормированное к силе притяжения.
    const offsetX = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
    const offsetY = (event.clientY - (rect.top + rect.height / 2)) / rect.height;

    x.set(offsetX * strength * 2);
    y.set(offsetY * strength * 2);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={reduceMotion ? undefined : { x: springX, y: springY }}
      className="inline-block"
    >
      <Link href={href} className={className}>
        {children}
      </Link>
    </motion.div>
  );
}

"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Тонкая полоса прогресса чтения под шапкой. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX, transformOrigin: "left" }}
      className="fixed inset-x-0 top-0 z-[60] h-[2px] bg-brand"
    />
  );
}

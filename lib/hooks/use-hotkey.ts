"use client";

import { useEffect } from "react";

export interface HotkeyCombo {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
}

export function useHotkey(combo: HotkeyCombo, handler: () => void) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const keyMatches = event.key.toLowerCase() === combo.key.toLowerCase();
      const modifierMatches = combo.meta
        ? event.metaKey || event.ctrlKey
        : combo.ctrl
          ? event.ctrlKey
          : true;

      if (keyMatches && modifierMatches) {
        event.preventDefault();
        handler();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [combo.key, combo.meta, combo.ctrl, handler]);
}

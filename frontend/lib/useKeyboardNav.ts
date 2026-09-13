"use client";

import { useCallback, useEffect } from "react";

type TabId = "feed" | "alerts" | "delta" | "watchlist" | "copilot" | "fundamentals" | "calendar";

interface UseKeyboardNavOptions {
  setActiveTab: (tab: TabId) => void;
  onNavigateUp: () => void;
  onNavigateDown: () => void;
  onEscape: () => void;
  onToggleDevToolbar: () => void;
  showShortcuts: boolean;
  setShowShortcuts: (v: boolean) => void;
}

const TAB_MAP: Record<string, TabId> = {
  "1": "feed",
  "2": "copilot",
  "3": "fundamentals",
  "4": "calendar",
  "5": "alerts",
  "6": "delta",
  "7": "watchlist",
};

export function useKeyboardNav({
  setActiveTab,
  onNavigateUp,
  onNavigateDown,
  onEscape,
  onToggleDevToolbar,
  showShortcuts,
  setShowShortcuts,
}: UseKeyboardNavOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (e.key === "Escape") {
        if (showShortcuts) {
          setShowShortcuts(false);
          return;
        }
        onEscape();
        return;
      }

      if (isInput) return;

      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const cmdInput = document.querySelector(".cmd-input") as HTMLInputElement;
        cmdInput?.focus();
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts(!showShortcuts);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        onToggleDevToolbar();
        return;
      }

      if (TAB_MAP[e.key]) {
        e.preventDefault();
        setActiveTab(TAB_MAP[e.key]);
        return;
      }

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        onNavigateDown();
        return;
      }

      if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        onNavigateUp();
        return;
      }
    },
    [setActiveTab, onNavigateUp, onNavigateDown, onEscape, onToggleDevToolbar, showShortcuts, setShowShortcuts]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

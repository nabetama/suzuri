import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "suzuri-editor-font-size";
const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 32;
const FONT_SIZE_STEP = 2;

export function useEditorFontSize() {
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = Number.parseInt(saved, 10);
      if (!Number.isNaN(parsed) && parsed >= MIN_FONT_SIZE && parsed <= MAX_FONT_SIZE) {
        return parsed;
      }
    }
    return DEFAULT_FONT_SIZE;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(fontSize));
    document.documentElement.style.setProperty(
      "--editor-font-size",
      `${fontSize}px`,
    );
  }, [fontSize]);

  const increaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.min(prev + FONT_SIZE_STEP, MAX_FONT_SIZE));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize((prev) => Math.max(prev - FONT_SIZE_STEP, MIN_FONT_SIZE));
  }, []);

  const resetFontSize = useCallback(() => {
    setFontSize(DEFAULT_FONT_SIZE);
  }, []);

  return {
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
  };
}

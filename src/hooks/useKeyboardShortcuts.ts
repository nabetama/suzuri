import { useEffect, useRef } from "react";

type ShortcutHandler = () => void;

type ShortcutConfig = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  handler: ShortcutHandler;
};

/**
 * Hook for management keyboard shortcuts.
 *
 * @example
 * useKeyboardShortcuts([
 *   { key: "s", metaKey: true, handler: handleSave },
 *   { key: "b", metaKey: true, handler: toggleSidebar },
 *   { key: "o", metaKey: true, handler: openDirectory },
 * ]);
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      for (const shortcut of shortcutsRef.current) {
        if (shortcut.key.toLowerCase() !== key) continue;

        const needsMeta = shortcut.metaKey ?? false;
        const needsCtrl = shortcut.ctrlKey ?? false;

        // metaKey または ctrlKey のどちらかが必要な場合
        if (needsMeta || needsCtrl) {
          const hasModifier = e.metaKey || e.ctrlKey;
          if (!hasModifier) continue;
        }

        e.preventDefault();
        shortcut.handler();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}

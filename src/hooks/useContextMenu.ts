import { useCallback, useEffect, useState } from "react";

export type ContextMenuState = {
  x: number;
  y: number;
  type: "dir" | "file";
  path: string;
} | null;

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);

  const openContextMenu = useCallback(
    (e: React.MouseEvent, type: "dir" | "file", path: string) => {
      window.getSelection()?.removeAllRanges();
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, type, path });
    },
    [],
  );

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  return { contextMenu, openContextMenu, closeContextMenu, setContextMenu };
}

import { useEffect, useState } from "react";
import { DirMenuAction } from "../constants/menu";
import type { NodeAction } from "../types/directoryTree";
import { getFileName } from "../utils/pathUtils";

export function useDirectoryTreeState(
  onCreate: (parentPath: string, name: string, isDir: boolean) => Promise<void>,
  onRename: (oldPath: string, newName: string, isDir: boolean) => Promise<void>,
) {
  const [openDirs, setOpenDirs] = useState<Record<string, boolean>>({});
  const [focusedPath, setFocusedPath] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: "dir" | "file";
    path: string;
  } | null>(null);
  const [menuHoverIdx, setMenuHoverIdx] = useState<number | null>(null);
  const [nodeAction, setNodeAction] = useState<NodeAction | null>(null);
  const [inputValue, setInputValue] = useState<string>("");

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  const toggleDir = (path: string) => {
    setOpenDirs((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    type: "dir" | "file",
    path: string,
  ) => {
    window.getSelection()?.removeAllRanges();
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, path });
  };

  const handleMenuClick = async (action: DirMenuAction) => {
    if (!contextMenu) return;
    if (action === DirMenuAction.NewFile) {
      setOpenDirs((prev) => ({ ...prev, [contextMenu.path]: true }));
      setNodeAction({
        type: "new",
        isDir: false,
        path: contextMenu.path,
      });
      setInputValue("");
      setContextMenu(null);
    } else if (action === DirMenuAction.NewFolder) {
      setOpenDirs((prev) => ({ ...prev, [contextMenu.path]: true }));
      setNodeAction({
        type: "new",
        isDir: true,
        path: contextMenu.path,
      });
      setInputValue("");
      setContextMenu(null);
    } else if (action === DirMenuAction.Rename) {
      setNodeAction({
        type: "rename",
        isDir: contextMenu.type === "dir",
        path: contextMenu.path,
      });
      setInputValue(getFileName(contextMenu.path));
      setContextMenu(null);
    } else if (action === DirMenuAction.Delete) {
      setNodeAction({
        type: "delete",
        isDir: contextMenu.type === "dir",
        path: contextMenu.path,
      });
      setContextMenu(null);
    }
  };

  const handleInputKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" && inputValue.trim()) {
      if (nodeAction?.type === "new") {
        await onCreate(nodeAction.path, inputValue, nodeAction.isDir);
      } else if (nodeAction?.type === "rename") {
        await onRename(nodeAction.path, inputValue, nodeAction.isDir);
      }
      setNodeAction(null);
      setInputValue("");
    } else if (e.key === "Escape") {
      setNodeAction(null);
      setInputValue("");
    }
  };

  const handleInputCancel = () => {
    setNodeAction(null);
    setInputValue("");
  };

  return {
    openDirs,
    setOpenDirs,
    focusedPath,
    setFocusedPath,
    hovered,
    setHovered,
    contextMenu,
    setContextMenu,
    menuHoverIdx,
    setMenuHoverIdx,
    nodeAction,
    setNodeAction,
    inputValue,
    setInputValue,
    toggleDir,
    handleContextMenu,
    handleMenuClick,
    handleInputKeyDown,
    handleInputCancel,
  };
}

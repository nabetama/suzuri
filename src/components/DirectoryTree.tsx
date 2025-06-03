import type React from "react";
import { createContext, useEffect, useState } from "react";
import {
  DIR_MENU_ITEMS,
  DirMenuAction,
  FILE_MENU_ITEMS,
} from "../constants/menu";
import { useCommandOpenDirectory } from "../hooks/useCommandOpenDirectory";
import type { NodeAction } from "../types/directoryTree";
import type { TreeNode } from "../types/tree";
import TreeNodeItem from "./TreeNodeItem";

export type DirectoryTreeContextType = {
  currentDirPath?: string | null;
  openDirs: Record<string, boolean>;
  hovered: string | null;
  nodeAction: NodeAction | null;
  inputValue: string;
  setHovered: (path: string | null) => void;
  toggleDir: (path: string) => void;
  handleContextMenu: (
    e: React.MouseEvent,
    type: "dir" | "file",
    path: string,
  ) => void;
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleInputCancel: () => void;
  setInputValue: (v: string) => void;
};

export const DirectoryTreeContext = createContext<
  DirectoryTreeContextType | undefined
>(undefined);

type DirectoryTreeProps = {
  rootNode: TreeNode | null;
  onFileClick: (path: string) => void;
  onOpenDirectory: () => void;
  onCreate: (parentPath: string, name: string, isDir: boolean) => Promise<void>;
  onRename: (oldPath: string, newName: string, isDir: boolean) => Promise<void>;
  onDelete: (path: string, isDir: boolean) => Promise<void>;
};

type DirOrFile = "dir" | "file";

const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  rootNode,
  onFileClick,
  onOpenDirectory,
  onCreate,
  onRename,
  onDelete,
}) => {
  const [openDirs, setOpenDirs] = useState<Record<string, boolean>>({});
  const [hovered, setHovered] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    type: DirOrFile;
    path: string;
  } | null>(null);
  const [menuHoverIdx, setMenuHoverIdx] = useState<number | null>(null);
  const [nodeAction, setNodeAction] = useState<NodeAction | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [deleteHover, setDeleteHover] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);

  useCommandOpenDirectory(onOpenDirectory);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  const toggleDir = (path: string) => {
    setOpenDirs((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  // calculate position of context menu.
  const handleContextMenu = (
    e: React.MouseEvent,
    type: DirOrFile,
    path: string,
  ) => {
    // remove selection
    window.getSelection()?.removeAllRanges();
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type, path });
  };

  const handleMenuClick = async (action: DirMenuAction) => {
    if (!contextMenu) return;
    if (action === DirMenuAction.NewFile) {
      setNodeAction({
        type: "new",
        isDir: false,
        path: contextMenu.path,
      });
      setInputValue("");
      setContextMenu(null);
    } else if (action === DirMenuAction.NewFolder) {
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
      setInputValue(contextMenu.path.split("/").pop() || "");
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

  const handleDeleteConfirm = async () => {
    if (!nodeAction || nodeAction.type !== "delete") return;
    await onDelete(nodeAction.path, nodeAction.isDir);
    setNodeAction(null);
  };

  const treeState = {
    currentDirPath: rootNode?.path,
    openDirs,
    hovered,
    nodeAction,
    inputValue,
  };
  const treeActions = {
    setHovered,
    toggleDir,
    handleContextMenu,
    handleInputKeyDown,
    handleInputCancel,
    setInputValue,
  };

  return (
    <DirectoryTreeContext.Provider value={{ ...treeState, ...treeActions }}>
      <div
        className="bg-[#141414] text-[#7F7F7F] w-full min-w-0 border-r border-[#ddd] p-0 overflow-y-auto h-full"
        onContextMenu={(e) => {
          if ((e.target as HTMLElement).closest(".tree-node-item")) return;
          e.preventDefault();
          setContextMenu({
            x: e.clientX,
            y: e.clientY,
            type: "dir",
            path: rootNode?.path || "",
          });
        }}
      >
        {rootNode && <TreeNodeItem node={rootNode} onFileClick={onFileClick} />}
        {contextMenu && (
          <div
            className="fixed bg-[#232323]"
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
              borderRadius: "3px",
              padding: "5px",
              zIndex: 2000,
            }}
          >
            <div>
              {(contextMenu.type === "dir"
                ? DIR_MENU_ITEMS
                : FILE_MENU_ITEMS
              ).map((item, idx) => (
                <div
                  style={{
                    padding: "3px",
                  }}
                  key={item.key}
                  className={`px-4 py-1.5 text-[13px] text-[#c7c7c7] cursor-pointer rounded transition-colors duration-100 select-none hover:bg-[#333] hover:text-white focus:bg-[#264f78] focus:text-white outline-none ${menuHoverIdx === idx ? "bg-[#264f78] text-white" : ""}`}
                  onMouseEnter={() => setMenuHoverIdx(idx)}
                  onMouseLeave={() => setMenuHoverIdx(null)}
                  onClick={() => handleMenuClick(item.key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      handleMenuClick(item.key);
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        )}
        {nodeAction?.type === "delete" && (
          <div
            className="fixed"
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.3)",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              className="bg-[#232323] text-[#c7c7c7] grid justify-items-center"
              style={{
                background: "#232323",
                color: "#fff",
                borderRadius: 8,
                padding: 24,
                minWidth: 320,
                boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
              }}
            >
              <div className="text-base w-full mb-2 mb-16">
                '{nodeAction.path.split("/").pop()}' を削除しますか？
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  style={{
                    background: deleteHover ? "#b71c1c" : "#d32f2f",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    padding: "6px 16px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={() => setDeleteHover(true)}
                  onMouseLeave={() => setDeleteHover(false)}
                >
                  削除
                </button>
                <button
                  type="button"
                  onClick={() => setNodeAction(null)}
                  style={{
                    background: cancelHover ? "#333" : "#111",
                    color: "#fff",
                    borderRadius: 4,
                    padding: "6px 16px",
                    cursor: "pointer",
                    transition: "background 0.2s, border 0.2s, color 0.2s",
                  }}
                  onMouseEnter={() => setCancelHover(true)}
                  onMouseLeave={() => setCancelHover(false)}
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DirectoryTreeContext.Provider>
  );
};

export default DirectoryTree;

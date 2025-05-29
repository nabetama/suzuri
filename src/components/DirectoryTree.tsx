import type React from "react";
import { createContext, useEffect, useState } from "react";
import {
  DIR_MENU_ITEMS,
  DirMenuAction,
  FILE_MENU_ITEMS,
} from "../constants/menu";
import { useCommandOpenDirectory } from "../hooks/useCommandOpenDirectory";
import type { TreeNode } from "../types/tree";
import { sortTreeNodes } from "../utils/sortTreeNodes";
import TreeNodeItem from "./TreeNodeItem";

export type DirectoryTreeContextType = {
  currentDirPath?: string | null;
  openDirs: Record<string, boolean>;
  hovered: string | null;
  editingNode: {
    type: "new" | "rename";
    parentPath?: string;
    targetPath?: string;
    isDir: boolean;
  } | null;
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
  nodes: TreeNode[];
  onFileClick: (path: string) => void;
  onOpenDirectory: () => void;
  currentDirPath?: string | null;
  onCreate: (parentPath: string, name: string, isDir: boolean) => Promise<void>;
  onRename: (oldPath: string, newName: string, isDir: boolean) => Promise<void>;
  onDelete: (path: string, isDir: boolean) => Promise<void>;
};

type DirOrFile = "dir" | "file";

const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  nodes,
  onFileClick,
  onOpenDirectory,
  currentDirPath,
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
  const [editingNode, setEditingNode] = useState<{
    type: "new" | "rename";
    parentPath?: string;
    targetPath?: string;
    isDir: boolean;
  } | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [deletingNode, setDeletingNode] = useState<{
    path: string;
    isDir: boolean;
  } | null>(null);
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
      setEditingNode({
        type: "new",
        parentPath: contextMenu.path,
        isDir: false,
      });
      setInputValue("");
      setContextMenu(null);
    } else if (action === DirMenuAction.NewFolder) {
      setEditingNode({
        type: "new",
        parentPath: contextMenu.path,
        isDir: true,
      });
      setInputValue("");
      setContextMenu(null);
    } else if (action === DirMenuAction.Rename) {
      setEditingNode({
        type: "rename",
        targetPath: contextMenu.path,
        isDir: contextMenu.type === "dir",
      });
      setInputValue(contextMenu.path.split("/").pop() || "");
      setContextMenu(null);
    } else if (action === DirMenuAction.Delete) {
      setDeletingNode({
        path: contextMenu.path,
        isDir: contextMenu.type === "dir",
      });
      setContextMenu(null);
    }
  };

  const handleInputKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter" && inputValue.trim()) {
      if (editingNode?.type === "new" && editingNode.parentPath) {
        await onCreate(editingNode.parentPath, inputValue, editingNode.isDir);
      } else if (editingNode?.type === "rename" && editingNode.targetPath) {
        await onRename(editingNode.targetPath, inputValue, editingNode.isDir);
      }
      setEditingNode(null);
      setInputValue("");
    } else if (e.key === "Escape") {
      setEditingNode(null);
      setInputValue("");
    }
  };

  const handleInputCancel = () => {
    setEditingNode(null);
    setInputValue("");
  };

  const handleDeleteConfirm = async () => {
    if (!deletingNode) return;
    await onDelete(deletingNode.path, deletingNode.isDir);
    setDeletingNode(null);
  };

  const treeState = {
    currentDirPath,
    openDirs,
    hovered,
    editingNode,
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
      <div className="bg-[#141414] text-[#7F7F7F] w-full min-w-0 border-r border-[#ddd] p-0 overflow-y-auto h-full">
        {currentDirPath && (
          //  ディレクトリ名
          <div className="font-semibold text-[13px] mb-2 mt-3 ml-3 px-1 py-0.5 select-none">
            {currentDirPath.split("/").pop()}
          </div>
        )}
        <ul className="list-none pl-0 m-0 ps-[12px]">
          {sortTreeNodes(nodes).map((node) => {
            const rootPath = node.path || `/${node.name}`;
            return (
              <TreeNodeItem
                key={rootPath}
                node={node}
                parentPath=""
                onFileClick={onFileClick}
              />
            );
          })}
        </ul>
        {contextMenu && (
          <div
            className="fixed bg-[#232323]"
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
              borderRadius: "3px",
              padding: "5px",
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
        {deletingNode && (
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
                '{deletingNode.path.split("/").pop()}' を削除しますか？
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
                  onClick={() => setDeletingNode(null)}
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

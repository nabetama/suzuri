import type React from "react";
import { createContext, useEffect } from "react";
import { DIR_MENU_ITEMS, FILE_MENU_ITEMS } from "../constants/menu";
import { useCommandOpenDirectory } from "../hooks/useCommandOpenDirectory";
import { useDirectoryTreeState } from "../hooks/useDirectoryTreeState";
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
  updateDirChildren: (dirPath: string) => Promise<void>;
};

const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  rootNode,
  onFileClick,
  onOpenDirectory,
  onCreate,
  onRename,
  onDelete,
  updateDirChildren,
}) => {
  const treeState = useDirectoryTreeState(onCreate, onRename, onDelete);

  useCommandOpenDirectory(onOpenDirectory);

  const {
    openDirs,
    hovered,
    setHovered,
    contextMenu,
    setContextMenu,
    menuHoverIdx,
    setMenuHoverIdx,
    nodeAction,
    inputValue,
    setInputValue,
    toggleDir,
    handleContextMenu,
    handleMenuClick,
    handleInputKeyDown,
    handleInputCancel,
  } = treeState;

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu, setContextMenu]);

  return (
    <DirectoryTreeContext.Provider
      value={{
        currentDirPath: rootNode?.path,
        openDirs,
        hovered,
        nodeAction,
        inputValue,
        setHovered,
        toggleDir,
        handleContextMenu,
        handleInputKeyDown,
        handleInputCancel,
        setInputValue,
      }}
    >
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
        {rootNode && (
          <TreeNodeItem
            node={rootNode}
            onFileClick={onFileClick}
            updateDirChildren={updateDirChildren}
          />
        )}
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
                  onClick={async () => {
                    if (item.key === "delete") {
                      const ok = confirm(
                        `'${contextMenu?.path.split("/").pop()}' を削除しますか？`,
                      );

                      if (ok) {
                        await onDelete(
                          contextMenu.path,
                          contextMenu.type === "dir",
                        );
                      }
                      setContextMenu(null);
                    } else {
                      handleMenuClick(item.key);
                    }
                  }}
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
      </div>
    </DirectoryTreeContext.Provider>
  );
};

export default DirectoryTree;

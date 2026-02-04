import type React from "react";
import { createContext, useCallback, useEffect, useMemo, useRef } from "react";
import { DIR_MENU_ITEMS, FILE_MENU_ITEMS } from "../constants/menu";
import { useCommandOpenDirectory } from "../hooks/useCommandOpenDirectory";
import { useDirectoryTreeState } from "../hooks/useDirectoryTreeState";
import type { NodeAction } from "../types/directoryTree";
import type { TreeNode } from "../types/tree";
import { getFileName } from "../utils/pathUtils";
import { flattenVisibleNodes } from "../utils/treeUtils";
import TreeNodeItem from "./TreeNodeItem";

export type DirectoryTreeContextType = {
  currentDirPath?: string | null;
  openDirs: Record<string, boolean>;
  focusedPath: string | null;
  hovered: string | null;
  nodeAction: NodeAction | null;
  inputValue: string;
  setFocusedPath: (path: string | null) => void;
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
  const treeState = useDirectoryTreeState(onCreate, onRename);

  useCommandOpenDirectory(onOpenDirectory);

  const {
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
    inputValue,
    setInputValue,
    toggleDir,
    handleContextMenu,
    handleMenuClick,
    handleInputKeyDown,
    handleInputCancel,
  } = treeState;

  const containerRef = useRef<HTMLDivElement>(null);

  const flatNodes = useMemo(() => {
    if (!rootNode) return [];
    return flattenVisibleNodes(rootNode, openDirs);
  }, [rootNode, openDirs]);

  const handleTreeKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      if (nodeAction) return;
      const key = e.key;
      if (
        !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter"].includes(
          key,
        )
      )
        return;
      e.preventDefault();
      setHovered(null);

      const currentIdx = focusedPath
        ? flatNodes.findIndex((n) => n.path === focusedPath)
        : -1;

      if (key === "ArrowDown") {
        const next =
          currentIdx < flatNodes.length - 1 ? currentIdx + 1 : currentIdx;
        if (next >= 0) setFocusedPath(flatNodes[next].path);
        return;
      }

      if (key === "ArrowUp") {
        const prev = currentIdx > 0 ? currentIdx - 1 : 0;
        setFocusedPath(flatNodes[prev].path);
        return;
      }

      if (currentIdx < 0) return;
      const current = flatNodes[currentIdx];

      if (key === "ArrowRight") {
        if (current.isDir) {
          if (!openDirs[current.path]) {
            await updateDirChildren(current.path);
            setOpenDirs((prev) => ({ ...prev, [current.path]: true }));
          }
        }
        return;
      }

      if (key === "ArrowLeft") {
        if (current.isDir && openDirs[current.path]) {
          setOpenDirs((prev) => ({ ...prev, [current.path]: false }));
        } else if (
          current.parentPath &&
          current.parentPath !== rootNode?.path
        ) {
          setFocusedPath(current.parentPath);
        }
        return;
      }

      if (key === "Enter") {
        if (current.isDir) {
          if (!openDirs[current.path]) {
            await updateDirChildren(current.path);
          }
          setOpenDirs((prev) => ({
            ...prev,
            [current.path]: !prev[current.path],
          }));
        } else {
          onFileClick(current.path);
        }
      }
    },
    [
      flatNodes,
      focusedPath,
      openDirs,
      nodeAction,
      rootNode?.path,
      setFocusedPath,
      setHovered,
      setOpenDirs,
      updateDirChildren,
      onFileClick,
    ],
  );

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu, setContextMenu]);

  // Scroll focused node into view
  useEffect(() => {
    if (!focusedPath || !containerRef.current) return;
    const btn = containerRef.current.querySelector(
      `[data-path="${CSS.escape(focusedPath)}"]`,
    );
    if (btn) {
      btn.scrollIntoView({ block: "nearest" });
    }
  }, [focusedPath]);

  return (
    <DirectoryTreeContext.Provider
      value={{
        currentDirPath: rootNode?.path,
        openDirs,
        focusedPath,
        hovered,
        nodeAction,
        inputValue,
        setFocusedPath,
        setHovered,
        toggleDir,
        handleContextMenu,
        handleInputKeyDown,
        handleInputCancel,
        setInputValue,
      }}
    >
      <div
        ref={containerRef}
        role="tree"
        className="tree-pane bg-white dark:bg-[#141414] text-gray-600 dark:text-[#7F7F7F] w-full min-w-0 p-0 overflow-x-auto overflow-y-scroll h-full"
        tabIndex={0}
        onKeyDown={handleTreeKeyDown}
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
            className="fixed bg-white dark:bg-[#232323] border border-gray-200 dark:border-[#3a3a3a] shadow-lg rounded-md overflow-hidden"
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
              padding: "4px",
              zIndex: 2000,
            }}
          >
            <div>
              {(contextMenu.type === "dir"
                ? DIR_MENU_ITEMS
                : FILE_MENU_ITEMS
              ).map((item, idx) => (
                <div
                  key={item.key}
                  className={`px-3 py-1.5 text-[13px] text-gray-700 dark:text-[#c7c7c7] cursor-pointer rounded transition-colors duration-100 select-none hover:bg-gray-100 dark:hover:bg-[#333] hover:text-gray-900 dark:hover:text-white focus:bg-blue-500 dark:focus:bg-[#264f78] focus:text-white outline-none ${menuHoverIdx === idx ? "bg-blue-500 dark:bg-[#264f78] text-white" : ""}`}
                  onMouseEnter={() => setMenuHoverIdx(idx)}
                  onMouseLeave={() => setMenuHoverIdx(null)}
                  onClick={async () => {
                    if (item.key === "delete") {
                      const ok = confirm(
                        `'${getFileName(contextMenu?.path ?? "")}' を削除しますか？`,
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

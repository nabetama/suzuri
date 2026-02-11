import React, { memo, useCallback, useContext, useRef, useState } from "react";
import { useAutoSelectInput } from "../hooks/useAutoSelectInput";
import type { TreeNode } from "../types/tree";
import { getNodeFullPath } from "../utils/pathUtils";
import { sortTreeNodes } from "../utils/sortTreeNodes";
import { DirectoryTreeContext } from "./DirectoryTree";
import TreeNodeInput from "./TreeNodeInput";

type TreeNodeItemProps = {
  node: TreeNode;
  onFileClick: (path: string) => void;
  updateDirChildren: (dirPath: string) => Promise<void>;
};

const TreeNodeItem: React.FC<TreeNodeItemProps> = memo(
  ({ node, onFileClick, updateDirChildren }) => {
    const ctx = useContext(DirectoryTreeContext);
    if (!ctx) throw new Error("DirectoryTreeContext not found");
    const {
      currentDirPath,
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
    } = ctx;

    const fullPath = getNodeFullPath(node, currentDirPath);
    const isFocused = focusedPath === fullPath;
    const isHovered = hovered === fullPath;

    const inputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    useAutoSelectInput(
      inputRef,
      (nodeAction?.type === "rename" && nodeAction.path === fullPath) ||
        (nodeAction?.type === "new" && nodeAction.path === fullPath),
    );

    const handleDirToggle = useCallback(async () => {
      const isOpen = openDirs[fullPath] ?? false;
      if (!isOpen && node.children === undefined) {
        setLoading(true);
        await updateDirChildren(fullPath);
        setLoading(false);
      }
      toggleDir(fullPath);
    }, [openDirs, fullPath, node.children, updateDirChildren, toggleDir]);

    const handleDirClick = useCallback(() => {
      setFocusedPath(fullPath);
      handleDirToggle();
    }, [setFocusedPath, fullPath, handleDirToggle]);

    const handleFileClick = useCallback(() => {
      setFocusedPath(fullPath);
      onFileClick(fullPath);
    }, [setFocusedPath, fullPath, onFileClick]);

    const handleMouseEnter = useCallback(
      () => setHovered(fullPath),
      [setHovered, fullPath],
    );

    const handleMouseLeave = useCallback(
      () => setHovered(null),
      [setHovered],
    );

    const handleDirContextMenu = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        handleContextMenu(e, "dir", fullPath);
      },
      [handleContextMenu, fullPath],
    );

    const handleFileContextMenu = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        handleContextMenu(e, "file", fullPath);
      },
      [handleContextMenu, fullPath],
    );

  const highlightClass =
    isFocused || isHovered
      ? "bg-gray-100 dark:bg-[#222222] text-gray-900 dark:text-white"
      : "";

  if (node.isDir) {
    const isOpen = openDirs[fullPath] ?? false;
    const isRenaming =
      nodeAction?.type === "rename" && nodeAction.path === fullPath;

    return (
      <li key={fullPath} className="tree-node-item select-none w-full">
        {isRenaming ? (
          <TreeNodeInput
            inputRef={inputRef}
            value={inputValue}
            onChange={setInputValue}
            onKeyDown={handleInputKeyDown}
            onCancel={handleInputCancel}
            placeholder="新しい名前"
          />
        ) : (
          <button
            type="button"
            data-path={fullPath}
            className={`tree-btn tree-node-item cursor-pointer flex items-center text-gray-500 dark:text-[#8f8f8f] transition-colors duration-100 w-full text-left bg-transparent border-none outline-none focus:ring-0 rounded-sm ${highlightClass}`}
            onClick={handleDirClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleDirToggle();
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onContextMenu={handleDirContextMenu}
          >
            <span className="tree-arrow opacity-50">
              {isOpen ? "▼" : "▶"}
            </span>
            {node.name}
          </button>
        )}
        {isOpen && (
          <ul className="tree-children">
            {loading && (
              <li className="tree-node-item text-gray-400 dark:text-gray-600 px-2 leading-[22px]">
                Loading...
              </li>
            )}
            {node.children &&
              sortTreeNodes(node.children).map((child) => (
                <TreeNodeItem
                  key={child.path}
                  node={child}
                  onFileClick={onFileClick}
                  updateDirChildren={updateDirChildren}
                />
              ))}
            {nodeAction?.type === "new" && nodeAction.path === fullPath && (
              <li key={`new-input-${fullPath}`} className="tree-node-item">
                <TreeNodeInput
                  inputRef={inputRef}
                  value={inputValue}
                  onChange={setInputValue}
                  onKeyDown={handleInputKeyDown}
                  onCancel={handleInputCancel}
                  placeholder={
                    nodeAction.isDir ? "新しいフォルダ名" : "新しいファイル名"
                  }
                />
              </li>
            )}
          </ul>
        )}
      </li>
    );
  }
  return (
    <li key={fullPath} className="tree-node-item w-full">
      {nodeAction?.type === "rename" && nodeAction.path === fullPath ? (
        <TreeNodeInput
          inputRef={inputRef}
          value={inputValue}
          onChange={setInputValue}
          onKeyDown={handleInputKeyDown}
          onCancel={handleInputCancel}
          placeholder="新しい名前"
        />
      ) : (
        <button
          type="button"
          data-path={fullPath}
          className={`tree-btn tree-node-item cursor-pointer flex items-center text-gray-500 dark:text-[#8f8f8f] select-none transition-colors duration-100 w-full text-left bg-transparent border-none outline-none focus:ring-0 rounded-sm ${highlightClass}`}
          onClick={handleFileClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onFileClick(fullPath);
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleFileContextMenu}
        >
          <span className="tree-spacer" />
          {node.name}
        </button>
      )}
    </li>
  );
  },
);

TreeNodeItem.displayName = "TreeNodeItem";

export default TreeNodeItem;

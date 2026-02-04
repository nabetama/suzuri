import type React from "react";
import { useContext, useRef, useState } from "react";
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

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  onFileClick,
  updateDirChildren,
}) => {
  const ctx = useContext(DirectoryTreeContext);
  if (!ctx) throw new Error("DirectoryTreeContext not found");
  const {
    currentDirPath,
    openDirs,
    nodeAction,
    inputValue,
    setHovered,
    toggleDir,
    handleContextMenu,
    handleInputKeyDown,
    handleInputCancel,
    setInputValue,
  } = ctx;

  const fullPath = getNodeFullPath(node, currentDirPath);

  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  useAutoSelectInput(
    inputRef,
    (nodeAction?.type === "rename" && nodeAction.path === fullPath) ||
      (nodeAction?.type === "new" && nodeAction.path === fullPath),
  );

  const handleDirToggle = async () => {
    const isOpen = openDirs[fullPath] ?? false;
    if (!isOpen && node.children === undefined) {
      setLoading(true);
      await updateDirChildren(fullPath);
      setLoading(false);
    }
    toggleDir(fullPath);
  };

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
            className="tree-node-item cursor-pointer flex items-center gap-1 text-[13px] text-gray-700 dark:text-[#c7c7c7] transition-colors duration-100 px-1.5 py-0.5 w-full text-left bg-transparent border-none outline-none focus:ring-0 hover:bg-gray-100 dark:hover:bg-[#222222] hover:text-gray-900 dark:hover:text-white"
            onClick={handleDirToggle}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleDirToggle();
            }}
            onMouseEnter={() => setHovered(fullPath)}
            onMouseLeave={() => setHovered(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              handleContextMenu(e, "dir", fullPath);
            }}
          >
            <span className="inline-block w-4 text-center mr-[4px]">
              {isOpen ? "▼" : "▶"}
            </span>
            {node.name}
          </button>
        )}
        {isOpen && (
          <ul className="list-none pl-4 m-0 ps-[12px]">
            {loading && <li key="loading">- Loading...</li>}
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
          className="tree-node-item cursor-pointer flex items-center gap-1 text-[13px] text-gray-700 dark:text-[#c7c7c7] select-none transition-colors duration-100 px-1.5 py-0.5 w-full text-left bg-transparent border-none outline-none focus:ring-0 hover:bg-gray-100 dark:hover:bg-[#222222] hover:text-gray-900 dark:hover:text-white"
          onClick={() => onFileClick(fullPath)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onFileClick(fullPath);
          }}
          onMouseEnter={() => setHovered(fullPath)}
          onMouseLeave={() => setHovered(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            handleContextMenu(e, "file", fullPath);
          }}
        >
          {node.name}
        </button>
      )}
    </li>
  );
};

export default TreeNodeItem;

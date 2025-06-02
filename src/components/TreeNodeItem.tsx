import type React from "react";
import { useContext, useEffect, useRef } from "react";
import type { TreeNode } from "../types/tree";
import { sortTreeNodes } from "../utils/sortTreeNodes";
import { DirectoryTreeContext } from "./DirectoryTree";

type TreeNodeItemProps = {
  node: TreeNode;
  onFileClick: (path: string) => void;
};

const getRelativePath = (currentDirPath: string | null, fullPath: string) => {
  if (!currentDirPath) return fullPath;
  return fullPath.startsWith(currentDirPath)
    ? fullPath.slice(currentDirPath.length) || "/"
    : fullPath;
};

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({ node, onFileClick }) => {
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

  const fullPath = node.path || `${currentDirPath}/${node.name}`;

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (nodeAction && nodeAction.type === "rename" && inputRef.current) {
      inputRef.current.select();
    }
  }, [nodeAction]);

  if (node.children) {
    const isOpen = openDirs[fullPath] ?? false;
    const isRenaming =
      nodeAction &&
      nodeAction.type === "rename" &&
      nodeAction.path === fullPath;
    return (
      <li key={fullPath} className="tree-node-item select-none w-full">
        {isRenaming ? (
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                handleInputCancel();
              } else {
                handleInputKeyDown(e);
              }
            }}
            onBlur={handleInputCancel}
            className="text-[13px] px-2 py-1 border border-[#0078d4] rounded bg-[#23272e] text-[#d4d4d4] w-full outline-none focus:border-[#3794ff] focus:ring-1 focus:ring-[#3794ff] placeholder:text-[#888]"
            placeholder="新しい名前"
          />
        ) : (
          <button
            type="button"
            className="tree-node-item cursor-pointer flex items-center gap-1 text-[13px] text-[#c7c7c7] transition-colors duration-100 px-1.5 py-0.5 w-full text-left bg-transparent border-none outline-none focus:ring-0 hover:bg-[#222222] hover:text-white"
            onClick={() => toggleDir(fullPath)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") toggleDir(fullPath);
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
            {sortTreeNodes(node.children).map((child) => (
              <TreeNodeItem
                key={child.path}
                node={child}
                onFileClick={onFileClick}
              />
            ))}
            {nodeAction &&
              nodeAction.type === "new" &&
              nodeAction.path === fullPath && (
                <li key={`new-input-${fullPath}`} className="tree-node-item">
                  <input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    onBlur={handleInputCancel}
                    className="text-base px-2 py-0.5 border border-[#0078d4] rounded bg-[#1e1e1e] text-white w-[90%] outline-none"
                    placeholder={
                      nodeAction.isDir ? "新しいフォルダ名" : "新しいファイル名"
                    }
                  />
                </li>
              )}
            {nodeAction &&
              nodeAction.type === "rename" &&
              nodeAction.path === fullPath && (
                <li key={`rename-input-${fullPath}`} className="tree-node-item">
                  <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        handleInputCancel();
                      } else {
                        handleInputKeyDown(e);
                      }
                    }}
                    onBlur={handleInputCancel}
                    className="text-[13px] px-2 py-1 border border-[#0078d4] rounded bg-[#23272e] text-[#d4d4d4] w-full outline-none focus:border-[#3794ff] focus:ring-1 focus:ring-[#3794ff] placeholder:text-[#888]"
                    placeholder="新しい名前"
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
      {nodeAction &&
      nodeAction.type === "rename" &&
      nodeAction.path === fullPath ? (
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              handleInputCancel();
            } else {
              handleInputKeyDown(e);
            }
          }}
          onBlur={handleInputCancel}
          className="text-[13px] px-2 py-1 border border-[#0078d4] rounded bg-[#23272e] text-[#d4d4d4] w-full outline-none focus:border-[#3794ff] focus:ring-1 focus:ring-[#3794ff] placeholder:text-[#888]"
          placeholder="新しい名前"
        />
      ) : (
        <button
          type="button"
          className="tree-node-item cursor-pointer flex items-center gap-1 text-[13px] text-[#c7c7c7] select-none transition-colors duration-100 px-1.5 py-0.5 w-full text-left bg-transparent border-none outline-none focus:ring-0 hover:bg-[#222222] hover:text-white"
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

import React, { useContext } from "react";
import { TreeNode } from "../types/tree";
import { sortTreeNodes } from "../utils/sortTreeNodes";
import { DirectoryTreeContext } from "./DirectoryTree";
import {
  fileSpanStyle,
  inputStyle,
  rowBaseStyle,
  rowHoverStyle,
} from "./DirectoryTree.styles";

type TreeNodeItemProps = {
  node: TreeNode;
  parentPath: string;
  onFileClick: (path: string) => void;
};

const getRelativePath = (currentDirPath: string | null, fullPath: string) => {
  if (!currentDirPath) return fullPath;
  return fullPath.startsWith(currentDirPath)
    ? fullPath.slice(currentDirPath.length) || '/'
    : fullPath;
};

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  parentPath,
  onFileClick,
}) => {
  const ctx = useContext(DirectoryTreeContext);
  if (!ctx) throw new Error("DirectoryTreeContext not found");
  const {
    currentDirPath,
    openDirs,
    hovered,
    editingNode,
    inputValue,
    setHovered,
    toggleDir,
    handleContextMenu,
    handleInputKeyDown,
    handleInputCancel,
    setInputValue,
  } = ctx;

  const fullPath = node.path || `${parentPath}/${node.name}`;
  const relPath = getRelativePath(currentDirPath || null, fullPath);

  if (node.children) {
    const isOpen = openDirs[fullPath] ?? false;
    return (
      <li key={fullPath} style={{ userSelect: "none" }}>
        <span
          style={
            hovered === fullPath
              ? { ...rowBaseStyle, ...rowHoverStyle }
              : rowBaseStyle
          }
          onClick={() => toggleDir(fullPath)}
          onMouseEnter={() => setHovered(fullPath)}
          onMouseLeave={() => setHovered(null)}
          onContextMenu={(e) => handleContextMenu(e, "dir", relPath)}
        >
          <span style={{ width: 16, display: "inline-block", textAlign: "center" }}>
            {isOpen ? "▼" : "▶"}
          </span>
          {node.name}
        </span>
        {isOpen && (
          <ul style={{ listStyle: "none", paddingLeft: 12, margin: 0 }}>
            {sortTreeNodes(node.children).map(child => (
              <TreeNodeItem
                key={child.path || `${fullPath}/${child.name}`}
                node={child}
                parentPath={fullPath}
                onFileClick={onFileClick}
              />
            ))}
            {editingNode && editingNode.type === 'new' && editingNode.parentPath === relPath && (
              <li key={`new-input-${relPath}`}>
                <input
                  autoFocus
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onBlur={handleInputCancel}
                  style={inputStyle}
                  placeholder={editingNode.isDir ? "新しいフォルダ名" : "新しいファイル名"}
                />
              </li>
            )}
            {editingNode && editingNode.type === 'rename' && editingNode.targetPath === relPath && (
              <li key={`rename-input-${relPath}`}>
                <input
                  autoFocus
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  onBlur={handleInputCancel}
                  style={inputStyle}
                />
              </li>
            )}
          </ul>
        )}
      </li>
    );
  } else {
    return (
      <li key={fullPath}>
        {editingNode && editingNode.type === 'rename' && editingNode.targetPath === relPath ? (
          <input
            autoFocus
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputCancel}
            style={inputStyle}
          />
        ) : (
          <span
            style={
              hovered === fullPath
                ? { ...rowBaseStyle, ...rowHoverStyle, ...fileSpanStyle }
                : { ...rowBaseStyle, ...fileSpanStyle }
            }
            onClick={() => onFileClick(relPath)}
            onMouseEnter={() => setHovered(fullPath)}
            onMouseLeave={() => setHovered(null)}
            onContextMenu={(e) => handleContextMenu(e, "file", relPath)}
          >
            {node.name}
          </span>
        )}
      </li>
    );
  }
};

export default TreeNodeItem; 
import React, { createContext, useEffect, useState } from "react";
import {
  DIR_MENU_ITEMS,
  DirMenuAction,
  FILE_MENU_ITEMS,
} from "../constants/menu";
import { TreeNode } from "../types/tree";
import { sortTreeNodes } from "../utils/sortTreeNodes";
import {
  dangerButtonStyle,
  dialogOverlayStyle,
  dialogStyle,
  menuItemHoverStyle,
  menuItemStyle,
  rootStyle
} from "./DirectoryTree.styles";
import TreeNodeItem from "./TreeNodeItem";

export type DirectoryTreeContextType = {
  currentDirPath?: string | null;
  openDirs: Record<string, boolean>;
  hovered: string | null;
  editingNode: {
    type: 'new' | 'rename';
    parentPath?: string;
    targetPath?: string;
    isDir: boolean;
  } | null;
  inputValue: string;
  setHovered: (path: string | null) => void;
  toggleDir: (path: string) => void;
  handleContextMenu: (e: React.MouseEvent, type: "dir" | "file", path: string) => void;
  handleInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleInputCancel: () => void;
  setInputValue: (v: string) => void;
};

export const DirectoryTreeContext = createContext<DirectoryTreeContextType | undefined>(undefined);

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
		type: 'new' | 'rename';
		parentPath?: string;
		targetPath?: string;
		isDir: boolean;
	} | null>(null);
	const [inputValue, setInputValue] = useState<string>("");
	const [deletingNode, setDeletingNode] = useState<{
		path: string;
		isDir: boolean;
	} | null>(null);

	// @see: https://tauri.app/reference/javascript/dialog/#savedialogoptions
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "o") {
				e.preventDefault();
				onOpenDirectory();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onOpenDirectory]);

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
      setEditingNode({ type: 'new', parentPath: contextMenu.path, isDir: false });
      setInputValue('');
      setContextMenu(null);
    } else if (action === DirMenuAction.NewFolder) {
      setEditingNode({ type: 'new', parentPath: contextMenu.path, isDir: true });
      setInputValue('');
      setContextMenu(null);
    } else if (action === DirMenuAction.Rename) {
      setEditingNode({ type: 'rename', targetPath: contextMenu.path, isDir: contextMenu.type === 'dir' });
      setInputValue(contextMenu.path.split('/').pop() || '');
      setContextMenu(null);
    } else if (action === DirMenuAction.Delete) {
      setDeletingNode({ path: contextMenu.path, isDir: contextMenu.type === 'dir' });
      setContextMenu(null);
    }
  }

	const handleInputKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter' && inputValue.trim()) {
			if (editingNode?.type === 'new' && editingNode.parentPath) {
				await onCreate(editingNode.parentPath, inputValue, editingNode.isDir);
			} else if (editingNode?.type === 'rename' && editingNode.targetPath) {
				await onRename(editingNode.targetPath, inputValue, editingNode.isDir);
			}
			setEditingNode(null);
			setInputValue('');
		} else if (e.key === 'Escape') {
			setEditingNode(null);
			setInputValue('');
		}
	};

	const handleInputCancel = () => {
		setEditingNode(null);
		setInputValue('');
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
			<div style={rootStyle}>
				{currentDirPath && (
					<div style={{ fontWeight: "bold", fontSize: "1rem", marginBottom: 8, padding: "0.5rem 0.2rem" }}>
						{currentDirPath.split("/").pop()}
					</div>
				)}
				<ul style={{ listStyle: "none", paddingLeft: 12, margin: 0 }}>
					{sortTreeNodes(nodes).map(node => {
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
						style={{
							position: "fixed",
							top: contextMenu.y,
							left: contextMenu.x,
							background: "#232323",
							color: "#fff",
							borderRadius: 6,
							boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
							zIndex: 1000,
							minWidth: 160,
							padding: "4px 0",
							fontSize: "1rem",
						}}
					>
						{contextMenu.type === "dir" ? (
							<>
								{DIR_MENU_ITEMS.map((item, idx) => (
									<div
										key={item.key}
										style={
											menuHoverIdx === idx
												? { ...menuItemStyle, ...menuItemHoverStyle }
												: menuItemStyle
										}
										onMouseEnter={() => setMenuHoverIdx(idx)}
										onMouseLeave={() => setMenuHoverIdx(null)}
										onClick={() => handleMenuClick(item.key)}
									>
										{item.label}
									</div>
								))}
							</>
						) : (
							<>
								{FILE_MENU_ITEMS.map((item, idx) => (
									<div
										key={item.key}
										style={
											menuHoverIdx === idx
												? { ...menuItemStyle, ...menuItemHoverStyle }
												: menuItemStyle
										}
										onMouseEnter={() => setMenuHoverIdx(idx)}
										onMouseLeave={() => setMenuHoverIdx(null)}
										onClick={() => handleMenuClick(item.key)}
									>
										{item.label}
									</div>
								))}
							</>
						)}
					</div>
				)}
				{deletingNode && (
					<div style={dialogOverlayStyle}>
						<div style={dialogStyle}>
							<div style={{ marginBottom: 16 }}>
								'{deletingNode.path.split('/').pop()}' を削除しますか？
							</div>
							<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
								<button onClick={handleDeleteConfirm} style={dangerButtonStyle}>削除</button>
								<button onClick={() => setDeletingNode(null)}>キャンセル</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</DirectoryTreeContext.Provider>
	);
};

export default DirectoryTree;

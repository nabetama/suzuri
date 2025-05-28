import React, { useEffect, useState } from "react";
import {
  DIR_MENU_ITEMS,
  DirMenuAction,
  FILE_MENU_ITEMS,
} from "../constants/menu";
import { TreeNode } from "../types/tree";
import {
  fileSpanStyle,
  menuItemHoverStyle,
  menuItemStyle,
  rootStyle,
  rowBaseStyle,
  rowHoverStyle,
} from "./DirectoryTree.styles";

type DirectoryTreeProps = {
	nodes: TreeNode[];
	onFileClick: (path: string) => void;
	onOpenDirectory: () => void;
	currentDirPath?: string | null;
	onCreate: (parentPath: string, name: string, isDir: boolean) => Promise<void>;
	onRename: (oldPath: string, newName: string, isDir: boolean) => Promise<void>;
	onDelete: (path: string, isDir: boolean) => Promise<void>;
};

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
		type: "dir" | "file";
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
		type: "dir" | "file",
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

	const inputStyle: React.CSSProperties = {
		fontSize: '1rem',
		padding: '2px 8px',
		border: '1px solid #0078d4',
		borderRadius: 4,
		background: '#1e1e1e',
		color: '#fff',
		width: '90%',
		outline: 'none',
	};

	const dialogOverlayStyle: React.CSSProperties = {
		position: 'fixed',
		top: 0, left: 0, right: 0, bottom: 0,
		background: 'rgba(0,0,0,0.3)',
		zIndex: 2000,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	};

	const dialogStyle: React.CSSProperties = {
		background: '#232323',
		color: '#fff',
		borderRadius: 8,
		padding: 24,
		minWidth: 320,
		boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
	};

	const dangerButtonStyle: React.CSSProperties = {
		background: '#d32f2f',
		color: '#fff',
		border: 'none',
		borderRadius: 4,
		padding: '6px 16px',
		cursor: 'pointer',
	};

	// dirPathからの相対パスを計算する関数
	const getRelativePath = (fullPath: string) => {
		if (!currentDirPath) return fullPath;
		return fullPath.startsWith(currentDirPath)
			? fullPath.slice(currentDirPath.length) || '/'
			: fullPath;
	};

	const renderTree = (nodes: TreeNode[], parentPath = "") => {
		const sortedNodes = [...nodes].sort((a, b) => {
			if (a.children && !b.children) return -1;
			if (!a.children && b.children) return 1;
			return (a.name || "").localeCompare(b.name || "", "ja", {
				numeric: true,
				sensitivity: "base",
			});
		});

		return (
			<ul style={{ listStyle: "none", paddingLeft: 12, margin: 0 }}>
				{sortedNodes.map((node) => {
					const fullPath = node.path || `${parentPath}/${node.name}`;
					const relPath = getRelativePath(fullPath);
					if (node.children) {
						const isOpen = openDirs[fullPath] ?? false;
						return (
							<li key={relPath} style={{ userSelect: "none" }}>
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
									<span
										style={{
											width: 16,
											display: "inline-block",
											textAlign: "center",
										}}
									>
										{isOpen ? "▼" : "▶"}
									</span>
									{node.name}
								</span>
								{isOpen && (
									<ul style={{ listStyle: "none", paddingLeft: 12, margin: 0 }}>
										{renderTree(node.children, fullPath)}
										{editingNode && editingNode.type === 'new' && editingNode.parentPath === relPath && (
											<li>
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
											<li>
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
							<li key={relPath}>
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
							</li>
						);
					}
				})}
			</ul>
		);
	};

	return (
		<div style={rootStyle}>
			{currentDirPath && (
				<div
					style={{
						fontWeight: "bold",
						fontSize: "1rem",
						marginBottom: 8,
						padding: "0.5rem 0.2rem",
					}}
				>
					{currentDirPath.split("/").pop()}
				</div>
			)}
			{renderTree(nodes)}
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
	);
};

export default DirectoryTree;

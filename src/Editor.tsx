import { join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { mkdir, readTextFile, remove, rename, writeTextFile } from "@tauri-apps/plugin-fs";
import React, { useCallback, useState } from "react";
import SplitPane from "react-split-pane";
import DirectoryTree from "./components/DirectoryTree";
import MarkdownEditor from "./components/MarkdownEditor";
import MarkdownPreview from "./components/MarkdownPreview";
import { TreeNode } from "./types/tree";
import getMarkdownTree from "./utils/getMarkdownTree";

const Editor: React.FC = () => {
	const [markdown, setMarkdown] = useState("");
	const [dirPath, setDirPath] = useState<string | null>(null);
	const [tree, setTree] = useState<TreeNode[]>([]);
	const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
	const [saveStatus, setSaveStatus] = useState<string>("");

	const handleOpenDirectory = async () => {
		const selected = await open({
			directory: true,
			multiple: false,
		});
		if (typeof selected === "string") {
			setDirPath(selected);
			const mdTree = await getMarkdownTree(selected);
			setTree(mdTree);
			setCurrentFilePath(null);
			setMarkdown("");
		}
	};

	const handleFileClick = async (path: string) => {
		const content = await readTextFile(path);
		setMarkdown(content);
		setCurrentFilePath(path);
		setSaveStatus("");
	};

	const handleSave = useCallback(async () => {
		if (currentFilePath) {
			await writeTextFile(currentFilePath, markdown);
			setSaveStatus("保存しました");
			setTimeout(() => setSaveStatus(""), 1500);
		}
	}, [currentFilePath, markdown]);

	const handleCreate = async (parentPath: string, name: string, isDir: boolean) => {
		if (!dirPath) return;
		const absParent = parentPath === "" ? dirPath : `${dirPath}${parentPath}`;
		const absPath = `${absParent}/${name}`;
		if (isDir) {
			await mkdir(absPath, { recursive: true });
		} else {
			await writeTextFile(absPath, "");
		}
		// update tree
		const mdTree = await getMarkdownTree(dirPath);
		setTree(mdTree);
	};

	const handleRename = async (oldPath: string, newName: string, isDir: boolean) => {
		if (!dirPath) return;
		const absOldPath = `${dirPath}${oldPath}`;
		const parent = absOldPath.split("/").slice(0, -1).join("/");
		const absNewPath = `${parent}/${newName}`;
		await rename(absOldPath, absNewPath);
		const mdTree = await getMarkdownTree(dirPath);
		setTree(mdTree);
	};

	const handleDelete = async (path: string, isDir: boolean) => {
		if (!dirPath) return;
    let targetPath = path;
    if (isDir) {
      targetPath = await join(dirPath, path);
    }
		await remove(targetPath, { recursive: isDir });
		const mdTree = await getMarkdownTree(dirPath);
		setTree(mdTree);
	};

	return (
		<SplitPane split="vertical" minSize={100} defaultSize="20%">
			<DirectoryTree
				nodes={tree}
				onFileClick={handleFileClick}
				onOpenDirectory={handleOpenDirectory}
				currentDirPath={dirPath}
				onCreate={handleCreate}
				onRename={handleRename}
				onDelete={handleDelete}
			/>
			<SplitPane split="vertical" minSize={100} defaultSize="50%">
				<MarkdownEditor
					value={markdown}
					onChange={setMarkdown}
					onSave={handleSave}
					filePath={currentFilePath}
					saveStatus={saveStatus}
				/>
				<MarkdownPreview markdown={markdown} />
			</SplitPane>
		</SplitPane>
	);
};

export default Editor;

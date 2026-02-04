import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useCallback, useState } from "react";

const SAVE_STATUS_DISPLAY_MS = 1500;

export function useMarkdownContent(refreshTree: () => Promise<void>) {
  const [markdown, setMarkdown] = useState("");
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>("");

  const handleFileClick = async (absPath: string) => {
    console.log("handleFileClick", absPath);
    const content = await readTextFile(absPath);
    setMarkdown(content);
    setCurrentFilePath(absPath);
    setSaveStatus("");
  };

  const handleSave = useCallback(async () => {
    if (currentFilePath) {
      await writeTextFile(currentFilePath, markdown);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), SAVE_STATUS_DISPLAY_MS);
      await refreshTree();
    }
  }, [currentFilePath, markdown, refreshTree]);

  const resetContent = () => {
    setCurrentFilePath(null);
    setMarkdown("");
  };

  return {
    markdown,
    setMarkdown,
    currentFilePath,
    saveStatus,
    handleFileClick,
    handleSave,
    resetContent,
  };
}

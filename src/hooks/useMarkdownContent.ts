import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useCallback, useRef, useState } from "react";
import { parseFrontmatter, serializeFrontmatter } from "../utils/frontmatter";

const SAVE_STATUS_DISPLAY_MS = 1500;

export function useMarkdownContent(refreshTree: () => Promise<void>) {
  const [markdown, setMarkdown] = useState("");
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const frontmatterRef = useRef<string | null>(null);

  const handleFileClick = async (absPath: string) => {
    console.log("handleFileClick", absPath);
    const content = await readTextFile(absPath);
    const { frontmatter, body } = parseFrontmatter(content);
    frontmatterRef.current = frontmatter;
    setMarkdown(body);
    setCurrentFilePath(absPath);
    setSaveStatus("");
  };

  const handleSave = useCallback(async () => {
    if (currentFilePath) {
      const content = serializeFrontmatter(frontmatterRef.current, markdown);
      await writeTextFile(currentFilePath, content);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), SAVE_STATUS_DISPLAY_MS);
      await refreshTree();
    }
  }, [currentFilePath, markdown, refreshTree]);

  const resetContent = () => {
    setCurrentFilePath(null);
    setMarkdown("");
    frontmatterRef.current = null;
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

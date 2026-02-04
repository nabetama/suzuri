import React from "react";
import { getFileName } from "../utils/pathUtils";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  filePath?: string | null;
  saveStatus?: string;
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onSave,
  filePath,
  saveStatus,
}) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSave]);

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full">
      <div className="px-4 h-9 min-h-[36px] border-b border-gray-200 dark:border-[#2e2e2e] flex items-center gap-2">
        {filePath && (
          <span
            className="text-gray-400 dark:text-gray-500 text-xs truncate"
            title={filePath}
          >
            {getFileName(filePath)}
          </span>
        )}
        {saveStatus && (
          <span className="text-green-600 dark:text-green-400 text-xs">
            {saveStatus}
          </span>
        )}
      </div>
      <textarea
        className="flex-1 text-[14px] leading-[1.7] px-5 py-4 border-0 outline-none w-full h-full resize-none bg-white dark:bg-[#1a1a1a] text-gray-700 dark:text-[#c7c7c7] break-words"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="# title"
      />
    </div>
  );
};

export default MarkdownEditor;

import { openUrl } from "@tauri-apps/plugin-opener";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import React, { useEffect, useRef } from "react";
import { getFileName } from "../utils/pathUtils";

const lowlight = createLowlight(common);

type WysiwygEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  filePath?: string | null;
  saveStatus?: string;
};

const WysiwygEditor: React.FC<WysiwygEditorProps> = ({
  value,
  onChange,
  onSave,
  filePath,
  saveStatus,
}) => {
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Markdown,
    ],
    content: value,
    contentType: "markdown",
    onUpdate: ({ editor }) => {
      const md = editor.getMarkdown();
      onChangeRef.current(md);
    },
  });

  // Cmd+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSaveRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync external value changes (file switching)
  useEffect(() => {
    if (!editor) return;
    const currentMd = editor.getMarkdown();
    if (value !== currentMd) {
      editor.commands.setContent(value, { contentType: "markdown" });
    }
  }, [editor, value]);

  // Handle external link clicks
  useEffect(() => {
    if (!editor) return;
    const el = editor.view.dom;
    const handler = async (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (
        href &&
        (href.startsWith("http://") || href.startsWith("https://"))
      ) {
        e.preventDefault();
        try {
          await openUrl(href);
        } catch (error) {
          console.error("Failed to open external link:", error);
        }
      }
    };
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [editor]);

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
      <div className="flex-1 overflow-y-auto px-8 py-6 prose prose-sm prose-gray dark:prose-invert max-w-3xl mx-auto w-full text-[15px] leading-relaxed break-words">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default WysiwygEditor;

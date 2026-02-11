import { openUrl } from "@tauri-apps/plugin-opener";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import {
  parseMarkdownImageInput,
  useImageBubbleMenu,
} from "../hooks/useImageBubbleMenu";
import { getFileName } from "../utils/pathUtils";

const lowlight = createLowlight(common);

type WysiwygEditorProps = {
  value: string;
  onChange: (value: string) => void;
  filePath?: string | null;
  saveStatus?: string;
  fontSize?: number;
};

export type WysiwygEditorHandle = {
  focus: () => void;
};

const WysiwygEditor = forwardRef<WysiwygEditorHandle, WysiwygEditorProps>(
  ({ value, onChange, filePath, saveStatus, fontSize = 16 }, ref) => {
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
        Image.configure({
          inline: false,
          allowBase64: true,
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

    useImperativeHandle(ref, () => ({
      focus: () => editor?.commands.focus(),
    }));

    useEffect(() => {
      if (!editor) return;
      const currentMd = editor.getMarkdown();
      if (value !== currentMd) {
        editor.commands.setContent(value, { contentType: "markdown" });
        editor.commands.setTextSelection(0);
      }
    }, [editor, value]);

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

    const {
      imageMarkdown,
      setImageMarkdown,
      imageMenuPosition,
      selectedImagePos,
      selectedImageAttrs,
      editorSurfaceRef,
      imageMenuRef,
      handleFocusCapture,
      handleBlurCapture,
    } = useImageBubbleMenu(editor);

    return (
      <div className="flex-1 min-w-0 flex flex-col h-full">
        <div className="editor-toolbar px-6 h-10 min-h-[40px] flex items-center gap-2">
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
        <div className="flex-1 overflow-y-auto">
          <div
            ref={editorSurfaceRef}
            className="editor-content relative px-6 py-8 prose prose-gray dark:prose-invert mx-auto w-full break-words"
            style={{ "--editor-font-size": `${fontSize}px` } as React.CSSProperties}
          >
            {editor && imageMenuPosition.visible && (
              <div
                ref={imageMenuRef}
                className="image-bubble-menu"
                style={{
                  position: "absolute",
                  top: imageMenuPosition.top,
                  left: imageMenuPosition.left,
                  transform:
                    imageMenuPosition.placement === "top"
                      ? "translate(-50%, -100%)"
                      : "translate(-50%, 0)",
                }}
                data-placement={imageMenuPosition.placement}
                onFocusCapture={handleFocusCapture}
                onBlurCapture={handleBlurCapture}
              >
                <form
                  className="image-bubble-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const parsed = parseMarkdownImageInput(
                      imageMarkdown,
                      selectedImageAttrs?.alt ?? "",
                    );
                    if (!parsed || selectedImagePos === null) return;
                    editor
                      .chain()
                      .focus()
                      .setNodeSelection(selectedImagePos)
                      .updateAttributes("image", {
                        src: parsed.src,
                        alt: parsed.alt,
                        title: parsed.title,
                      })
                      .run();
                  }}
                >
                  <input
                    className="image-bubble-input"
                    value={imageMarkdown}
                    onChange={(e) => setImageMarkdown(e.target.value)}
                    placeholder="![alt](https://...)"
                  />
                  <button className="image-bubble-button" type="submit">
                    Update
                  </button>
                </form>
              </div>
            )}
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    );
  },
);

WysiwygEditor.displayName = "WysiwygEditor";

export default WysiwygEditor;

import { openUrl } from "@tauri-apps/plugin-opener";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Markdown } from "@tiptap/markdown";
import { NodeSelection } from "@tiptap/pm/state";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { getFileName } from "../utils/pathUtils";

const lowlight = createLowlight(common);

const parseMarkdownImageInput = (
  input: string,
  fallbackAlt: string,
): { src: string; alt: string; title: string | null } | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const markdownMatch = trimmed.match(/^!\[(.*?)]\((.*?)(?:\s+"(.*)")?\)$/);
  if (markdownMatch) {
    const [, altRaw, srcRaw, titleRaw] = markdownMatch;
    const src = srcRaw.trim().replace(/^<|>$/g, "");
    if (!src) return null;
    return {
      src,
      alt: altRaw || fallbackAlt,
      title: titleRaw ?? null,
    };
  }

  if (/^(https?:\/\/|data:)/.test(trimmed)) {
    return { src: trimmed, alt: fallbackAlt, title: null };
  }

  return null;
};

const IMAGE_MENU_OFFSET_PX = 12;
const IMAGE_MENU_HEIGHT_PX = 52;

type WysiwygEditorProps = {
  value: string;
  onChange: (value: string) => void;
  filePath?: string | null;
  saveStatus?: string;
};

export type WysiwygEditorHandle = {
  focus: () => void;
};

const WysiwygEditor = forwardRef<WysiwygEditorHandle, WysiwygEditorProps>(
  ({ value, onChange, filePath, saveStatus }, ref) => {
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

    const [imageMarkdown, setImageMarkdown] = useState("");
    const [imageMenuPosition, setImageMenuPosition] = useState<{
      visible: boolean;
      top: number;
      left: number;
      placement: "top" | "bottom";
    }>({ visible: false, top: 0, left: 0, placement: "top" });
    const [selectedImagePos, setSelectedImagePos] = useState<number | null>(
      null,
    );
    const [selectedImageAttrs, setSelectedImageAttrs] = useState<{
      src: string;
      alt: string;
      title: string | null;
    } | null>(null);
    const [isEditingImage, setIsEditingImage] = useState(false);
    const editorSurfaceRef = useRef<HTMLDivElement>(null);
    const imageMenuRef = useRef<HTMLDivElement>(null);

    const updateImageMenu = useCallback(() => {
      if (!editor) return;
      const selection = editor.state.selection;
      if (!editor.isActive("image") || !(selection instanceof NodeSelection)) {
        if (!isEditingImage) {
          setImageMenuPosition((prev) =>
            prev.visible ? { ...prev, visible: false } : prev,
          );
        }
        return;
      }

      const node = selection.node;
      const src = node.attrs.src ?? "";
      const alt = node.attrs.alt ?? "";
      const title = node.attrs.title ?? null;
      setSelectedImagePos(selection.from);
      setSelectedImageAttrs({ src, alt, title });
      setImageMarkdown(`![${alt}](${src})`);

      const surface = editorSurfaceRef.current;
      if (!surface) return;
      const surfaceRect = surface.getBoundingClientRect();
      const domNode = editor.view.nodeDOM(selection.from) as HTMLElement | null;
      const img =
        domNode?.nodeName === "IMG" ? domNode : domNode?.querySelector("img");
      if (!img) return;
      const rect = img.getBoundingClientRect();
      const left = rect.left - surfaceRect.left + rect.width / 2;
      const canPlaceAbove =
        rect.top - surfaceRect.top >
        IMAGE_MENU_HEIGHT_PX + IMAGE_MENU_OFFSET_PX;
      const placement = canPlaceAbove ? "top" : "bottom";
      const top = canPlaceAbove
        ? rect.top - surfaceRect.top - IMAGE_MENU_OFFSET_PX
        : rect.bottom - surfaceRect.top + IMAGE_MENU_OFFSET_PX;
      setImageMenuPosition({
        visible: true,
        top,
        left,
        placement,
      });
    }, [editor, isEditingImage]);

    useEffect(() => {
      if (!editor) return;
      updateImageMenu();
      editor.on("selectionUpdate", updateImageMenu);
      editor.on("transaction", updateImageMenu);
      return () => {
        editor.off("selectionUpdate", updateImageMenu);
        editor.off("transaction", updateImageMenu);
      };
    }, [editor, updateImageMenu]);

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
                onFocusCapture={() => setIsEditingImage(true)}
                onBlurCapture={() => {
                  requestAnimationFrame(() => {
                    if (imageMenuRef.current?.contains(document.activeElement))
                      return;
                    setIsEditingImage(false);
                    updateImageMenu();
                  });
                }}
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

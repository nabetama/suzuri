import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { useCallback, useEffect, useRef, useState } from "react";

const IMAGE_MENU_OFFSET_PX = 12;
const IMAGE_MENU_HEIGHT_PX = 52;

type ImageMenuPosition = {
  visible: boolean;
  top: number;
  left: number;
  placement: "top" | "bottom";
};

type ImageAttrs = {
  src: string;
  alt: string;
  title: string | null;
};

export const parseMarkdownImageInput = (
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

export function useImageBubbleMenu(editor: Editor | null) {
  const [imageMarkdown, setImageMarkdown] = useState("");
  const [imageMenuPosition, setImageMenuPosition] = useState<ImageMenuPosition>(
    { visible: false, top: 0, left: 0, placement: "top" },
  );
  const [selectedImagePos, setSelectedImagePos] = useState<number | null>(null);
  const [selectedImageAttrs, setSelectedImageAttrs] =
    useState<ImageAttrs | null>(null);
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
      rect.top - surfaceRect.top > IMAGE_MENU_HEIGHT_PX + IMAGE_MENU_OFFSET_PX;
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

  const handleFocusCapture = useCallback(() => {
    setIsEditingImage(true);
  }, []);

  const handleBlurCapture = useCallback(() => {
    requestAnimationFrame(() => {
      if (imageMenuRef.current?.contains(document.activeElement)) return;
      setIsEditingImage(false);
      updateImageMenu();
    });
  }, [updateImageMenu]);

  return {
    imageMarkdown,
    setImageMarkdown,
    imageMenuPosition,
    selectedImagePos,
    selectedImageAttrs,
    editorSurfaceRef,
    imageMenuRef,
    handleFocusCapture,
    handleBlurCapture,
  };
}

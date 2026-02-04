import { openUrl } from "@tauri-apps/plugin-opener";
import parse from "html-react-parser";
import { marked } from "marked";
import type React from "react";
import { useEffect, useRef, useState } from "react";

type MarkdownPreviewProps = {
  markdown: string;
};

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ markdown }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    const html = marked.parse(markdown);
    if (html instanceof Promise) {
      html.then(setHtml);
    } else {
      setHtml(html);
    }
  }, [markdown]);

  useEffect(() => {
    const handler = async (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "A") {
        const href = (target as HTMLAnchorElement).href;
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
      }
    };
    const el = ref.current;
    if (el) {
      el.addEventListener("click", handler);
    }
    return () => {
      if (el) {
        el.removeEventListener("click", handler);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="px-4 h-9 min-h-[36px] border-b border-gray-200 dark:border-[#2e2e2e] flex items-center">
        <span className="text-gray-400 dark:text-gray-500 text-xs">
          Preview
        </span>
      </div>
      <div
        ref={ref}
        className="flex-1 overflow-y-auto px-8 py-6 prose prose-sm prose-gray dark:prose-invert max-w-3xl mx-auto w-full text-[15px] leading-relaxed break-words"
      >
        {parse(html)}
      </div>
    </div>
  );
};

export default MarkdownPreview;

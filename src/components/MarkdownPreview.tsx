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
    <div
      ref={ref}
      className="bg-[#141414] text-[#c7c7c7] w-full h-full min-h-0 overflow-y-auto p-[16px]"
    >
      <style>{"a { color: #38bdf8; }"}</style>
      {parse(html)}
    </div>
  );
};

export default MarkdownPreview;

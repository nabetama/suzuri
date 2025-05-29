import { openUrl } from "@tauri-apps/plugin-opener";
import parse from "html-react-parser";
import { marked } from "marked";
import type React from "react";
import { useEffect, useRef, useState } from "react";

const rootStyle: React.CSSProperties = {
  wordBreak: "break-word",
  flex: 1,
  minWidth: 0,
  padding: "1rem",
  background: "#f9f9f9",
  overflowY: "auto",
  minHeight: 0,
};

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
    <div ref={ref} style={rootStyle}>
      {parse(html)}
    </div>
  );
};

export default MarkdownPreview;

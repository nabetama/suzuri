import React from 'react';
import { marked } from 'marked';
import '../Editor.css';

type MarkdownPreviewProps = {
  markdown: string;
};

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ markdown }) => {
  return (
    <div
      className="markdown-preview"
      style={{ flex: 1, padding: '1rem', background: '#f9f9f9', overflowY: 'auto', minHeight: 0 }}
      dangerouslySetInnerHTML={{ __html: marked(markdown) }}
    />
  );
};

export default MarkdownPreview; 
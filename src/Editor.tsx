import React, { useState } from 'react';

const Editor: React.FC = () => {
  const [markdown, setMarkdown] = useState('');

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <textarea
        style={{ flex: 1, fontSize: '1rem', padding: '1rem' }}
        value={markdown}
        onChange={e => setMarkdown(e.target.value)}
        placeholder="ここにMarkdownを入力してください"
      />
      <div
        style={{ flex: 1, padding: '1rem', background: '#f9f9f9', overflowY: 'auto' }}
      >
        {markdown}
      </div>
    </div>
  );
};

export default Editor;

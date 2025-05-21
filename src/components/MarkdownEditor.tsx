import React from 'react';

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  filePath?: string | null;
  saveStatus?: string;
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ value, onChange, onSave, filePath, saveStatus }) => {
  // Cmd+S/Ctrl+Sで保存
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 8 }}>
        {filePath && <span style={{ color: '#888', fontSize: '0.9rem' }}>{filePath}</span>}
        {saveStatus && <span style={{ color: 'green', fontSize: '0.9rem' }}>{saveStatus}</span>}
      </div>
      <textarea
        style={{ flex: 1, fontSize: '1rem', padding: '1rem', border: 'none', borderRight: '1px solid #eee', outline: 'none' }}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="ここにMarkdownを入力してください"
      />
    </div>
  );
};

export default MarkdownEditor; 
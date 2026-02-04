import type React from "react";

type TreeNodeInputProps = {
  inputRef: React.RefObject<HTMLInputElement>;
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onCancel: () => void;
  placeholder: string;
};

const TreeNodeInput: React.FC<TreeNodeInputProps> = ({
  inputRef,
  value,
  onChange,
  onKeyDown,
  onCancel,
  placeholder,
}) => {
  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onCancel();
        } else {
          onKeyDown(e);
        }
      }}
      onBlur={onCancel}
      className="text-[13px] px-2 py-[3px] border border-blue-500 dark:border-[#0078d4] rounded-sm bg-white dark:bg-[#23272e] text-gray-900 dark:text-[#d4d4d4] w-full outline-none focus:border-blue-600 dark:focus:border-[#3794ff] focus:ring-1 focus:ring-blue-600 dark:focus:ring-[#3794ff] placeholder:text-gray-400 dark:placeholder:text-[#666]"
      placeholder={placeholder}
    />
  );
};

export default TreeNodeInput;

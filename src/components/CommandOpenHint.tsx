import type React from "react";
import { useCommandOpenDirectory } from "../hooks/useCommandOpenDirectory";

type CommandOpenHintProps = {
  handleOpenDirectory: () => void;
};

const CommandOpenHint: React.FC<CommandOpenHintProps> = ({
  handleOpenDirectory,
}) => {
  useCommandOpenDirectory(handleOpenDirectory);

  return (
    <div className="flex justify-center items-center h-screen">
      <p className="text-white text-2xl font-bold">⌘ + O</p>
    </div>
  );
};

export default CommandOpenHint;

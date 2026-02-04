import { join } from "@tauri-apps/api/path";
import { message } from "@tauri-apps/plugin-dialog";
import {
  exists,
  mkdir,
  remove,
  rename,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { getParentPath } from "../utils/pathUtils";

export function useFileOperations(
  dirPath: string | null,
  refreshTree: () => Promise<void>,
) {
  const handleCreate = async (
    parentAbsPath: string,
    name: string,
    isDir: boolean,
  ) => {
    if (!dirPath) return;

    const absPath = await join(parentAbsPath, name);

    if (await exists(absPath)) {
      await message("The same file or directory already exists.");
      return;
    }

    if (isDir) {
      await mkdir(absPath, { recursive: true }).catch((err) => {
        console.error("Failed to create directory.", err);
      });
    } else {
      await writeTextFile(absPath, "", {
        createNew: true,
      }).catch((err) => {
        console.error("Failed to create file.", err);
      });
    }
    await refreshTree();
  };

  const handleRename = async (oldAbsPath: string, newName: string) => {
    if (!dirPath) return;

    if (!newName.endsWith(".md")) {
      await message("The file name must end with .md.");
      return;
    }

    const parent = getParentPath(oldAbsPath);
    const newAbsPath = await join(parent, newName);

    if (await exists(newAbsPath)) {
      await message("The same file or directory already exists.");
      return;
    }

    await rename(oldAbsPath, newAbsPath);
    await refreshTree();
  };

  const handleDelete = async (absPath: string, isDir: boolean) => {
    if (!dirPath) return;
    await remove(absPath, { recursive: isDir });
    await refreshTree();
  };

  return {
    handleCreate,
    handleRename,
    handleDelete,
  };
}

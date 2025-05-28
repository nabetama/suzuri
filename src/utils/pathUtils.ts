import { join } from "@tauri-apps/api/path";

/**
 * ルートディレクトリと相対パスを結合して絶対パスを返す
 */
export async function toAbsolutePath(root: string, relPath: string): Promise<string> {
  if (!relPath || relPath === "") return root;
  return await join(root, relPath);
}

/**
 * 親ディレクトリの絶対パスを取得
 */
export function getParentPath(absPath: string): string {
  return absPath.split("/").slice(0, -1).join("/");
} 
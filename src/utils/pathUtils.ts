/**
 * 親ディレクトリの絶対パスを取得
 */
export function getParentPath(absPath: string): string {
  return absPath.split("/").slice(0, -1).join("/");
}

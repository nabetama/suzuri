// Directory tree related types

export type AbsolutePath = string;
export type ParentDirectoryPath = AbsolutePath;
export type NodePath = AbsolutePath;

export type NodeAction =
  | {
      type: "new";
      isDir: boolean;
      path: ParentDirectoryPath;
    }
  | {
      type: "rename" | "delete";
      isDir: boolean;
      path: NodePath;
    };

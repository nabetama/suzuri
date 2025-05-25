enum DirMenuAction {
	NewFile = "new_file",
	NewFolder = "new_folder",
	Rename = "rename",
	Delete = "delete",
}

const DIR_MENU_ITEMS = [
	{ key: DirMenuAction.NewFile, label: "新しいファイル" },
	{ key: DirMenuAction.NewFolder, label: "新しいフォルダ" },
	{ key: DirMenuAction.Rename, label: "名前の変更" },
	{ key: DirMenuAction.Delete, label: "削除" },
];

const FILE_MENU_ITEMS = [
	{ key: DirMenuAction.Rename, label: "名前の変更" },
	{ key: DirMenuAction.Delete, label: "削除" },
];

export { DIR_MENU_ITEMS, DirMenuAction, FILE_MENU_ITEMS };

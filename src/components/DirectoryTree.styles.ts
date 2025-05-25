import type { CSSProperties } from "react";

export const rootStyle: CSSProperties = {
	background: "#2c2c2c",
	color: "#727272",
	width: "100%",
	minWidth: 0,
	borderRight: "1px solid #ddd",
	padding: "0.5rem 0.5rem 0 0.5rem",
	overflowY: "auto",
	height: "100%",
};

export const rowBaseStyle: CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: 4,
	color: "#727272",
	userSelect: "none",
	transition: "color 0.2s, background 0.2s",
	fontSize: "1.1rem",
	lineHeight: 1.8,
	padding: "2px 4px 2px 0.5rem",
	borderRadius: 4,
	cursor: "pointer",
};
export const rowHoverStyle: CSSProperties = {
	background: "#353535",
	color: "#fff",
};
export const fileSpanStyle: CSSProperties = {
	paddingLeft: 20,
};

export const menuItemStyle: CSSProperties = {
	padding: "8px 16px",
	cursor: "pointer",
	transition: "background 0.15s",
	borderRadius: 4,
};

export const menuItemHoverStyle: CSSProperties = {
	background: "rgba(255,255,255,0.08)",
};

export type ToolbarGroupKey =
  | "undo"
  | "heading"
  | "fontSize"
  | "format"
  | "script"
  | "align"
  | "list"
  | "insert"
  | "htmlView"
  | "clear";

export type ToolbarItemKey =
  | "undo"
  | "redo"
  | "heading"
  | "fontFamily"
  | "fontSize"
  | "lineHeight"
  | "letterSpacing"
  | "fontColor"
  | "bgColor"
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "subscript"
  | "superscript"
  | "clearFormat"
  | "emoji"
  | "outdent"
  | "indent"
  | "alignLeft"
  | "alignCenter"
  | "alignRight"
  | "alignJustify"
  | "bulletList"
  | "numberList"
  | "checkList"
  | "quote"
  | "htmlView"
  | "image"
  | "youtube"
  | "link"
  | "horizontalRule"
  | "table"
  | "clearEditor";

/** 可隐藏的工具栏项，支持单个按钮或整组 */
export type ToolbarHiddenKey = ToolbarItemKey | ToolbarGroupKey;

export const TOOLBAR_GROUP_ITEMS: Record<ToolbarGroupKey, ToolbarItemKey[]> = {
  undo: ["undo", "redo"],
  heading: ["heading"],
  fontSize: ["fontFamily", "fontSize", "lineHeight", "letterSpacing"],
  format: [
    "fontColor",
    "bgColor",
    "bold",
    "italic",
    "underline",
    "strikethrough",
  ],
  script: ["subscript", "superscript", "clearFormat", "emoji"],
  align: [
    "outdent",
    "indent",
    "alignLeft",
    "alignCenter",
    "alignRight",
    "alignJustify",
  ],
  list: ["bulletList", "numberList", "checkList", "quote"],
  htmlView: ["htmlView"],
  insert: ["image", "youtube", "link", "horizontalRule", "table"],
  clear: ["clearEditor"],
};

export function isToolbarItemHidden(
  item: ToolbarItemKey,
  hiddenToolbarItems: ToolbarHiddenKey[] = []
): boolean {
  if (hiddenToolbarItems.includes(item)) {
    return true;
  }

  return hiddenToolbarItems.some((key) => {
    const groupItems = TOOLBAR_GROUP_ITEMS[key as ToolbarGroupKey];
    return groupItems?.includes(item);
  });
}

export function hasVisibleToolbarItems(
  items: ToolbarItemKey[],
  hiddenToolbarItems: ToolbarHiddenKey[] = []
): boolean {
  return items.some((item) => !isToolbarItemHidden(item, hiddenToolbarItems));
}

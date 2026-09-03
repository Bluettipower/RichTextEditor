import type { ElementFormatType, LexicalEditor, TextFormatType } from "lexical";
import { $getRoot, CAN_REDO_COMMAND, CAN_UNDO_COMMAND } from "lexical";

import { $isHtmlBlockNode } from "../nodes/HtmlBlockNode";
import { resolveToolbarFontFamily } from "./fontFamily";
import {
  canRedoHtmlBlock,
  canUndoHtmlBlock,
  recordHtmlBlockHistory,
  redoHtmlBlockHistory,
  setApplyingHtmlBlockHistory,
  undoHtmlBlockHistory,
} from "./htmlBlockHistory";

export const HTML_BLOCK_CONTENT_CLASS = "lexicaltheme__htmlBlock__content";

let savedHtmlBlockRange: Range | null = null;
let savedHtmlBlockBookmark: SelectionBookmark | null = null;

interface SelectionBookmark {
  startPath: number[];
  startOffset: number;
  endPath: number[];
  endOffset: number;
}

function getNodePath(root: Node, node: Node): number[] | null {
  const path: number[] = [];
  let current: Node | null = node;
  while (current && current !== root) {
    const parentNode: Node | null = current.parentNode;
    if (!parentNode) {
      return null;
    }
    path.unshift(Array.prototype.indexOf.call(parentNode.childNodes, current));
    current = parentNode;
  }
  return current === root ? path : null;
}

function getNodeFromPath(root: Node, path: number[]): Node | null {
  let current: Node = root;
  for (const index of path) {
    const next = current.childNodes[index];
    if (!next) {
      return null;
    }
    current = next;
  }
  return current;
}

function createSelectionBookmark(
  content: HTMLElement,
  range: Range
): SelectionBookmark | null {
  const startPath = getNodePath(content, range.startContainer);
  const endPath = getNodePath(content, range.endContainer);
  if (!startPath || !endPath) {
    return null;
  }
  return {
    startPath,
    startOffset: range.startOffset,
    endPath,
    endOffset: range.endOffset,
  };
}

function rangeFromBookmark(
  content: HTMLElement,
  bookmark: SelectionBookmark
): Range | null {
  const startNode = getNodeFromPath(content, bookmark.startPath);
  const endNode = getNodeFromPath(content, bookmark.endPath);
  if (!startNode || !endNode) {
    return null;
  }
  try {
    const range = document.createRange();
    range.setStart(startNode, bookmark.startOffset);
    range.setEnd(endNode, bookmark.endOffset);
    return range;
  } catch {
    return null;
  }
}

function getLiveRangeInContent(
  content: HTMLElement,
  requireNonCollapsed = false
): Range | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !selection.anchorNode) {
    return null;
  }
  if (!content.contains(selection.anchorNode)) {
    return null;
  }
  const range = selection.getRangeAt(0);
  if (requireNonCollapsed && range.collapsed) {
    return null;
  }
  return range;
}

export function saveHtmlBlockSelection(content?: HTMLElement | null): void {
  if (!content) {
    content = getActiveHtmlBlockContent();
    if (!content) {
      return;
    }
  }
  const range = getLiveRangeInContent(content);
  if (!range) {
    return;
  }
  savedHtmlBlockRange = range.cloneRange();
  savedHtmlBlockBookmark = createSelectionBookmark(content, range);
}

function restoreHtmlBlockSelection(content: HTMLElement): boolean {
  if (getLiveRangeInContent(content)) {
    saveHtmlBlockSelection(content);
    return true;
  }

  content.focus({ preventScroll: true });

  if (getLiveRangeInContent(content)) {
    saveHtmlBlockSelection(content);
    return true;
  }

  let range: Range | null = null;
  if (
    savedHtmlBlockRange &&
    content.contains(savedHtmlBlockRange.commonAncestorContainer)
  ) {
    range = savedHtmlBlockRange;
  } else if (savedHtmlBlockBookmark) {
    range = rangeFromBookmark(content, savedHtmlBlockBookmark);
  }

  if (!range) {
    return false;
  }

  const selection = window.getSelection();
  if (!selection) {
    return false;
  }
  selection.removeAllRanges();
  selection.addRange(range);
  savedHtmlBlockRange = range.cloneRange();
  return true;
}

function isSelectionInContent(content: HTMLElement): boolean {
  return getLiveRangeInContent(content) !== null;
}

export function getHtmlBlockContentForToolbar(
  editor: LexicalEditor
): HTMLElement | null {
  const content =
    getActiveHtmlBlockContent() ?? getHtmlBlockContentElement(editor);
  if (!content) {
    return null;
  }

  restoreHtmlBlockSelection(content);
  return content;
}

function getHtmlBlockContentElement(editor: LexicalEditor): HTMLElement | null {
  const active = getActiveHtmlBlockContent();
  if (active) {
    return active;
  }

  let content: HTMLElement | null = null;
  editor.getEditorState().read(() => {
    const root = $getRoot();
    const children = root.getChildren();
    if (children.length === 1 && $isHtmlBlockNode(children[0])) {
      const dom = editor.getElementByKey(children[0].getKey());
      content =
        (dom?.querySelector(
          `.${HTML_BLOCK_CONTENT_CLASS}`
        ) as HTMLElement | null) ?? null;
    }
  });

  return content;
}

function withHtmlBlockContent(
  editor: LexicalEditor,
  fn: (content: HTMLElement) => boolean
): boolean {
  const content = getHtmlBlockContentForToolbar(editor);
  if (!content) {
    return false;
  }
  const result = fn(content);
  saveHtmlBlockSelection(content);
  return result;
}

export interface HtmlBlockToolbarState {
  blockType: string;
  fontSize: string;
  fontFamily: string;
  lineHeight?: string;
  letterSpacing?: string;
  fontColor: string;
  bgColor: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  isSubscript: boolean;
  isSuperscript: boolean;
  elementFormat: ElementFormatType;
  isLink: boolean;
}

export function rememberHtmlBlockSelection(content: HTMLElement): void {
  saveHtmlBlockSelection(content);
}

export function getActiveHtmlBlockContent(): HTMLElement | null {
  const active = document.activeElement;
  if (
    active instanceof HTMLElement &&
    active.classList.contains(HTML_BLOCK_CONTENT_CLASS)
  ) {
    return active;
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const anchor = selection.anchorNode;
  if (!anchor) {
    return null;
  }

  const element =
    anchor.nodeType === Node.ELEMENT_NODE
      ? (anchor as HTMLElement)
      : anchor.parentElement;

  return (
    (element?.closest(
      `.${HTML_BLOCK_CONTENT_CLASS}`
    ) as HTMLElement | null) ?? null
  );
}

export function isHtmlBlockEditing(): boolean {
  return getActiveHtmlBlockContent() !== null;
}

export function isPreserveHtmlBlockMode(editor: LexicalEditor): boolean {
  if (isHtmlBlockEditing()) {
    return true;
  }

  let hasHtmlBlock = false;
  editor.getEditorState().read(() => {
    const root = $getRoot();
    const children = root.getChildren();
    hasHtmlBlock = children.length === 1 && $isHtmlBlockNode(children[0]);
  });
  return hasHtmlBlock;
}

function getSelectionElement(): HTMLElement | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }
  const anchor = selection.anchorNode;
  if (!anchor) {
    return null;
  }
  return anchor.nodeType === Node.ELEMENT_NODE
    ? (anchor as HTMLElement)
    : anchor.parentElement;
}

function getClosestBlock(
  content: HTMLElement,
  node: Node | null
): HTMLElement | null {
  let current: Node | null = node;
  while (current && current !== content) {
    if (current instanceof HTMLElement) {
      const tag = current.tagName.toLowerCase();
      if (
        /^(p|div|h[1-6]|li|blockquote|pre)$/.test(tag) ||
        current.classList.contains(HTML_BLOCK_CONTENT_CLASS)
      ) {
        if (!current.classList.contains(HTML_BLOCK_CONTENT_CLASS)) {
          return current;
        }
      }
    }
    current = current.parentNode;
  }
  return content;
}

function wrapRangeWithSpan(range: Range, styles: Record<string, string>): void {
  const span = document.createElement("span");
  for (const [key, value] of Object.entries(styles)) {
    span.style.setProperty(key, value);
  }

  try {
    range.surroundContents(span);
  } catch {
    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);
  }

  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(span);
    selection.addRange(newRange);
    savedHtmlBlockRange = newRange.cloneRange();
  }
}

function stripStyleFromNodeTree(root: ParentNode, property: string): void {
  const elements =
    root instanceof HTMLElement
      ? [root, ...Array.from(root.querySelectorAll("*"))]
      : Array.from(root.querySelectorAll("*"));

  for (const element of elements) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }
    element.style.removeProperty(property);
    if (
      (element.tagName === "SPAN" || element.tagName === "FONT") &&
      !element.getAttribute("style")?.trim()
    ) {
      unwrapElement(element);
    }
  }
}

function unwrapElement(element: HTMLElement): void {
  const parent = element.parentNode;
  if (!parent) {
    return;
  }
  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }
  parent.removeChild(element);
}

function isRangeFullyContainedIn(
  range: Range,
  container: Node
): boolean {
  const containerRange = document.createRange();
  containerRange.selectNodeContents(container);
  return (
    range.compareBoundaryPoints(Range.START_TO_START, containerRange) >= 0 &&
    range.compareBoundaryPoints(Range.END_TO_END, containerRange) <= 0
  );
}

function clearBlockStyleOnAncestors(
  content: HTMLElement,
  node: Node,
  property: string
): void {
  let current: Node | null =
    node instanceof HTMLElement ? node.parentElement : node.parentNode;

  while (current instanceof HTMLElement && current !== content) {
    const tag = current.tagName.toLowerCase();
    if (/^(p|div|h[1-6]|li|blockquote|pre)$/.test(tag)) {
      current.style.removeProperty(property);
    }
    current = current.parentElement;
  }
}

function selectElementContents(element: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }
  selection.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(element);
  selection.addRange(newRange);
  savedHtmlBlockRange = newRange.cloneRange();
}

function findStyleWrapperInRange(
  range: Range,
  property: string
): HTMLElement | null {
  let node: Node | null = range.commonAncestorContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node instanceof HTMLElement) {
    if (node.classList.contains(HTML_BLOCK_CONTENT_CLASS)) {
      break;
    }
    if (
      node.style.getPropertyValue(property) &&
      isRangeFullyContainedIn(range, node)
    ) {
      return node;
    }
    node = node.parentElement;
  }

  return null;
}

function trimRangeWhitespace(range: Range): Range {
  const trimmed = range.cloneRange();

  while (!trimmed.collapsed) {
    const { startContainer, startOffset } = trimmed;
    if (startContainer.nodeType !== Node.TEXT_NODE) {
      break;
    }
    const text = startContainer.textContent ?? "";
    if (startOffset < text.length && /\s/.test(text.charAt(startOffset))) {
      trimmed.setStart(startContainer, startOffset + 1);
      continue;
    }
    break;
  }

  while (!trimmed.collapsed) {
    const { endContainer, endOffset } = trimmed;
    if (endContainer.nodeType !== Node.TEXT_NODE || endOffset === 0) {
      break;
    }
    const text = endContainer.textContent ?? "";
    if (/\s/.test(text.charAt(endOffset - 1))) {
      trimmed.setEnd(endContainer, endOffset - 1);
      continue;
    }
    break;
  }

  return trimmed;
}

function removeEmptyTextSiblings(node: Node): void {
  const siblings = [node.previousSibling, node.nextSibling];
  for (const sibling of siblings) {
    if (
      sibling &&
      sibling.nodeType === Node.TEXT_NODE &&
      !(sibling.textContent ?? "").length
    ) {
      sibling.parentNode?.removeChild(sibling);
    }
  }
}

const BLOCK_TAG_RE = /^(p|div|h[1-6]|li|blockquote|pre|ul|ol|table|section|article)$/i;

function isBlockElement(element: Element): boolean {
  return BLOCK_TAG_RE.test(element.tagName);
}

function hasBlockChild(element: HTMLElement): boolean {
  return Array.from(element.children).some((child) => isBlockElement(child));
}

function ensureWrapperPaintsBackground(element: HTMLElement): void {
  if (hasBlockChild(element)) {
    element.style.display = "block";
  }
}

function getBlocksIntersectingRange(
  content: HTMLElement,
  range: Range
): HTMLElement[] {
  const blocks: HTMLElement[] = [];
  const candidates = Array.from(
    content.querySelectorAll("p,div,h1,h2,h3,h4,h5,h6,li,blockquote,pre")
  );
  for (const candidate of candidates) {
    if (!(candidate instanceof HTMLElement) || candidate === content) {
      continue;
    }
    if (candidate.classList.contains(HTML_BLOCK_CONTENT_CLASS)) {
      continue;
    }
    if (!range.intersectsNode(candidate)) {
      continue;
    }
    if (blocks.some((block) => block.contains(candidate))) {
      continue;
    }
    blocks.push(candidate);
  }
  return blocks;
}

function applyStyleToBlocks(
  content: HTMLElement,
  blocks: HTMLElement[],
  property: string,
  value: string
): void {
  for (const block of blocks) {
    block.style.setProperty(property, value);
    Array.from(block.children).forEach((child) => {
      stripStyleFromNodeTree(child, property);
    });
    clearBlockStyleOnAncestors(content, block, property);
  }
  const first = blocks[0];
  const last = blocks[blocks.length - 1];
  if (!first || !last) {
    return;
  }
  const selection = window.getSelection();
  if (!selection) {
    return;
  }
  const newRange = document.createRange();
  newRange.setStartBefore(first);
  newRange.setEndAfter(last);
  selection.removeAllRanges();
  selection.addRange(newRange);
  saveHtmlBlockSelection(content);
}

function applyStyleToSelection(
  content: HTMLElement,
  range: Range,
  property: string,
  value: string,
  applyToBlockWhenCollapsed = true
): void {
  if (range.collapsed && applyToBlockWhenCollapsed) {
    const block = getClosestBlock(content, range.startContainer);
    if (block) {
      block.style.setProperty(property, value);
    }
    return;
  }

  const existingWrapper = findStyleWrapperInRange(range, property);
  if (existingWrapper) {
    existingWrapper.style.setProperty(property, value);
    if (property === "background-color") {
      ensureWrapperPaintsBackground(existingWrapper);
    }
    Array.from(existingWrapper.children).forEach((child) => {
      stripStyleFromNodeTree(child, property);
    });
    clearBlockStyleOnAncestors(content, existingWrapper, property);
    selectElementContents(existingWrapper);
    return;
  }

  const workingRange = trimRangeWhitespace(range);
  if (workingRange.collapsed) {
    return;
  }

  if (property === "background-color") {
    const blocks = getBlocksIntersectingRange(content, workingRange);
    if (blocks.length > 1) {
      applyStyleToBlocks(content, blocks, property, value);
      return;
    }
    if (blocks.length === 1) {
      const blockRange = document.createRange();
      blockRange.selectNodeContents(blocks[0]);
      const coversWholeBlock =
        workingRange.compareBoundaryPoints(Range.START_TO_START, blockRange) <=
          0 &&
        workingRange.compareBoundaryPoints(Range.END_TO_END, blockRange) >= 0;
      if (coversWholeBlock) {
        applyStyleToBlocks(content, blocks, property, value);
        return;
      }
    }
  }

  const startNode = workingRange.startContainer;
  clearBlockStyleOnAncestors(content, startNode, property);

  const fragment = workingRange.extractContents();
  stripStyleFromNodeTree(fragment, property);

  const fragmentHasBlock =
    fragment instanceof DocumentFragment &&
    Array.from(fragment.children).some((child) => isBlockElement(child));
  const wrapper = document.createElement(fragmentHasBlock ? "div" : "span");
  if (fragmentHasBlock) {
    wrapper.style.display = "block";
  }
  wrapper.style.setProperty(property, value);
  wrapper.appendChild(fragment);
  workingRange.insertNode(wrapper);
  removeEmptyTextSiblings(wrapper);
  selectElementContents(wrapper);
}

function removeInlineStyle(property: string): boolean {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return false;
  }
  const range = selection.getRangeAt(0);

  const content =
    getActiveHtmlBlockContent() ??
    range.commonAncestorContainer.parentElement?.closest(
      `.${HTML_BLOCK_CONTENT_CLASS}`
    );
  if (!content) {
    return false;
  }

  if (range.collapsed) {
    const block = getClosestBlock(content as HTMLElement, range.startContainer);
    if (block) {
      block.style.removeProperty(property);
    }
    return true;
  }
  const fragment = range.extractContents();
  stripStyleFromNodeTree(fragment, property);
  range.insertNode(fragment);
  return true;
}

function applyInlineStyles(styles: Record<string, string>): boolean {
  const content = resolveHtmlBlockContent();
  if (!content) {
    return false;
  }

  content.focus();
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return false;
  }

  const range = selection.getRangeAt(0).cloneRange();
  const blockStyleKeys = ["line-height", "letter-spacing"] as const;

  for (const key of blockStyleKeys) {
    if (!(key in styles)) {
      continue;
    }
    applyStyleToSelection(
      content,
      selection.getRangeAt(0).cloneRange(),
      key,
      styles[key]
    );
    return true;
  }

  if (range.collapsed) {
    wrapRangeWithSpan(range, styles);
    return true;
  }

  wrapRangeWithSpan(range, styles);
  return true;
}

export function syncActiveHtmlBlockToNode(editor: LexicalEditor): void {
  const content = getActiveHtmlBlockContent();
  if (content) {
    syncHtmlBlockContentToNode(editor, content);
  }
}

function notifyHtmlBlockUndoRedo(editor: LexicalEditor): void {
  setTimeout(() => {
    editor.dispatchCommand(CAN_UNDO_COMMAND, canUndoHtmlBlock());
    editor.dispatchCommand(CAN_REDO_COMMAND, canRedoHtmlBlock());
  }, 0);
}

function syncHtmlBlockContentToNode(
  editor: LexicalEditor,
  content: HTMLElement
): void {
  editor.update(() => {
    const root = $getRoot();
    for (const child of root.getChildren()) {
      if (!$isHtmlBlockNode(child)) {
        continue;
      }
      const dom = editor.getElementByKey(child.getKey());
      if (dom?.contains(content)) {
        child.setHtml(content.innerHTML);
        break;
      }
    }
  });
  saveHtmlBlockSelection(content);
  notifyHtmlBlockUndoRedo(editor);
}

export function applyHtmlBlockFormatAndSync(
  editor: LexicalEditor,
  apply: () => boolean
): boolean {
  return withHtmlBlockContent(editor, (content) => {
    const before = content.innerHTML;
    if (!apply()) {
      return false;
    }
    recordHtmlBlockHistory(before, content.innerHTML);
    syncHtmlBlockContentToNode(editor, content);
    requestAnimationFrame(() => {
      restoreHtmlBlockSelection(content);
    });
    return true;
  });
}

function applyHtmlFromHistory(
  editor: LexicalEditor,
  html: string | null
): boolean {
  if (html == null) {
    return false;
  }
  const content = getHtmlBlockContentForToolbar(editor);
  if (!content) {
    return false;
  }
  setApplyingHtmlBlockHistory(true);
  content.innerHTML = html;
  syncHtmlBlockContentToNode(editor, content);
  requestAnimationFrame(() => {
    restoreHtmlBlockSelection(content);
    setApplyingHtmlBlockHistory(false);
  });
  return true;
}

export function undoHtmlBlock(editor: LexicalEditor): boolean {
  return applyHtmlFromHistory(editor, undoHtmlBlockHistory());
}

export function redoHtmlBlock(editor: LexicalEditor): boolean {
  return applyHtmlFromHistory(editor, redoHtmlBlockHistory());
}

export function applyHtmlBlockTextFormat(format: TextFormatType): boolean {
  const content = getActiveHtmlBlockContent();
  if (!content) {
    return false;
  }

  content.focus();

  const commandMap: Partial<Record<TextFormatType, string>> = {
    bold: "bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "strikeThrough",
    subscript: "subscript",
    superscript: "superscript",
  };

  const command = commandMap[format];
  if (!command) {
    return false;
  }

  document.execCommand(command, false);
  return true;
}

function resolveHtmlBlockContent(): HTMLElement | null {
  const active = getActiveHtmlBlockContent();
  if (active) {
    return active;
  }

  if (
    savedHtmlBlockRange &&
    savedHtmlBlockRange.commonAncestorContainer instanceof Node
  ) {
    const fromRange =
      savedHtmlBlockRange.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (savedHtmlBlockRange.commonAncestorContainer as HTMLElement)
        : savedHtmlBlockRange.commonAncestorContainer.parentElement;
    const content = fromRange?.closest(
      `.${HTML_BLOCK_CONTENT_CLASS}`
    ) as HTMLElement | null;
    if (content) {
      return content;
    }
  }

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const node = selection.getRangeAt(0).commonAncestorContainer;
    const element =
      node.nodeType === Node.ELEMENT_NODE
        ? (node as HTMLElement)
        : node.parentElement;
    return (
      (element?.closest(
        `.${HTML_BLOCK_CONTENT_CLASS}`
      ) as HTMLElement | null) ?? null
    );
  }

  return null;
}

function applyHtmlBlockBackgroundColor(value: string): boolean {
  const content = resolveHtmlBlockContent();
  if (!content) {
    return false;
  }

  restoreHtmlBlockSelection(content);
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return false;
  }

  applyStyleToSelection(
    content,
    selection.getRangeAt(0),
    "background-color",
    value,
    false
  );
  return true;
}

export function applyHtmlBlockStyleText(
  styles: Record<string, string>
): boolean {
  if ("color" in styles) {
    const content = resolveHtmlBlockContent();
    if (!content) {
      return false;
    }
    restoreHtmlBlockSelection(content);
    document.execCommand("foreColor", false, styles.color);
    return true;
  }

  if ("background-color" in styles) {
    return applyHtmlBlockBackgroundColor(styles["background-color"]);
  }

  if ("font-family" in styles) {
    if (!styles["font-family"]) {
      return removeInlineStyle("font-family");
    }
    return applyInlineStyles({ "font-family": styles["font-family"] });
  }

  return applyInlineStyles(styles);
}

function placeCaretAtStart(element: HTMLElement): void {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }
  const range = document.createRange();
  if (element.firstChild) {
    range.setStart(element.firstChild, 0);
  } else {
    range.setStart(element, 0);
  }
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  savedHtmlBlockRange = range.cloneRange();
}

export function insertHtmlBlockEnter(shiftKey = false): boolean {
  const content = getActiveHtmlBlockContent();
  if (!content) {
    return false;
  }

  const before = content.innerHTML;
  restoreHtmlBlockSelection(content);
  content.focus({ preventScroll: true });

  const applied = shiftKey
    ? document.execCommand("insertLineBreak", false)
    : document.execCommand("insertParagraph", false);

  if (applied) {
    recordHtmlBlockHistory(before, content.innerHTML);
    return true;
  }

  if (shiftKey) {
    return false;
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return false;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const block = getClosestBlock(content, range.startContainer);
  if (!block || block === content) {
    return document.execCommand("insertLineBreak", false);
  }

  const afterRange = document.createRange();
  afterRange.setStart(range.startContainer, range.startOffset);
  afterRange.setEndAfter(block.lastChild ?? block);
  const after = afterRange.extractContents();

  const newBlock = block.cloneNode(false) as HTMLElement;
  if (!after.textContent?.trim() && !after.querySelector("img, br, video, table")) {
    newBlock.appendChild(document.createElement("br"));
  } else {
    newBlock.appendChild(after);
  }
  block.after(newBlock);
  placeCaretAtStart(newBlock);
  recordHtmlBlockHistory(before, content.innerHTML);
  return true;
}

export function applyHtmlBlockHeading(
  headingTag: string | "paragraph"
): boolean {
  const content = getActiveHtmlBlockContent();
  if (!content) {
    return false;
  }

  content.focus();
  document.execCommand(
    "formatBlock",
    false,
    headingTag === "paragraph" ? "p" : headingTag
  );
  return true;
}

export function applyHtmlBlockElementFormat(
  format: ElementFormatType
): boolean {
  const content = getActiveHtmlBlockContent();
  if (!content) {
    return false;
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return false;
  }

  const block = getClosestBlock(content, selection.anchorNode);
  if (!block || block === content) {
    content.style.textAlign = format;
    return true;
  }

  block.style.textAlign = format;
  return true;
}

export function applyHtmlBlockIndent(outdent = false): boolean {
  const content = getActiveHtmlBlockContent();
  if (!content) {
    return false;
  }
  content.focus();
  document.execCommand(outdent ? "outdent" : "indent", false);
  return true;
}

export function applyHtmlBlockList(ordered: boolean): boolean {
  const content = getActiveHtmlBlockContent();
  if (!content) {
    return false;
  }
  content.focus();
  // execCommand 的列表命令是切换命令，如果已经是列表则会移除列表
  document.execCommand(ordered ? "insertOrderedList" : "insertUnorderedList");
  return true;
}

export function applyHtmlBlockLink(
  url: string | null,
  target?: string
): boolean {
  let content = getActiveHtmlBlockContent();
  if (!content && savedHtmlBlockRange) {
    const ancestor = savedHtmlBlockRange.commonAncestorContainer;
    const el =
      ancestor.nodeType === Node.ELEMENT_NODE
        ? (ancestor as HTMLElement)
        : ancestor.parentElement;
    content =
      (el?.closest(`.${HTML_BLOCK_CONTENT_CLASS}`) as HTMLElement | null) ??
      null;
  }
  if (!content) {
    return false;
  }
  content.focus();

  if (!restoreHtmlBlockSelection(content)) {
    return false;
  }

  if (url === null) {
    document.execCommand("unlink", false);
  } else {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      const link = document.createElement("a");
      link.href = url;
      link.textContent = url;
      if (target) {
        link.target = target;
      }
      range.insertNode(link);

      const newRange = document.createRange();
      newRange.setStartAfter(link);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } else {
      document.execCommand("createLink", false, url);

      // 为刚创建的链接设置 target 属性
      if (target) {
        const anchor = selection.anchorNode;
        let linkEl: HTMLAnchorElement | null = null;
        if (anchor?.nodeType === Node.TEXT_NODE) {
          linkEl = anchor.parentElement?.closest("a") ?? null;
        } else if (anchor instanceof HTMLElement) {
          linkEl = anchor.closest("a");
        }
        if (linkEl) {
          linkEl.target = target;
        }
      }
    }
  }
  return true;
}

export function isHtmlBlockLinkSelected(): boolean {
  const content = getActiveHtmlBlockContent();
  if (!content) {
    return false;
  }

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    // 检查保存的选区
    if (savedHtmlBlockRange) {
      let node: Node | null = savedHtmlBlockRange.commonAncestorContainer;
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement;
      }
      while (node instanceof HTMLElement && content.contains(node)) {
        if (node.tagName === "A") {
          return true;
        }
        node = node.parentElement;
      }
    }
    return false;
  }

  let node: Node | null = selection.anchorNode;
  if (node?.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node instanceof HTMLElement && content.contains(node)) {
    if (node.tagName === "A") {
      return true;
    }
    node = node.parentElement;
  }

  return false;
}

export function getHtmlBlockLinkUrl(): string | null {
  const content = getActiveHtmlBlockContent();
  if (!content) {
    return null;
  }

  const selection = window.getSelection();
  let node: Node | null = null;

  if (selection && selection.rangeCount > 0) {
    node = selection.anchorNode;
  } else if (savedHtmlBlockRange) {
    node = savedHtmlBlockRange.commonAncestorContainer;
  }

  if (!node) {
    return null;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node instanceof HTMLElement && content.contains(node)) {
    if (node.tagName === "A") {
      return (node as HTMLAnchorElement).href;
    }
    node = node.parentElement;
  }

  return null;
}

export function getHtmlBlockLinkTarget(): string {
  const content = getActiveHtmlBlockContent();
  if (!content) {
    return "";
  }

  const selection = window.getSelection();
  let node: Node | null = null;

  if (selection && selection.rangeCount > 0) {
    node = selection.anchorNode;
  } else if (savedHtmlBlockRange) {
    node = savedHtmlBlockRange.commonAncestorContainer;
  }

  if (!node) {
    return "";
  }

  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node instanceof HTMLElement && content.contains(node)) {
    if (node.tagName === "A") {
      return (node as HTMLAnchorElement).target ?? "";
    }
    node = node.parentElement;
  }

  return "";
}

export function applyHtmlBlockQuote(): boolean {
  const content = getActiveHtmlBlockContent();
  if (!content) {
    return false;
  }
  content.focus();
  document.execCommand("formatBlock", false, "blockquote");
  return true;
}

export function insertHtmlAtCursor(html: string): boolean {
  const content = getActiveHtmlBlockContent();
  if (!content) {
    return false;
  }
  content.focus();

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    content.insertAdjacentHTML("beforeend", html);
    return true;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const template = document.createElement("template");
  template.innerHTML = html;
  const fragment = template.content;

  const lastChild = fragment.lastChild;
  range.insertNode(fragment);

  if (lastChild) {
    const newRange = document.createRange();
    newRange.setStartAfter(lastChild);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    savedHtmlBlockRange = newRange.cloneRange();
  }

  return true;
}

export function insertHtmlBlockEmoji(emoji: string): boolean {
  const content = getActiveHtmlBlockContent();
  if (!content) {
    return false;
  }
  content.focus();

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    if (savedHtmlBlockRange && content.contains(savedHtmlBlockRange.commonAncestorContainer)) {
      selection?.removeAllRanges();
      selection?.addRange(savedHtmlBlockRange);
    } else {
      content.insertAdjacentText("beforeend", emoji);
      return true;
    }
  }

  document.execCommand("insertText", false, emoji);
  return true;
}

export function insertHtmlBlockImage(
  src: string,
  altText: string,
  width?: string,
  height?: string
): boolean {
  const w = width || "100%";
  const h = height || "auto";
  const html = `<img src="${src}" alt="${altText}" style="max-width:100%;width:${w};height:${h};" />`;
  return insertHtmlAtCursor(html);
}

export function insertHtmlBlockYouTube(videoId: string): boolean {
  const html = `<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="max-width:100%;"></iframe>`;
  return insertHtmlAtCursor(html);
}

export function insertHtmlBlockHorizontalRule(): boolean {
  return insertHtmlAtCursor("<hr />");
}

export function insertHtmlBlockTable(
  rows: number,
  cols: number,
  includeHeaders?: { rows?: boolean; columns?: boolean }
): boolean {
  let html = '<table style="border-collapse:collapse;width:100%;">';

  const cellStyle = 'style="border:1px solid #ddd;padding:8px;min-width:50px;"';
  const headerStyle = 'style="border:1px solid #ddd;padding:8px;min-width:50px;font-weight:bold;background:#f5f5f5;"';

  const startRow = includeHeaders?.rows ? 0 : 1;

  if (includeHeaders?.rows) {
    html += "<thead><tr>";
    for (let c = 0; c < cols; c++) {
      html += `<th ${headerStyle}>&nbsp;</th>`;
    }
    html += "</tr></thead>";
  }

  html += "<tbody>";
  for (let r = startRow; r < rows; r++) {
    html += "<tr>";
    for (let c = 0; c < cols; c++) {
      if (includeHeaders?.columns && c === 0) {
        html += `<th ${headerStyle}>&nbsp;</th>`;
      } else {
        html += `<td ${cellStyle}>&nbsp;</td>`;
      }
    }
    html += "</tr>";
  }
  html += "</tbody></table>";

  return insertHtmlAtCursor(html);
}

export function clearHtmlBlockFormatting(): boolean {
  const content = getActiveHtmlBlockContent();
  if (!content) {
    return false;
  }
  content.focus();
  document.execCommand("removeFormat", false);
  return true;
}

function getInlineStyleFromSelection(
  property: string,
  walkToContent = false
): string | undefined {
  const selection = window.getSelection();
  let node: Node | null = null;

  if (selection && selection.rangeCount > 0) {
    node = selection.getRangeAt(0).startContainer;
  } else if (savedHtmlBlockRange) {
    node = savedHtmlBlockRange.startContainer;
  }

  if (!node) {
    return undefined;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node instanceof HTMLElement) {
    const inlineValue = node.style.getPropertyValue(property);
    if (inlineValue) {
      return inlineValue;
    }
    if (node.classList.contains(HTML_BLOCK_CONTENT_CLASS)) {
      break;
    }
    const tag = node.tagName.toLowerCase();
    if (
      !walkToContent &&
      /^(p|div|h[1-6]|li|blockquote|pre)$/.test(tag)
    ) {
      break;
    }
    node = node.parentElement;
  }

  return undefined;
}

function normalizeLineHeightValue(
  lineHeight: string,
  fontSize: string
): string {
  const options = ["1", "1.2", "1.5", "1.75", "2", "2.5", "3", "4"];

  if (options.includes(lineHeight)) {
    return lineHeight;
  }

  if (!lineHeight || !lineHeight.endsWith("px")) {
    return lineHeight;
  }

  const fontSizePx = Number.parseFloat(fontSize);
  const lineHeightPx = Number.parseFloat(lineHeight);
  if (!fontSizePx || !lineHeightPx) {
    return lineHeight;
  }

  const ratio = lineHeightPx / fontSizePx;
  const matched = options.find(
    (option) => Math.abs(Number.parseFloat(option) - ratio) < 0.05
  );
  return matched ?? lineHeight;
}

function normalizeBgColor(value: string): string {
  const normalized = value.replace(/\s+/g, "").toLowerCase();
  if (
    !value ||
    normalized === "transparent" ||
    normalized === "rgba(0,0,0,0)" ||
    normalized === "rgba(0,0,0,0.0)"
  ) {
    return "transparent";
  }
  return value;
}

export function readHtmlBlockToolbarState(
  editor?: LexicalEditor
): HtmlBlockToolbarState | null {
  const content = editor
    ? getHtmlBlockContentElement(editor)
    : getActiveHtmlBlockContent();
  if (!content) {
    return null;
  }

  let element = getSelectionElement();
  if (
    !element &&
    savedHtmlBlockRange &&
    content.contains(savedHtmlBlockRange.commonAncestorContainer)
  ) {
    const node = savedHtmlBlockRange.commonAncestorContainer;
    element =
      node.nodeType === Node.ELEMENT_NODE
        ? (node as HTMLElement)
        : node.parentElement;
  }

  if (!element || !content.contains(element)) {
    element = content;
  }

  const block = getClosestBlock(content, element);
  const target = block && block !== content ? block : element;
  const computed = window.getComputedStyle(target);
  const blockTag = block && block !== content ? block.tagName.toLowerCase() : "p";

  let blockType = "paragraph";
  if (/^h[1-6]$/.test(blockTag)) {
    blockType = blockTag;
  } else if (blockTag === "blockquote" || target.closest("blockquote")) {
    blockType = "quote";
  } else if (target.closest("ul")) {
    blockType = "bullet";
  } else if (target.closest("ol")) {
    blockType = "number";
  }

  const textAlign = computed.textAlign;
  let elementFormat: ElementFormatType = "left";
  if (textAlign === "center") {
    elementFormat = "center";
  } else if (textAlign === "right") {
    elementFormat = "right";
  } else if (textAlign === "justify") {
    elementFormat = "justify";
  }

  const inlineLineHeight = getInlineStyleFromSelection("line-height");
  const inlineLetterSpacing = getInlineStyleFromSelection("letter-spacing");

  const inlineFontFamily = getInlineStyleFromSelection("font-family", true);

  return {
    blockType,
    fontSize: computed.fontSize,
    fontFamily: resolveToolbarFontFamily(inlineFontFamily),
    lineHeight: normalizeLineHeightValue(
      inlineLineHeight || computed.lineHeight,
      computed.fontSize
    ),
    letterSpacing: inlineLetterSpacing || computed.letterSpacing,
    fontColor: computed.color,
    bgColor: normalizeBgColor(
      getInlineStyleFromSelection("background-color") || computed.backgroundColor
    ),
    isBold: document.queryCommandState("bold"),
    isItalic: document.queryCommandState("italic"),
    isUnderline: document.queryCommandState("underline"),
    isStrikethrough: document.queryCommandState("strikeThrough"),
    isSubscript: document.queryCommandState("subscript"),
    isSuperscript: document.queryCommandState("superscript"),
    elementFormat,
    isLink: !!element.closest("a"),
  };
}

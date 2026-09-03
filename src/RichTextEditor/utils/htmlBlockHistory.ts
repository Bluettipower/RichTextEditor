const MAX_HISTORY = 100;

let undoStack: string[] = [];
let redoStack: string[] = [];
let currentHtml = "";
let applying = false;

export function initHtmlBlockHistory(html: string): void {
  undoStack = [];
  redoStack = [];
  currentHtml = html;
  applying = false;
}

export function recordHtmlBlockHistory(before: string, after: string): void {
  if (applying || before === after) {
    currentHtml = after;
    return;
  }
  undoStack.push(before);
  if (undoStack.length > MAX_HISTORY) {
    undoStack.shift();
  }
  currentHtml = after;
  redoStack = [];
}

export function undoHtmlBlockHistory(): string | null {
  if (undoStack.length === 0) {
    return null;
  }
  const prev = undoStack.pop() as string;
  redoStack.push(currentHtml);
  currentHtml = prev;
  return prev;
}

export function redoHtmlBlockHistory(): string | null {
  if (redoStack.length === 0) {
    return null;
  }
  const next = redoStack.pop() as string;
  undoStack.push(currentHtml);
  currentHtml = next;
  return next;
}

export function canUndoHtmlBlock(): boolean {
  return undoStack.length > 0;
}

export function canRedoHtmlBlock(): boolean {
  return redoStack.length > 0;
}

export function isApplyingHtmlBlockHistory(): boolean {
  return applying;
}

export function setApplyingHtmlBlockHistory(value: boolean): void {
  applying = value;
}

export function getHtmlBlockHistoryCurrent(): string {
  return currentHtml;
}

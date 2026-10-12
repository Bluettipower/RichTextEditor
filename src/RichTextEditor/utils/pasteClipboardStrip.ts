import { stripTextColorFromHtml } from "./stripColorFromHtml";

export const LEXICAL_CLIPBOARD_MIME = "application/x-lexical-editor";
export const HTML_BLOCK_INTERNAL_MIME = "application/x-bluetti-html-block";

export function isLexicalInternalClipboard(
  data: DataTransfer,
  namespace: string
): boolean {
  const lexicalString = data.getData(LEXICAL_CLIPBOARD_MIME);
  if (!lexicalString) {
    return false;
  }
  try {
    const payload = JSON.parse(lexicalString) as {
      namespace?: string;
      nodes?: unknown[];
    };
    return (
      payload.namespace === namespace && Array.isArray(payload.nodes)
    );
  } catch {
    return false;
  }
}

export function shouldPreservePasteColors(
  data: DataTransfer,
  namespace: string
): boolean {
  if (isLexicalInternalClipboard(data, namespace)) {
    return true;
  }
  if (!data.types.includes(HTML_BLOCK_INTERNAL_MIME)) {
    return false;
  }
  return data.getData(HTML_BLOCK_INTERNAL_MIME) === namespace;
}

export function markHtmlBlockInternalClipboard(
  data: DataTransfer,
  namespace: string
): void {
  data.setData(HTML_BLOCK_INTERNAL_MIME, namespace);
}

export function getHtmlForExternalPaste(data: DataTransfer): string | null {
  const html = data.getData("text/html");
  return html ? stripTextColorFromHtml(html) : null;
}

export function createExternalPasteDataTransfer(
  original: DataTransfer
): DataTransfer {
  const dt = new DataTransfer();
  const html = original.getData("text/html");
  if (html) {
    dt.setData("text/html", stripTextColorFromHtml(html));
  }
  const plain = original.getData("text/plain");
  if (plain) {
    dt.setData("text/plain", plain);
  }
  Array.from(original.files).forEach((file) => dt.items.add(file));
  return dt;
}

export function clipboardHasFilesWithoutText(data: DataTransfer): boolean {
  const hasFiles = data.types.includes("Files") && data.files.length > 0;
  const hasText =
    data.types.includes("text/html") || data.types.includes("text/plain");
  return hasFiles && !hasText;
}

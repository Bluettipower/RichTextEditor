import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $createParagraphNode,
  $getRoot,
  $isDecoratorNode,
  $isElementNode,
  LexicalEditor,
  LexicalNode,
} from "lexical";

import {
  $createHtmlBlockNode,
  $isHtmlBlockNode,
} from "../nodes/HtmlBlockNode";

export interface ImportHtmlOptions {
  /** 为 true 时完整保留 HTML 源码，不做任何 Lexical 转换 */
  preserveStructure?: boolean;
}

function wrapInlineNodes(nodes: LexicalNode[]): LexicalNode[] {
  return nodes.map((node) => {
    if (!$isElementNode(node) && !$isDecoratorNode(node)) {
      const paragraph = $createParagraphNode();
      paragraph.append(node);
      return paragraph;
    }
    return node;
  });
}

function importHtmlWithLexical(editor: LexicalEditor, html: string): LexicalNode[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  const generatedNodes = $generateNodesFromDOM(editor, document);
  return wrapInlineNodes(generatedNodes);
}

/** preserveStructure 模式下：原样存入单个 HtmlBlockNode，不解析、不改动 */
function importHtmlPreserveStructure(html: string): LexicalNode[] {
  return [$createHtmlBlockNode(html)];
}

export function $getRawHtmlFromEditor(editor: LexicalEditor): string | null {
  const root = $getRoot();
  const children = root.getChildren();

  if (children.length === 1 && $isHtmlBlockNode(children[0])) {
    return children[0].getHtml();
  }

  return null;
}

/** 将 HTML 导入编辑器，preserveStructure 为 true 时完整保留源码 */
export function $setEditorHtml(
  editor: LexicalEditor,
  html: string,
  options: ImportHtmlOptions = {}
): void {
  editor.update(() => {
    const root = $getRoot();
    root.clear();

    if (!html.trim()) {
      root.append($createParagraphNode());
      return;
    }

    const nodes = options.preserveStructure
      ? importHtmlPreserveStructure(html)
      : importHtmlWithLexical(editor, html);

    root.append(...nodes);
  });
}

/** 获取编辑器 HTML 内容 */
export function $getEditorHtml(
  editor: LexicalEditor,
  options: ImportHtmlOptions = {}
): string {
  let html = "";
  editor.getEditorState().read(() => {
    if (options.preserveStructure) {
      const rawHtml = $getRawHtmlFromEditor(editor);
      if (rawHtml !== null) {
        html = rawHtml;
        return;
      }
    }
    html = $generateHtmlFromNodes(editor);
  });
  return html;
}

/** 命令式导入 HTML（组件外也可调用） */
export function importHtmlToEditor(
  editor: LexicalEditor,
  html: string,
  options?: ImportHtmlOptions
): void {
  $setEditorHtml(editor, html, options);
}

/** 命令式导出 HTML（组件外也可调用） */
export function getEditorHtml(
  editor: LexicalEditor,
  options?: ImportHtmlOptions
): string {
  return $getEditorHtml(editor, options);
}

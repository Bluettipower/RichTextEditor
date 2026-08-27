import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $createParagraphNode,
  $getRoot,
  $isDecoratorNode,
  $isElementNode,
  LexicalEditor,
  LexicalNode,
  TextNode,
} from "lexical";

import {
  $createHtmlBlockNode,
  DEFAULT_PRESERVE_TAGS,
} from "../nodes/HtmlBlockNode";

export interface ImportHtmlOptions {
  /** 保留 div 等容器节点的原始 HTML 结构，避免 Lexical 扁平化 */
  preserveStructure?: boolean;
  /** 需要保留结构的标签，仅在 preserveStructure 为 true 时生效 */
  preserveTags?: string[];
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

function importHtmlPreserveStructure(
  editor: LexicalEditor,
  html: string,
  preserveTags: string[]
): LexicalNode[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  const body = document.body;
  const nodes: LexicalNode[] = [];

  body.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        const paragraph = $createParagraphNode();
        paragraph.append(new TextNode(text));
        nodes.push(paragraph);
      }
      return;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) {
      return;
    }

    const element = child as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (preserveTags.includes(tag)) {
      nodes.push($createHtmlBlockNode(element.outerHTML, tag));
      return;
    }

    if (element.getAttribute("data-lexical-html-block") === "true") {
      nodes.push($createHtmlBlockNode(element.outerHTML, tag || "div"));
      return;
    }

    const fragmentDoc = new DOMParser().parseFromString(
      element.outerHTML,
      "text/html"
    );
    nodes.push(...wrapInlineNodes($generateNodesFromDOM(editor, fragmentDoc)));
  });

  return nodes;
}

/** 将 HTML 导入编辑器，可选保留原始 DOM 结构 */
export function $setEditorHtml(
  editor: LexicalEditor,
  html: string,
  options: ImportHtmlOptions = {}
): void {
  const preserveTags = options.preserveTags ?? DEFAULT_PRESERVE_TAGS;

  editor.update(() => {
    const root = $getRoot();
    root.clear();

    if (!html.trim()) {
      root.append($createParagraphNode());
      return;
    }

    const nodes = options.preserveStructure
      ? importHtmlPreserveStructure(editor, html, preserveTags)
      : importHtmlWithLexical(editor, html);

    if (nodes.length === 0) {
      root.append($createParagraphNode());
      return;
    }

    root.append(...nodes);
  });
}

/** 获取编辑器 HTML 内容 */
export function $getEditorHtml(
  editor: LexicalEditor,
  _options: ImportHtmlOptions = {}
): string {
  let html = "";
  editor.getEditorState().read(() => {
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

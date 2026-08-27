import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import {
  $applyNodeReplacement,
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  DecoratorNode,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
} from "lexical";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { rememberHtmlBlockSelection } from "../../utils/htmlBlockFormatting";

export type SerializedHtmlBlockNode = Spread<
  {
    html: string;
  },
  SerializedLexicalNode
>;

function HtmlBlockComponent({
  html,
  nodeKey,
}: {
  html: string;
  nodeKey: NodeKey;
}) {
  const [editor] = useLexicalComposerContext();
  const contentRef = useRef<HTMLDivElement>(null);
  const lastSyncedHtml = useRef(html);
  const isMounted = useRef(false);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [editable, setEditable] = useState(() => editor.isEditable());

  const syncHtmlToNode = useCallback(
    (newHtml: string) => {
      if (newHtml === lastSyncedHtml.current) {
        return;
      }
      lastSyncedHtml.current = newHtml;
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isHtmlBlockNode(node)) {
          node.setHtml(newHtml);
        }
      });
    },
    [editor, nodeKey]
  );

  const handleInput = useCallback(() => {
    const el = contentRef.current;
    if (!el) {
      return;
    }
    syncHtmlToNode(el.innerHTML);
  }, [syncHtmlToNode]);

  useEffect(() => {
    return editor.registerEditableListener(setEditable);
  }, [editor]);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el || document.activeElement === el) {
      return;
    }
    if (el.innerHTML !== html) {
      el.innerHTML = html;
      lastSyncedHtml.current = html;

      // 只在非首次渲染时自动聚焦（用户通过 HTML 对话框保存后触发）
      if (isMounted.current) {
        requestAnimationFrame(() => {
          if (document.activeElement !== el) {
            el.focus();
            const selection = window.getSelection();
            if (selection) {
              const range = document.createRange();
              if (el.firstChild) {
                range.setStart(el.firstChild, 0);
              } else {
                range.setStart(el, 0);
              }
              range.collapse(true);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        });
      }
    }
    isMounted.current = true;
  }, [html]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) {
      return;
    }

    const stopLexical = (event: Event) => {
      event.stopPropagation();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const isMod = event.ctrlKey || event.metaKey;
      if (!isMod) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "z":
          event.stopPropagation();
          event.preventDefault();
          if (event.shiftKey) {
            document.execCommand("redo", false);
          } else {
            document.execCommand("undo", false);
          }
          syncHtmlToNode(el.innerHTML);
          rememberHtmlBlockSelection(el);
          return;

        case "y":
          event.stopPropagation();
          event.preventDefault();
          document.execCommand("redo", false);
          syncHtmlToNode(el.innerHTML);
          rememberHtmlBlockSelection(el);
          return;

        case "a": {
          event.stopPropagation();
          event.preventDefault();
          const sel = window.getSelection();
          if (sel) {
            const range = document.createRange();
            range.selectNodeContents(el);
            sel.removeAllRanges();
            sel.addRange(range);
            rememberHtmlBlockSelection(el);
          }
          return;
        }

        case "b":
          event.stopPropagation();
          event.preventDefault();
          document.execCommand("bold", false);
          syncHtmlToNode(el.innerHTML);
          rememberHtmlBlockSelection(el);
          return;

        case "i":
          event.stopPropagation();
          event.preventDefault();
          document.execCommand("italic", false);
          syncHtmlToNode(el.innerHTML);
          rememberHtmlBlockSelection(el);
          return;

        case "u":
          event.stopPropagation();
          event.preventDefault();
          document.execCommand("underline", false);
          syncHtmlToNode(el.innerHTML);
          rememberHtmlBlockSelection(el);
          return;

        case "c":
        case "x":
          // 复制/剪切：阻止 Lexical 拦截，使用浏览器原生行为
          event.stopPropagation();
          if (event.key.toLowerCase() === "x") {
            // 剪切后需要同步
            setTimeout(() => {
              syncHtmlToNode(el.innerHTML);
              rememberHtmlBlockSelection(el);
            }, 0);
          }
          return;

        case "v":
          // 粘贴：阻止 Lexical 拦截，使用浏览器原生行为，粘贴后同步
          event.stopPropagation();
          setTimeout(() => {
            syncHtmlToNode(el.innerHTML);
            rememberHtmlBlockSelection(el);
          }, 0);
          return;

        default:
          break;
      }
    };

    const placeCaret = (x: number, y: number) => {
      let range: Range | null = null;
      if (typeof document.caretRangeFromPoint === "function") {
        range = document.caretRangeFromPoint(x, y);
      } else if (
        typeof (document as any).caretPositionFromPoint === "function"
      ) {
        const pos = (document as any).caretPositionFromPoint(x, y);
        if (pos) {
          range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
        }
      }
      const sel = window.getSelection();
      if (!sel) {
        return;
      }
      if (range && el.contains(range.startContainer)) {
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        const fallback = document.createRange();
        if (el.firstChild) {
          fallback.setStart(el.firstChild, 0);
        } else {
          fallback.setStart(el, 0);
        }
        fallback.collapse(true);
        sel.removeAllRanges();
        sel.addRange(fallback);
      }
    };

    let pendingFocusRAF = 0;

    const handleMouseDown = (event: Event) => {
      event.stopPropagation();

      const me = event as MouseEvent;
      const x = me.clientX;
      const y = me.clientY;
      const hadFocus =
        el === document.activeElement ||
        el.contains(document.activeElement);

      if (!hadFocus) {
        cancelAnimationFrame(pendingFocusRAF);
        pendingFocusRAF = requestAnimationFrame(() => {
          el.focus();
          placeCaret(x, y);
          rememberHtmlBlockSelection(el);
        });
      }
    };

    const captureEvents = [
      "pointerdown",
      "mouseup",
      "click",
      "selectstart",
    ] as const;

    el.addEventListener("mousedown", handleMouseDown, true);
    captureEvents.forEach((name) => {
      el.addEventListener(name, stopLexical, true);
    });
    el.addEventListener("keydown", handleKeyDown, true);

    const saveSelection = () => rememberHtmlBlockSelection(el);
    el.addEventListener("mouseup", saveSelection);
    el.addEventListener("keyup", saveSelection);

    return () => {
      cancelAnimationFrame(pendingFocusRAF);
      el.removeEventListener("mousedown", handleMouseDown, true);
      captureEvents.forEach((name) => {
        el.removeEventListener(name, stopLexical, true);
      });
      el.removeEventListener("keydown", handleKeyDown, true);
      el.removeEventListener("mouseup", saveSelection);
      el.removeEventListener("keyup", saveSelection);
    };
  }, [syncHtmlToNode]);

  const $onDelete = useCallback(
    (event: KeyboardEvent) => {
      const element = editor.getElementByKey(nodeKey);
      const contentEl = element?.querySelector(
        ".lexicaltheme__htmlBlock__content"
      );
      if (contentEl?.contains(document.activeElement)) {
        return false;
      }

      let shouldDelete = false;
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        shouldDelete =
          $isNodeSelection(selection) && selection.has(nodeKey);
      });

      if (!shouldDelete) {
        return false;
      }

      event.preventDefault();
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isHtmlBlockNode(node)) {
          node.remove();
        }
      });
      return true;
    },
    [editor, nodeKey]
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        CLICK_COMMAND,
        (event: MouseEvent) => {
          const element = editor.getElementByKey(nodeKey);
          const contentEl = element?.querySelector(
            ".lexicaltheme__htmlBlock__content"
          );
          if (contentEl?.contains(event.target as Node)) {
            clearSelection();
            return true;
          }
          if (element?.contains(event.target as Node)) {
            if (!event.shiftKey) {
              clearSelection();
            }
            setSelected(!isSelected);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW
      )
    );
  }, [clearSelection, editor, isSelected, nodeKey, $onDelete, setSelected]);

  useEffect(() => {
    const element = editor.getElementByKey(nodeKey);
    if (element !== null) {
      element.classList.toggle("lexicaltheme__htmlBlock_selected", isSelected);
    }
  }, [editor, isSelected, nodeKey]);

  return (
    <div
      ref={contentRef}
      className="lexicaltheme__htmlBlock__content"
      contentEditable={editable}
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleInput}
    />
  );
}

export class HtmlBlockNode extends DecoratorNode<JSX.Element> {
  __html: string;

  static getType(): string {
    return "html-block";
  }

  static clone(node: HtmlBlockNode): HtmlBlockNode {
    return new HtmlBlockNode(node.__html, node.__key);
  }

  static importJSON(serializedNode: SerializedHtmlBlockNode): HtmlBlockNode {
    return $createHtmlBlockNode(serializedNode.html);
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (domNode.getAttribute("data-lexical-html-block") === "true") {
          return {
            conversion: $convertHtmlBlockElement,
            priority: COMMAND_PRIORITY_HIGH,
          };
        }
        return null;
      },
    };
  }

  exportJSON(): SerializedHtmlBlockNode {
    return {
      html: this.__html,
      type: HtmlBlockNode.getType(),
      version: 1,
    };
  }

  exportDOM(): DOMExportOutput {
    const template = document.createElement("template");
    template.innerHTML = this.__html;

    const fragment = template.content;
    if (fragment.childNodes.length === 1 && fragment.firstElementChild) {
      return { element: fragment.firstElementChild as HTMLElement };
    }

    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-lexical-html-block", "true");
    wrapper.innerHTML = this.__html;
    return { element: wrapper };
  }

  constructor(html: string, key?: NodeKey) {
    super(key);
    this.__html = html;
  }

  createDOM(): HTMLElement {
    const element = document.createElement("div");
    element.className = "lexicaltheme__htmlBlock";
    element.setAttribute("data-lexical-html-block", "true");
    element.setAttribute("contenteditable", "false");
    return element;
  }

  updateDOM(): boolean {
    return false;
  }

  isKeyboardSelectable(): boolean {
    return false;
  }

  getHtml(): string {
    return this.__html;
  }

  setHtml(html: string): void {
    const writable = this.getWritable();
    writable.__html = html;
  }

  getTextContent(): string {
    const template = document.createElement("template");
    template.innerHTML = this.__html;
    return template.content.textContent ?? "";
  }

  isInline(): false {
    return false;
  }

  decorate(): JSX.Element {
    return <HtmlBlockComponent html={this.__html} nodeKey={this.__key} />;
  }
}

function $convertHtmlBlockElement(domNode: HTMLElement): DOMConversionOutput {
  const html =
    domNode.getAttribute("data-lexical-raw-html") ?? domNode.innerHTML;

  return {
    node: $createHtmlBlockNode(html),
  };
}

export function $createHtmlBlockNode(html: string): HtmlBlockNode {
  return $applyNodeReplacement(new HtmlBlockNode(html));
}

export function $isHtmlBlockNode(
  node: LexicalNode | null | undefined
): node is HtmlBlockNode {
  return node instanceof HtmlBlockNode;
}

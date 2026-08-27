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
import { useCallback, useEffect } from "react";

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
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);

  const $onDelete = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault();
      editor.update(() => {
        const selection = $getSelection();
        if ($isNodeSelection(selection)) {
          selection.getNodes().forEach((node) => {
            if ($isHtmlBlockNode(node)) {
              node.remove();
            }
          });
        } else {
          const node = $getNodeByKey(nodeKey);
          if ($isHtmlBlockNode(node)) {
            node.remove();
          }
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
          if (element?.contains(event.target as Node)) {
            if (!event.shiftKey) {
              clearSelection();
            }
            setSelected(!isSelected);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
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
      className="lexicaltheme__htmlBlock__content"
      dangerouslySetInnerHTML={{ __html: html }}
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
    return element;
  }

  updateDOM(): boolean {
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
    domNode.getAttribute("data-lexical-raw-html") ??
    domNode.innerHTML;

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

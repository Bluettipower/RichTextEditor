import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $createParagraphNode,
  $getRoot,
  $isDecoratorNode,
  $isElementNode,
  LexicalEditor,
} from "lexical";
import { useCallback, useState } from "react";

import { DialogActions } from "./Dialog";

interface HtmlViewDialogProps {
  editor: LexicalEditor;
  onClose: () => void;
  editable?: boolean;
}

function getEditorHtml(editor: LexicalEditor): string {
  let html = "";
  editor.getEditorState().read(() => {
    html = $generateHtmlFromNodes(editor);
  });
  return html;
}

function applyHtmlToEditor(editor: LexicalEditor, html: string) {
  editor.update(() => {
    const root = $getRoot();
    root.clear();

    if (!html.trim()) {
      root.append($createParagraphNode());
      return;
    }

    const document = new DOMParser().parseFromString(html, "text/html");
    const generatedNodes = $generateNodesFromDOM(editor, document);
    const nodes = generatedNodes.map((node) => {
      if (!$isElementNode(node) && !$isDecoratorNode(node)) {
        const paragraph = $createParagraphNode();
        paragraph.append(node);
        return paragraph;
      }
      return node;
    });

    if (nodes.length === 0) {
      root.append($createParagraphNode());
      return;
    }

    root.append(...nodes);
  });
}

const HtmlViewDialog: React.FC<HtmlViewDialogProps> = (props) => {
  const { editor, onClose, editable = true } = props;
  const [html, setHtml] = useState(() => getEditorHtml(editor));
  const [error, setError] = useState<string>();

  const handleApply = useCallback(() => {
    try {
      applyHtmlToEditor(editor, html);
      setError(undefined);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "HTML 解析失败");
    }
  }, [editor, html, onClose]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(html);
  }, [html]);

  return (
    <div className="lexicaltheme__dialogbody lexicaltheme__htmlview">
      <textarea
        className="lexicaltheme__htmlview__textarea"
        value={html}
        readOnly={!editable}
        onChange={(event) => setHtml(event.target.value)}
        spellCheck={false}
      />
      {error && <p className="lexicaltheme__htmlview__error">{error}</p>}
      <DialogActions>
        <button
          type="button"
          className="insertimage-dialog-button"
          onClick={handleCopy}
        >
          复制
        </button>
        {editable && (
          <button
            type="button"
            className="insertimage-dialog-button"
            onClick={handleApply}
          >
            应用
          </button>
        )}
        <button
          type="button"
          className="insertimage-dialog-button"
          onClick={onClose}
        >
          关闭
        </button>
      </DialogActions>
    </div>
  );
};

export default HtmlViewDialog;

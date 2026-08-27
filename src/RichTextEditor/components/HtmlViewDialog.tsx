import { useCallback, useState } from "react";
import type { LexicalEditor } from "lexical";

import { DialogActions } from "./Dialog";
import {
  $getEditorHtml,
  $setEditorHtml,
  type ImportHtmlOptions,
} from "../utils/htmlImport";

interface HtmlViewDialogProps {
  editor: LexicalEditor;
  onClose: () => void;
  editable?: boolean;
  importHtmlOptions?: ImportHtmlOptions;
}

const HtmlViewDialog: React.FC<HtmlViewDialogProps> = (props) => {
  const { editor, onClose, editable = true, importHtmlOptions } = props;
  const [html, setHtml] = useState(() => $getEditorHtml(editor));
  const [error, setError] = useState<string>();

  const handleApply = useCallback(() => {
    try {
      $setEditorHtml(editor, html, importHtmlOptions);
      setError(undefined);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "HTML 解析失败");
    }
  }, [editor, html, importHtmlOptions, onClose]);

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

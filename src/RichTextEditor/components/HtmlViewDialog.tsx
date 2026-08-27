import { useCallback, useEffect, useRef, useState } from "react";
import type { LexicalEditor } from "lexical";
import { EditorView, basicSetup } from "codemirror";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorState } from "@codemirror/state";
import { html_beautify } from "js-beautify";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [error, setError] = useState<string>();
  const [copied, setCopied] = useState(false);

  const initialHtml = useRef($getEditorHtml(editor, importHtmlOptions));

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const extensions = [
      basicSetup,
      html(),
      oneDark,
      EditorView.lineWrapping,
      EditorView.theme({
        "&": { fontSize: "13px" },
        ".cm-gutters": { minWidth: "36px" },
      }),
    ];

    if (!editable) {
      extensions.push(EditorState.readOnly.of(true));
    }

    const view = new EditorView({
      state: EditorState.create({
        doc: initialHtml.current,
        extensions,
      }),
      parent: containerRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [editable]);

  const getCode = useCallback(() => {
    return viewRef.current?.state.doc.toString() ?? "";
  }, []);

  const handleApply = useCallback(() => {
    try {
      const code = getCode();
      $setEditorHtml(editor, code, importHtmlOptions);
      setError(undefined);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "HTML 解析失败");
    }
  }, [editor, importHtmlOptions, onClose, getCode]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [getCode]);

  const handleFormat = useCallback(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    const formatted = html_beautify(view.state.doc.toString(), {
      indent_size: 2,
      wrap_line_length: 120,
      preserve_newlines: true,
      max_preserve_newlines: 2,
      indent_inner_html: true,
      unformatted: [],
    });
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: formatted,
      },
    });
  }, []);

  return (
    <div className="lexicaltheme__dialogbody lexicaltheme__htmlview">
      <div ref={containerRef} className="lexicaltheme__htmlview__editor" />
      {error && <p className="lexicaltheme__htmlview__error">{error}</p>}
      <DialogActions>
        {editable && (
          <button
            type="button"
            className="insertimage-dialog-button"
            onClick={handleFormat}
          >
            格式化
          </button>
        )}
        <button
          type="button"
          className="insertimage-dialog-button"
          onClick={handleCopy}
        >
          {copied ? "已复制" : "复制"}
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

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $trimTextContentFromAnchor } from "@lexical/selection";
import { $restoreEditorState } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  EditorState,
  RootNode,
} from "lexical";
import { useEffect, useState } from "react";

interface MaxLengthPluginProps {
  max: number;
  preventInput?: boolean;
}

const MaxLengthPlugin: React.FC<MaxLengthPluginProps> = ({
  max,
  preventInput,
}) => {
  const [editor] = useLexicalComposerContext();
  const [textContentSize, setTextContentSize] = useState(0);

  useEffect(() => {
    let lastRestoredEditorState: EditorState | null = null;

    return editor.registerNodeTransform(RootNode, (rootNode: RootNode) => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return;
      }
      const prevEditorState = editor.getEditorState();
      const prevTextContentSize = prevEditorState.read(() =>
        rootNode.getTextContentSize()
      );
      const textContentSize = rootNode.getTextContentSize();
      setTextContentSize(textContentSize);
      if (prevTextContentSize !== textContentSize && preventInput) {
        const delCount = textContentSize - max;
        const anchor = selection.anchor;

        if (delCount > 0) {
          if (
            prevTextContentSize === max &&
            lastRestoredEditorState !== prevEditorState
          ) {
            lastRestoredEditorState = prevEditorState;
            $restoreEditorState(editor, prevEditorState);
          } else {
            $trimTextContentFromAnchor(editor, anchor, delCount);
          }
        }
      }
    });
  }, [editor, max, preventInput]);

  return (
    <div
      className="lexicaltheme__count"
      style={{ color: textContentSize > max ? "red" : "#6b7280" }}
    >
      {textContentSize + "/" + max}
    </div>
  );
};

export default MaxLengthPlugin;

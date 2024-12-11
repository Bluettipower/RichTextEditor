import { $patchStyleText } from "@lexical/selection";
import { $getSelection, LexicalEditor } from "lexical";
import { useCallback } from "react";

import DropDown, { DropDownItem } from "./DropDown";

interface DropDownDropDownLineHeightProps {
  selectionLineHeight?: string;
  editor: LexicalEditor;
  disabled?: boolean;
}

const DropDownLineHeight: React.FC<DropDownDropDownLineHeightProps> = (
  props
) => {
  const { editor, selectionLineHeight, disabled = false } = props;
  const lineHeightOptions = ["1", "1.2", "1.5", "1.75", "2", "2.5", "3", "4"];

  const updateLineHeightInSelection = useCallback(
    (newValue: string) => {
      editor.update(() => {
        if (editor.isEditable()) {
          const selection = $getSelection();
          if (selection !== null) {
            $patchStyleText(selection, {
              "line-height": newValue,
            });
          }
        }
      });
    },
    [editor]
  );

  return (
    <DropDown disabled={disabled} buttonLabel="行高">
      {lineHeightOptions.map((lineHeight) => (
        <DropDownItem
          key={lineHeight}
          active={selectionLineHeight === lineHeight}
          onClick={() => updateLineHeightInSelection(lineHeight)}
        >
          <span>{lineHeight}</span>
        </DropDownItem>
      ))}
    </DropDown>
  );
};

export default DropDownLineHeight;

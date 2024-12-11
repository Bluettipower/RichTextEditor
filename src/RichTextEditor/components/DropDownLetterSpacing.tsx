import { $patchStyleText } from "@lexical/selection";
import { $getSelection, LexicalEditor } from "lexical";
import { useCallback } from "react";
import { range } from "lodash";

import DropDown, { DropDownItem } from "./DropDown";

interface DropDownLetterSpacingProps {
  selectionLetterSpacing?: string;
  editor: LexicalEditor;
  disabled?: boolean;
}

const DropDownLetterSpacing: React.FC<DropDownLetterSpacingProps> = (props) => {
  const { editor, selectionLetterSpacing, disabled = false } = props;
  const letterSpacingOptions = range(0, 6, 1).map((i) => i + "px");

  const updateLetterSpacingInSelection = useCallback(
    (newValue: string) => {
      editor.update(() => {
        if (editor.isEditable()) {
          const selection = $getSelection();
          if (selection !== null) {
            $patchStyleText(selection, {
              "letter-spacing": newValue,
            });
          }
        }
      });
    },
    [editor]
  );

  return (
    <DropDown disabled={disabled} buttonLabel="字间距">
      {letterSpacingOptions.map((letterSpacing) => (
        <DropDownItem
          key={letterSpacing}
          active={selectionLetterSpacing === letterSpacing}
          onClick={() => updateLetterSpacingInSelection(letterSpacing)}
        >
          <span>{letterSpacing}</span>
        </DropDownItem>
      ))}
    </DropDown>
  );
};

export default DropDownLetterSpacing;

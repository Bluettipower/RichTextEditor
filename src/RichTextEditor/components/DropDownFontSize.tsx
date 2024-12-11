import { $patchStyleText } from "@lexical/selection";
import { $getSelection, LexicalEditor } from "lexical";
import { useCallback } from "react";

import DropDown, { DropDownItem } from "./DropDown";

interface DropDownFontSizeProps {
  selectionFontSize: string;
  editor: LexicalEditor;
  disabled?: boolean;
}

const DropDownFontSize: React.FC<DropDownFontSizeProps> = (props) => {
  const { editor, selectionFontSize, disabled = false } = props;
  const fontSizeOptions = [
    "10px",
    "12px",
    "14px",
    "16px",
    "18px",
    "20px",
    "22px",
    "24px",
    "26px",
    "28px",
    "30px",
    "32px",
    "36px",
    "40px",
    "48px",
    "56px",
    "64px",
    "72px",
    "96px",
    "120px",
    "144px",
  ];

  const updateFontSizeInSelection = useCallback(
    (newFontSize: string) => {
      editor.update(() => {
        if (editor.isEditable()) {
          const selection = $getSelection();
          if (selection !== null) {
            $patchStyleText(selection, {
              "font-size": newFontSize,
            });
          }
        }
      });
    },
    [editor]
  );

  return (
    <DropDown disabled={disabled} buttonLabel="字号">
      {fontSizeOptions.map((fontSize) => (
        <DropDownItem
          key={fontSize}
          active={selectionFontSize === fontSize}
          onClick={() => updateFontSizeInSelection(fontSize)}
        >
          <span>{fontSize}</span>
        </DropDownItem>
      ))}
    </DropDown>
  );
};

export default DropDownFontSize;

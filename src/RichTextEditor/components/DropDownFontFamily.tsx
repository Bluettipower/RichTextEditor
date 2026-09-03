import { $patchStyleText } from "@lexical/selection";
import { $getSelection, LexicalEditor } from "lexical";
import { useCallback } from "react";

import DropDown, { DropDownItem } from "./DropDown";
import {
  applyHtmlBlockFormatAndSync,
  applyHtmlBlockStyleText,
  isPreserveHtmlBlockMode,
} from "../utils/htmlBlockFormatting";
import {
  FONT_FAMILY_OPTIONS,
  resolveToolbarFontFamily,
} from "../utils/fontFamily";

interface DropDownFontFamilyProps {
  selectionFontFamily: string;
  editor: LexicalEditor;
  disabled?: boolean;
}

const DropDownFontFamily: React.FC<DropDownFontFamilyProps> = (props) => {
  const { editor, selectionFontFamily, disabled = false } = props;
  const resolvedFontFamily = resolveToolbarFontFamily(selectionFontFamily);

  const currentLabel =
    FONT_FAMILY_OPTIONS.find((o) => o.value === resolvedFontFamily)?.label ??
    "默认字体";

  const updateFontFamily = useCallback(
    (fontFamily: string) => {
      if (isPreserveHtmlBlockMode(editor)) {
        applyHtmlBlockFormatAndSync(editor, () =>
          applyHtmlBlockStyleText({
            "font-family": fontFamily,
          })
        );
        return;
      }

      editor.update(() => {
        if (editor.isEditable()) {
          const selection = $getSelection();
          if (selection !== null) {
            $patchStyleText(selection, {
              "font-family": fontFamily || null,
            });
          }
        }
      });
      editor.focus();
    },
    [editor]
  );

  return (
    <DropDown disabled={disabled} buttonLabel={currentLabel}>
      {FONT_FAMILY_OPTIONS.map((option) => (
        <DropDownItem
          key={option.value || "default"}
          active={resolvedFontFamily === option.value}
          onClick={() => updateFontFamily(option.value)}
        >
          <span style={option.value ? { fontFamily: option.value } : undefined}>
            {option.label}
          </span>
        </DropDownItem>
      ))}
    </DropDown>
  );
};

export default DropDownFontFamily;

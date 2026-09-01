import { $patchStyleText } from "@lexical/selection";
import { $getSelection, LexicalEditor } from "lexical";
import { useCallback } from "react";

import DropDown, { DropDownItem } from "./DropDown";
import {
  applyHtmlBlockFormatAndSync,
  applyHtmlBlockStyleText,
  isPreserveHtmlBlockMode,
} from "../utils/htmlBlockFormatting";

interface DropDownFontFamilyProps {
  selectionFontFamily: string;
  editor: LexicalEditor;
  disabled?: boolean;
}

const FONT_FAMILY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "默认字体" },
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Georgia", label: "Georgia" },
  { value: "Verdana", label: "Verdana" },
  { value: "Courier New", label: "Courier New" },
  { value: "Tahoma", label: "Tahoma" },
  { value: "Trebuchet MS", label: "Trebuchet MS" },
  { value: "Microsoft YaHei", label: "微软雅黑" },
  { value: "SimSun", label: "宋体" },
  { value: "SimHei", label: "黑体" },
  { value: "KaiTi", label: "楷体" },
  { value: "FangSong", label: "仿宋" },
];

const DropDownFontFamily: React.FC<DropDownFontFamilyProps> = (props) => {
  const { editor, selectionFontFamily, disabled = false } = props;

  const currentLabel =
    FONT_FAMILY_OPTIONS.find((o) => o.value === selectionFontFamily)?.label ??
    (selectionFontFamily || "字体");

  const updateFontFamily = useCallback(
    (fontFamily: string) => {
      if (isPreserveHtmlBlockMode(editor)) {
        applyHtmlBlockFormatAndSync(editor, () =>
          applyHtmlBlockStyleText({
            "font-family": fontFamily || "",
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
    },
    [editor]
  );

  return (
    <DropDown disabled={disabled} buttonLabel={currentLabel}>
      {FONT_FAMILY_OPTIONS.map((option) => (
        <DropDownItem
          key={option.value}
          active={selectionFontFamily === option.value}
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

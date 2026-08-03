import {
  $createHeadingNode,
  HeadingTagType,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  LexicalEditor,
} from "lexical";

import DropDown, { DropDownItem } from "./DropDown";

const headingOptions: {
  tag: HeadingTagType | "paragraph";
  label: string;
}[] = [
  { tag: "paragraph", label: "正文" },
  { tag: "h1", label: "标题 1" },
  { tag: "h2", label: "标题 2" },
  { tag: "h3", label: "标题 3" },
  { tag: "h4", label: "标题 4" },
  { tag: "h5", label: "标题 5" },
  { tag: "h6", label: "标题 6" },
];

interface DropDownHeadingProps {
  blockType: string;
  editor: LexicalEditor;
  disabled?: boolean;
}

const DropDownHeading: React.FC<DropDownHeadingProps> = (props) => {
  const { editor, blockType, disabled = false } = props;

  const formatHeading = (headingTag: HeadingTagType | "paragraph") => {
    if (headingTag === blockType) {
      return;
    }

    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (headingTag === "paragraph") {
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          $setBlocksType(selection, () => $createHeadingNode(headingTag));
        }
      }
    });
  };

  const currentLabel =
    headingOptions.find((opt) => opt.tag === blockType)?.label ?? "正文";

  return (
    <DropDown disabled={disabled} buttonLabel={currentLabel}>
      {headingOptions.map(({ tag, label }) => (
        <DropDownItem
          key={tag}
          active={blockType === tag}
          onClick={() => formatHeading(tag)}
        >
          <span className={`lexicaltheme__heading-option lexicaltheme__heading-option--${tag}`}>
            {label}
          </span>
        </DropDownItem>
      ))}
    </DropDown>
  );
};

export default DropDownHeading;

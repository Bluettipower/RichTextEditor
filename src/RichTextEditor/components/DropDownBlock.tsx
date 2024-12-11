import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
import { $createQuoteNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  LexicalEditor,
} from "lexical";
import { $createCodeNode } from "@lexical/code";

import {
  IconChatSquareQuote,
  IconChecklist,
  IconCode,
  IconListOl,
  IconListUl,
  IconTextParagraph,
} from "../icons";

import DropDown, { DropDownItem } from "./DropDown";

const blockTypeToBlockName = {
  bullet: "Bulleted List",
  check: "Check List",
  code: "Code Block",
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  h4: "Heading 4",
  h5: "Heading 5",
  h6: "Heading 6",
  number: "Numbered List",
  paragraph: "Normal",
  quote: "Quote",
};

interface BlockFormatDropDownProps {
  blockType: keyof typeof blockTypeToBlockName;
  editor: LexicalEditor;
  disabled?: boolean;
}

const BlockFormatDropDown: React.FC<BlockFormatDropDownProps> = ({
  editor,
  blockType,
}) => {
  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatBulletList = () => {
    if (blockType !== "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      formatParagraph();
    }
  };

  const formatCheckList = () => {
    if (blockType !== "check") {
      editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    } else {
      formatParagraph();
    }
  };

  const formatNumberedList = () => {
    if (blockType !== "number") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      formatParagraph();
    }
  };

  const formatQuote = () => {
    if (blockType !== "quote") {
      editor.update(() => {
        const selection = $getSelection();
        $setBlocksType(selection, () => $createQuoteNode());
      });
    }
  };

  const formatCode = () => {
    if (blockType !== "code") {
      editor.update(() => {
        let selection = $getSelection();

        if (selection !== null) {
          if (selection.isCollapsed()) {
            $setBlocksType(selection, () => $createCodeNode());
          } else {
            const textContent = selection.getTextContent();
            const codeNode = $createCodeNode();
            selection.insertNodes([codeNode]);
            selection = $getSelection();
            if ($isRangeSelection(selection)) {
              selection.insertRawText(textContent);
            }
          }
        }
      });
    }
  };

  return (
    <DropDown buttonLabel={blockTypeToBlockName[blockType]}>
      <DropDownItem
        active={blockType === "paragraph"}
        onClick={formatParagraph}
      >
        <IconTextParagraph />
        <span>Normal</span>
      </DropDownItem>
      <DropDownItem active={blockType === "bullet"} onClick={formatBulletList}>
        <IconListUl />
        <span>Bullet List</span>
      </DropDownItem>
      <DropDownItem
        active={blockType === "number"}
        onClick={formatNumberedList}
      >
        <IconListOl />
        <span>Numbered List</span>
      </DropDownItem>
      <DropDownItem active={blockType === "check"} onClick={formatCheckList}>
        <IconChecklist />
        <span>Check List</span>
      </DropDownItem>
      <DropDownItem active={blockType === "quote"} onClick={formatQuote}>
        <IconChatSquareQuote />
        <span>Quote</span>
      </DropDownItem>
      <DropDownItem active={blockType === "code"} onClick={formatCode}>
        <IconCode />
        <span>Code Block</span>
      </DropDownItem>
    </DropDown>
  );
};

export default BlockFormatDropDown;

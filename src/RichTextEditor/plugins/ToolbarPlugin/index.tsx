import { $isLinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
} from "@lexical/list";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
} from "@lexical/rich-text";
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
  $setBlocksType,
} from "@lexical/selection";
import { $isDecoratorBlockNode } from "@lexical/react/LexicalDecoratorBlockNode";
import {
  $findMatchingParent,
  $getNearestBlockElementAncestorOrThrow,
  $getNearestNodeOfType,
  mergeRegister,
} from "@lexical/utils";
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isParagraphNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  CLEAR_EDITOR_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  TextFormatType,
  UNDO_COMMAND,
} from "lexical";
import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";

import DropDownFontSize from "../../components/DropDownFontSize";
import { getSelectedNode } from "../../utils/getSelectedNode";
import DropdownColorPicker from "../../components/DropDownColorPicker";
import DropDownLineHeight from "../../components/DropDownLineHeight";
import {
  IconBackgound,
  IconChatSquareQuote,
  IconChecklist,
  IconCloseOutlined,
  IconFileImage,
  IconFontColor,
  IconHorizontalRule,
  IconIndent,
  IconJustify,
  IconLink,
  IconListOl,
  IconListUl,
  IconOutdent,
  IconRedo,
  IconTable,
  IconTextCenter,
  IconTextLeft,
  IconTextRight,
  IconTypeBold,
  IconTypeClear,
  IconTypeItalic,
  IconTypeStrikethrough,
  IconTypeSubscript,
  IconTypeSuperscript,
  IconTypeUnderline,
  IconUndo,
  IconYoutube,
} from "../../icons";
import { InsertImageDialog } from "../ImagesPlugin";
import useModal from "../../utils/useModal";
import { sanitizeUrl } from "../../utils/url";
import DropdownEmoji from "../../components/DropDownEmoji";
import DropDownLetterSpacing from "../../components/DropDownLetterSpacing";
import { InsetYouTubeDialog } from "../YouTubePlugin";
import { InsertTableDialog } from "../TablePlugin";

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

const Divider: React.FC = () => {
  return <div className="lexicaltheme__toolbar__divider" />;
};

interface ToolbarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = (props) => {
  const { children, className, active, ...rest } = props;
  return (
    <button
      type="button"
      className={clsx(
        "toolbarbutton",
        active ? "toolbarbutton-active" : "",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

interface ToolbarPluginProps {
  disabled?: boolean;
}

const ToolbarPlugin: React.FC<ToolbarPluginProps> = (props) => {
  const { disabled } = props;
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const toolbarRef = useRef(null);

  const [blockType, setBlockType] =
    useState<keyof typeof blockTypeToBlockName>("paragraph");
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const [fontSize, setFontSize] = useState<string>("16px");
  const [lineHeight, setLineHeight] = useState<string>();
  const [letterSpacing, setLetterSpacing] = useState<string>();

  const [fontColor, setFontColor] = useState<string>("#000");
  const [bgColor, setBgColor] = useState<string>("#fff");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  const [isLink, setIsLink] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);

  const [elementFormat, setElementFormat] = useState<ElementFormatType>("left");

  const [modal, showModal] = useModal();

  //- update toolbar state
  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && $isRootOrShadowRoot(parent);
            });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode
          );
          const type = parentList
            ? parentList.getListType()
            : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          if (type in blockTypeToBlockName) {
            setBlockType(type as keyof typeof blockTypeToBlockName);
          }
        }
      }
      // Handle buttons
      setFontColor(
        $getSelectionStyleValueForProperty(selection, "color", "#000")
      );
      setBgColor(
        $getSelectionStyleValueForProperty(
          selection,
          "background-color",
          "#fff"
        )
      );
      let matchingParent;
      if ($isLinkNode(parent)) {
        // If node is a link, we need to fetch the parent paragraph node to set format
        matchingParent = $findMatchingParent(
          node,
          (parentNode) => $isElementNode(parentNode) && !parentNode.isInline()
        );
      }

      // If matchingParent is a valid node, pass it's format type
      setElementFormat(
        $isElementNode(matchingParent)
          ? matchingParent.getFormatType()
          : $isElementNode(node)
          ? node.getFormatType()
          : parent?.getFormatType() || "left"
      );
    }
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsSubscript(selection.hasFormat("subscript"));
      setIsSuperscript(selection.hasFormat("superscript"));

      setFontSize(
        $getSelectionStyleValueForProperty(selection, "font-size", "16px")
      );
      setLineHeight(
        $getSelectionStyleValueForProperty(selection, "line-height")
      );
      setLetterSpacing(
        $getSelectionStyleValueForProperty(selection, "letter-spacing", "0px")
      );
    }
  }, [activeEditor]);

  //- register editor
  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor);
        $updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, $updateToolbar]);

  //- update undo/redo state
  useEffect(() => {
    return mergeRegister(
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
        editor.getEditorState().read(() => {
          const root = $getRoot();
          const children = root.getChildren();

          if (children.length > 1) {
            setIsEditorEmpty(false);
          } else {
            if ($isParagraphNode(children[0])) {
              const paragraphChildren = children[0].getChildren();
              setIsEditorEmpty(paragraphChildren.length === 0);
            } else {
              setIsEditorEmpty(false);
            }
          }
        });
      }),
      activeEditor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      activeEditor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      )
    );
  }, [$updateToolbar, activeEditor, editor]);

  const formatText = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  //- handle text style changes
  const applyStyleText = useCallback(
    (styles: Record<string, string>, skipHistoryStack?: boolean) => {
      activeEditor.update(
        () => {
          const selection = $getSelection();
          if (selection !== null) $patchStyleText(selection, styles);
        },
        skipHistoryStack ? { tag: "historic" } : {}
      );
    },
    [activeEditor]
  );

  //-
  const clearFormatting = useCallback(() => {
    activeEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchor = selection.anchor;
        const focus = selection.focus;
        const nodes = selection.getNodes();
        const extractedNodes = selection.extract();

        if (anchor.key === focus.key && anchor.offset === focus.offset) {
          return;
        }

        nodes.forEach((node, idx) => {
          if ($isTextNode(node)) {
            let textNode = node;
            if (idx === 0 && anchor.offset !== 0) {
              textNode = textNode.splitText(anchor.offset)[1] || textNode;
            }
            if (idx === nodes.length - 1) {
              textNode = textNode.splitText(focus.offset)[0] || textNode;
            }

            const extractedTextNode = extractedNodes[0];
            if (nodes.length === 1 && $isTextNode(extractedTextNode)) {
              textNode = extractedTextNode;
            }

            if (textNode.__style !== "") {
              textNode.setStyle("");
            }
            if (textNode.__format !== 0) {
              textNode.setFormat(0);
              $getNearestBlockElementAncestorOrThrow(textNode).setFormat("");
            }
            // eslint-disable-next-line no-param-reassign
            node = textNode;
          } else if ($isHeadingNode(node) || $isQuoteNode(node)) {
            node.replace($createParagraphNode(), true);
          } else if ($isDecoratorBlockNode(node)) {
            node.setFormat("");
          }
        });
      }
    });
  }, [activeEditor]);

  //- font color handler
  const onFontColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean) => {
      applyStyleText({ color: value }, skipHistoryStack);
    },
    [applyStyleText]
  );

  //- background color handler
  const onBgColorSelect = useCallback(
    (value: string, skipHistoryStack: boolean) => {
      applyStyleText({ "background-color": value }, skipHistoryStack);
    },
    [applyStyleText]
  );

  const insertLink = useCallback(() => {
    if (!isLink) {
      activeEditor.dispatchCommand(
        TOGGLE_LINK_COMMAND,
        sanitizeUrl("https://")
      );
    } else {
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [activeEditor, isLink]);

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  return (
    <div ref={toolbarRef} className="lexicaltheme__toolbar">
      {/* Undo/Redo */}
      <ToolbarButton
        disabled={!canUndo || disabled}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        <IconUndo />
      </ToolbarButton>
      <ToolbarButton
        disabled={!canRedo || disabled}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        <IconRedo />
      </ToolbarButton>
      <Divider />

      {/* font size */}
      <DropDownFontSize
        disabled={disabled}
        selectionFontSize={fontSize}
        editor={activeEditor}
      />
      <DropDownLineHeight
        disabled={disabled}
        editor={activeEditor}
        selectionLineHeight={lineHeight}
      />
      <DropDownLetterSpacing
        disabled={disabled}
        editor={activeEditor}
        selectionLetterSpacing={letterSpacing}
      />
      <Divider />

      {/* font style */}
      <DropdownColorPicker
        color={fontColor}
        disabled={disabled}
        icon={<IconFontColor />}
        onChange={onFontColorSelect}
      />
      <DropdownColorPicker
        color={bgColor}
        disabled={disabled}
        icon={<IconBackgound />}
        onChange={onBgColorSelect}
      />
      <ToolbarButton
        active={isBold}
        disabled={disabled}
        onClick={() => formatText("bold")}
      >
        <IconTypeBold />
      </ToolbarButton>
      <ToolbarButton
        active={isItalic}
        disabled={disabled}
        onClick={() => formatText("italic")}
      >
        <IconTypeItalic />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled}
        active={isUnderline}
        onClick={() => formatText("underline")}
      >
        <IconTypeUnderline />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled}
        active={isStrikethrough}
        onClick={() => formatText("strikethrough")}
      >
        <IconTypeStrikethrough />
      </ToolbarButton>
      <Divider />

      {/* script/subscript/superscript */}
      <ToolbarButton
        disabled={disabled}
        active={isSubscript}
        onClick={() => formatText("subscript")}
      >
        <IconTypeSubscript />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled}
        active={isSuperscript}
        onClick={() => formatText("superscript")}
      >
        <IconTypeSuperscript />
      </ToolbarButton>
      <ToolbarButton onClick={clearFormatting} disabled={disabled}>
        <IconTypeClear />
      </ToolbarButton>
      <DropdownEmoji editor={activeEditor} disabled={disabled} />

      <Divider />

      {/* alignment */}
      <ToolbarButton
        disabled={disabled}
        onClick={() =>
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
        }
      >
        <IconOutdent />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled}
        onClick={() =>
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
        }
      >
        <IconIndent />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled}
        active={elementFormat === "left"}
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")}
      >
        <IconTextLeft />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled}
        active={elementFormat === "center"}
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")}
      >
        <IconTextCenter />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled}
        active={elementFormat === "right"}
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")}
      >
        <IconTextRight />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled}
        active={elementFormat === "justify"}
        onClick={() =>
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")
        }
      >
        <IconJustify />
      </ToolbarButton>
      <Divider />

      <ToolbarButton
        disabled={disabled}
        active={blockType === "bullet"}
        onClick={() => {
          if (blockType !== "bullet") {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          } else {
            formatParagraph();
          }
        }}
      >
        <IconListUl />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled}
        active={blockType === "number"}
        onClick={() => {
          if (blockType !== "number") {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          } else {
            formatParagraph();
          }
        }}
      >
        <IconListOl />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled}
        active={blockType === "check"}
        onClick={() => {
          if (blockType !== "check") {
            editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
          } else {
            formatParagraph();
          }
        }}
      >
        <IconChecklist />
      </ToolbarButton>

      <ToolbarButton
        disabled={disabled}
        active={blockType === "quote"}
        onClick={() => {
          if (blockType !== "quote") {
            editor.update(() => {
              const selection = $getSelection();
              $setBlocksType(selection, () => $createQuoteNode());
            });
          } else {
            formatParagraph();
          }
        }}
      >
        <IconChatSquareQuote />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        disabled={disabled}
        onClick={() => {
          showModal("插入图片", (onClose) => (
            <InsertImageDialog activeEditor={activeEditor} onClose={onClose} />
          ));
        }}
      >
        <IconFileImage />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled}
        onClick={() => {
          showModal(`添加 YouTube 视频`, (onClose) => (
            <InsetYouTubeDialog activeEditor={activeEditor} onClose={onClose} />
          ));
        }}
      >
        <IconYoutube />
      </ToolbarButton>
      <ToolbarButton disabled={disabled} active={isLink} onClick={insertLink}>
        <IconLink />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled}
        onClick={() =>
          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
        }
      >
        <IconHorizontalRule />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled}
        onClick={() => {
          showModal("插入表格", (onClose) => (
            <InsertTableDialog activeEditor={activeEditor} onClose={onClose} />
          ));
        }}
      >
        <IconTable />
      </ToolbarButton>

      <Divider />
      <ToolbarButton
        disabled={isEditorEmpty || disabled}
        onClick={() => editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined)}
      >
        <IconCloseOutlined />
      </ToolbarButton>
      {modal}
    </div>
  );
};

export default ToolbarPlugin;

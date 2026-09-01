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
import {
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { LexicalEditor } from "lexical";

import DropDownFontFamily from "../../components/DropDownFontFamily";
import DropDownFontSize from "../../components/DropDownFontSize";
import DropDownHeading from "../../components/DropDownHeading";
import HtmlViewDialog from "../../components/HtmlViewDialog";
import { renderToolbarSlots } from "../../utils/renderToolbarSlots";
import type { ImportHtmlOptions } from "../../utils/htmlImport";
import {
  applyHtmlBlockFormatAndSync,
  applyHtmlBlockHeading,
  applyHtmlBlockLink,
  applyHtmlBlockList,
  applyHtmlBlockQuote,
  applyHtmlBlockStyleText,
  clearHtmlBlockFormatting,
  getHtmlBlockLinkTarget,
  getHtmlBlockLinkUrl,
  isHtmlBlockEditing,
  isHtmlBlockLinkSelected,
  isPreserveHtmlBlockMode,
  readHtmlBlockToolbarState,
  saveHtmlBlockSelection,
} from "../../utils/htmlBlockFormatting";
import {
  hasVisibleToolbarItems,
  isToolbarItemHidden,
  type ToolbarGroupKey,
  type ToolbarHiddenKey,
  type ToolbarItemKey,
  TOOLBAR_GROUP_ITEMS,
} from "../../utils/toolbarItems";
import { getSelectedNode } from "../../utils/getSelectedNode";
import DropdownColorPicker from "../../components/DropDownColorPicker";
import DropDownLineHeight from "../../components/DropDownLineHeight";
import {
  IconChevronDoubleLeft,
  IconChevronDoubleRight,
  IconBackgound,
  IconChatSquareQuote,
  IconChecklist,
  IconCloseOutlined,
  IconCode,
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
import { $createCodeNode } from "@lexical/code";
import { DialogActions } from "../../components/Dialog";
import TextInput from "../../components/TextInput";

function intersperse<T>(array: T[], separator: (index: number) => T): T[] {
  const result: T[] = [];
  array.forEach((item, i) => {
    if (i > 0) result.push(separator(i));
    result.push(item);
  });
  return result;
}

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

interface HtmlBlockLinkDialogProps {
  activeEditor: LexicalEditor;
  initialUrl: string;
  initialTarget: string;
  isEdit: boolean;
  onClose: () => void;
}

const HtmlBlockLinkDialog: React.FC<HtmlBlockLinkDialogProps> = ({
  activeEditor,
  initialUrl,
  initialTarget,
  isEdit,
  onClose,
}) => {
  let parsedUrl = initialUrl;
  let parsedType = "https://";
  for (const prefix of ["https://", "http://", "mailto:", "tel:"]) {
    if (initialUrl.startsWith(prefix)) {
      parsedUrl = initialUrl.slice(prefix.length);
      parsedType = prefix;
      break;
    }
  }

  const [url, setUrl] = useState(parsedUrl);
  const [type, setType] = useState(parsedType);
  const [target, setTarget] = useState(initialTarget);

  const handleSubmit = () => {
    const fullUrl = sanitizeUrl(type + url);
    applyHtmlBlockFormatAndSync(activeEditor, () =>
      applyHtmlBlockLink(fullUrl, target || undefined)
    );
    onClose();
  };

  const handleRemove = () => {
    applyHtmlBlockFormatAndSync(activeEditor, () =>
      applyHtmlBlockLink(null)
    );
    onClose();
  };

  return (
    <div style={{ width: 500 }}>
      <div className="lexicaltheme__link-editor-box">
        <TextInput
          label="链接地址"
          value={url}
          placeholder="请输入链接地址"
          onChange={setUrl}
          prefix={<div className="lexicaltheme__link-prefix">{type}</div>}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {[
            { value: "https://", label: "https" },
            { value: "http://", label: "http" },
            { value: "mailto:", label: "邮件" },
            { value: "tel:", label: "电话" },
          ].map((t) => (
            <div key={t.value} className="lexicaltheme__radio">
              <input
                type="radio"
                id={`htmlblock-link-type-${t.value}`}
                checked={type === t.value}
                onChange={() => setType(t.value)}
              />
              <label
                className="checkbox-label"
                htmlFor={`htmlblock-link-type-${t.value}`}
              >
                {t.label}
              </label>
            </div>
          ))}
        </div>
        <div className="lexicaltheme__checkboxInput">
          <input
            type="checkbox"
            id="htmlblock-link-new-window"
            checked={target === "_blank"}
            onChange={(e) => setTarget(e.target.checked ? "_blank" : "")}
          />
          <label className="checkbox-label" htmlFor="htmlblock-link-new-window">
            从新窗口打开
          </label>
        </div>
      </div>
      <DialogActions>
        {isEdit && (
          <button
            type="button"
            className="insertimage-dialog-button"
            style={{ marginRight: "auto" }}
            onClick={handleRemove}
          >
            移除链接
          </button>
        )}
        <button
          type="button"
          className="insertimage-dialog-button"
          onClick={handleSubmit}
        >
          确定
        </button>
      </DialogActions>
    </div>
  );
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

export type { ToolbarGroupKey, ToolbarHiddenKey, ToolbarItemKey };
export { TOOLBAR_GROUP_ITEMS } from "../../utils/toolbarItems";

export interface ToolbarSlotContext {
  editor: LexicalEditor;
  disabled?: boolean;
}

interface ToolbarPluginProps {
  disabled?: boolean;
  /** 需要默认收起的分组 key 数组，为空则不收起 */
  collapsedGroups?: ToolbarGroupKey[];
  /** 是否显示 HTML 源码查看按钮 */
  enableHtmlView?: boolean;
  /** HTML 源码是否可编辑并应用回编辑器 */
  htmlViewEditable?: boolean;
  /** 工具栏扩展插槽，支持传入多个自定义组件 */
  toolbarSlots?:
    | ReactNode
    | ReactNode[]
    | ((context: ToolbarSlotContext) => ReactNode | ReactNode[]);
  /** 插槽位置，默认 start */
  toolbarSlotPosition?: "start" | "end";
  /** 隐藏的内置工具栏按钮，支持单个按钮 key 或分组 key */
  hiddenToolbarItems?: ToolbarHiddenKey[];
  /** HTML 导入选项（HTML 源码弹窗应用时使用） */
  importHtmlOptions?: ImportHtmlOptions;
  /** 工具栏是否在滚动时固定在顶部 */
  sticky?: boolean;
}

const ToolbarPlugin: React.FC<ToolbarPluginProps> = (props) => {
  const {
    disabled,
    collapsedGroups = [],
    enableHtmlView = true,
    htmlViewEditable = true,
    toolbarSlots,
    toolbarSlotPosition = "start",
    hiddenToolbarItems = [],
    importHtmlOptions,
    sticky = false,
  } = props;
  const [isExpanded, setIsExpanded] = useState(false);
  const hasCollapsedGroups = collapsedGroups.length > 0;
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const toolbarRef = useRef(null);

  const [blockType, setBlockType] =
    useState<keyof typeof blockTypeToBlockName>("paragraph");
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const [fontSize, setFontSize] = useState<string>("16px");
  const [fontFamily, setFontFamily] = useState<string>("");
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

  const isGroupVisible = useCallback(
    (key: ToolbarGroupKey) =>
      !collapsedGroups.length || !collapsedGroups.includes(key) || isExpanded,
    [collapsedGroups, isExpanded]
  );

  const isItemVisible = useCallback(
    (item: ToolbarItemKey) => {
      if (item === "htmlView" && !enableHtmlView) {
        return false;
      }
      return !isToolbarItemHidden(item, hiddenToolbarItems);
    },
    [enableHtmlView, hiddenToolbarItems]
  );

  const isGroupRenderable = useCallback(
    (group: ToolbarGroupKey) =>
      isGroupVisible(group) &&
      hasVisibleToolbarItems(TOOLBAR_GROUP_ITEMS[group], hiddenToolbarItems) &&
      (group !== "htmlView" || enableHtmlView),
    [enableHtmlView, hiddenToolbarItems, isGroupVisible]
  );

  //- update toolbar state
  const $updateToolbar = useCallback(() => {
    if (importHtmlOptions?.preserveStructure) {
      const htmlState = readHtmlBlockToolbarState(activeEditor);
      if (htmlState) {
        if (htmlState.blockType in blockTypeToBlockName) {
          setBlockType(
            htmlState.blockType as keyof typeof blockTypeToBlockName
          );
        } else {
          setBlockType("paragraph");
        }
        setFontSize(htmlState.fontSize);
        setFontFamily(htmlState.fontFamily);
        setLineHeight(htmlState.lineHeight);
        setLetterSpacing(htmlState.letterSpacing);
        setFontColor(htmlState.fontColor);
        setBgColor(htmlState.bgColor);
        setIsBold(htmlState.isBold);
        setIsItalic(htmlState.isItalic);
        setIsUnderline(htmlState.isUnderline);
        setIsStrikethrough(htmlState.isStrikethrough);
        setIsSubscript(htmlState.isSubscript);
        setIsSuperscript(htmlState.isSuperscript);
        setElementFormat(htmlState.elementFormat);
        setIsLink(htmlState.isLink);
        return;
      }
    }

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
            : (element as ListNode).getListType();
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
      setFontFamily(
        $getSelectionStyleValueForProperty(selection, "font-family", "")
      );
    }
  }, [activeEditor, importHtmlOptions?.preserveStructure]);

  useEffect(() => {
    if (!importHtmlOptions?.preserveStructure) {
      return;
    }

    let rafId = 0;
    const onSelectionChange = () => {
      if (!isHtmlBlockEditing()) {
        return;
      }
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        $updateToolbar();
      });
    };

    document.addEventListener("selectionchange", onSelectionChange);
    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("selectionchange", onSelectionChange);
    };
  }, [importHtmlOptions?.preserveStructure, $updateToolbar]);

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
      if (importHtmlOptions?.preserveStructure && isPreserveHtmlBlockMode(activeEditor)) {
        applyHtmlBlockFormatAndSync(activeEditor, () =>
          applyHtmlBlockStyleText(styles)
        );
        $updateToolbar();
        return;
      }

      activeEditor.update(
        () => {
          const selection = $getSelection();
          if (selection !== null) $patchStyleText(selection, styles);
        },
        skipHistoryStack ? { tag: "historic" } : {}
      );
    },
    [activeEditor, importHtmlOptions?.preserveStructure, $updateToolbar]
  );

  //-
  const clearFormatting = useCallback(() => {
    if (importHtmlOptions?.preserveStructure && isPreserveHtmlBlockMode(activeEditor)) {
      applyHtmlBlockFormatAndSync(activeEditor, clearHtmlBlockFormatting);
      $updateToolbar();
      return;
    }

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
  }, [activeEditor, importHtmlOptions?.preserveStructure, $updateToolbar]);

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
    if (
      importHtmlOptions?.preserveStructure &&
      isPreserveHtmlBlockMode(activeEditor)
    ) {
      saveHtmlBlockSelection();
      const currentUrl = getHtmlBlockLinkUrl() ?? "";
      const currentTarget = getHtmlBlockLinkTarget();
      const editing = isHtmlBlockLinkSelected();

      showModal("超链接", (onClose) => (
        <HtmlBlockLinkDialog
          activeEditor={activeEditor}
          initialUrl={currentUrl}
          initialTarget={currentTarget}
          isEdit={editing}
          onClose={onClose}
        />
      ));
      return;
    }

    if (!isLink) {
      activeEditor.dispatchCommand(
        TOGGLE_LINK_COMMAND,
        sanitizeUrl("https://")
      );
    } else {
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [activeEditor, isLink, importHtmlOptions?.preserveStructure, showModal]);

  const formatParagraph = () => {
    if (importHtmlOptions?.preserveStructure && isPreserveHtmlBlockMode(activeEditor)) {
      applyHtmlBlockFormatAndSync(activeEditor, () =>
        applyHtmlBlockHeading("paragraph")
      );
      $updateToolbar();
      return;
    }

    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };


  const _renderToolbarGroup = () => {
    const children: React.ReactNode[] = [];

    if (isGroupRenderable("undo")) {
      children.push(
        <Fragment key="undo">
          {isItemVisible("undo") && (
            <ToolbarButton
              disabled={!canUndo || disabled}
              onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
            >
              <IconUndo />
            </ToolbarButton>
          )}
          {isItemVisible("redo") && (
            <ToolbarButton
              disabled={!canRedo || disabled}
              onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
            >
              <IconRedo />
            </ToolbarButton>
          )}
        </Fragment>
      );
    }

    if (isGroupRenderable("heading")) {
      children.push(
        <Fragment key="heading">
          <DropDownHeading
            disabled={disabled}
            blockType={blockType}
            editor={activeEditor}
          />
        </Fragment>
      );
    }

    if (isGroupRenderable("fontSize")) {
      children.push(
        <Fragment key="fontSize">
          {isItemVisible("fontFamily") && (
            <DropDownFontFamily
              disabled={disabled}
              selectionFontFamily={fontFamily}
              editor={activeEditor}
            />
          )}
          {isItemVisible("fontSize") && (
            <DropDownFontSize
              disabled={disabled}
              selectionFontSize={fontSize}
              editor={activeEditor}
            />
          )}
          {isItemVisible("lineHeight") && (
            <DropDownLineHeight
              disabled={disabled}
              editor={activeEditor}
              selectionLineHeight={lineHeight}
            />
          )}
          {isItemVisible("letterSpacing") && (
            <DropDownLetterSpacing
              disabled={disabled}
              editor={activeEditor}
              selectionLetterSpacing={letterSpacing}
            />
          )}
        </Fragment>
      );
    }

    if (isGroupRenderable("format")) {
      children.push(
        <Fragment key="format">
          {isItemVisible("fontColor") && (
            <DropdownColorPicker
              color={fontColor}
              disabled={disabled}
              icon={<IconFontColor />}
              onChange={onFontColorSelect}
            />
          )}
          {isItemVisible("bgColor") && (
            <DropdownColorPicker
              color={bgColor}
              disabled={disabled}
              icon={<IconBackgound />}
              onChange={onBgColorSelect}
              showTransparent
            />
          )}
          {isItemVisible("bold") && (
            <ToolbarButton
              active={isBold}
              disabled={disabled}
              onClick={() => formatText("bold")}
            >
              <IconTypeBold />
            </ToolbarButton>
          )}
          {isItemVisible("italic") && (
            <ToolbarButton
              active={isItalic}
              disabled={disabled}
              onClick={() => formatText("italic")}
            >
              <IconTypeItalic />
            </ToolbarButton>
          )}
          {isItemVisible("underline") && (
            <ToolbarButton
              disabled={disabled}
              active={isUnderline}
              onClick={() => formatText("underline")}
            >
              <IconTypeUnderline />
            </ToolbarButton>
          )}
          {isItemVisible("strikethrough") && (
            <ToolbarButton
              disabled={disabled}
              active={isStrikethrough}
              onClick={() => formatText("strikethrough")}
            >
              <IconTypeStrikethrough />
            </ToolbarButton>
          )}
        </Fragment>
      );
    }

    if (isGroupRenderable("script")) {
      children.push(
        <Fragment key="script">
          {isItemVisible("subscript") && (
            <ToolbarButton
              disabled={disabled}
              active={isSubscript}
              onClick={() => formatText("subscript")}
            >
              <IconTypeSubscript />
            </ToolbarButton>
          )}
          {isItemVisible("superscript") && (
            <ToolbarButton
              disabled={disabled}
              active={isSuperscript}
              onClick={() => formatText("superscript")}
            >
              <IconTypeSuperscript />
            </ToolbarButton>
          )}
          {isItemVisible("clearFormat") && (
            <ToolbarButton onClick={clearFormatting} disabled={disabled}>
              <IconTypeClear />
            </ToolbarButton>
          )}
          {isItemVisible("emoji") && (
            <DropdownEmoji editor={activeEditor} disabled={disabled} />
          )}
        </Fragment>
      );
    }

    if (isGroupRenderable("align")) {
      children.push(
        <Fragment key="align">
          {isItemVisible("outdent") && (
            <ToolbarButton
              disabled={disabled}
              onClick={() =>
                editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)
              }
            >
              <IconOutdent />
            </ToolbarButton>
          )}
          {isItemVisible("indent") && (
            <ToolbarButton
              disabled={disabled}
              onClick={() =>
                editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)
              }
            >
              <IconIndent />
            </ToolbarButton>
          )}
          {isItemVisible("alignLeft") && (
            <ToolbarButton
              disabled={disabled}
              active={elementFormat === "left"}
              onClick={() =>
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")
              }
            >
              <IconTextLeft />
            </ToolbarButton>
          )}
          {isItemVisible("alignCenter") && (
            <ToolbarButton
              disabled={disabled}
              active={elementFormat === "center"}
              onClick={() =>
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")
              }
            >
              <IconTextCenter />
            </ToolbarButton>
          )}
          {isItemVisible("alignRight") && (
            <ToolbarButton
              disabled={disabled}
              active={elementFormat === "right"}
              onClick={() =>
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")
              }
            >
              <IconTextRight />
            </ToolbarButton>
          )}
          {isItemVisible("alignJustify") && (
            <ToolbarButton
              disabled={disabled}
              active={elementFormat === "justify"}
              onClick={() =>
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")
              }
            >
              <IconJustify />
            </ToolbarButton>
          )}
        </Fragment>
      );
    }

    if (isGroupRenderable("list")) {
      children.push(
        <Fragment key="list">
          {isItemVisible("bulletList") && (
            <ToolbarButton
              disabled={disabled}
              active={blockType === "bullet"}
              onClick={() => {
                // 在 HTML 块模式下，execCommand 的列表命令本身是切换命令
                if (
                  importHtmlOptions?.preserveStructure &&
                  isPreserveHtmlBlockMode(activeEditor)
                ) {
                  applyHtmlBlockFormatAndSync(activeEditor, () =>
                    applyHtmlBlockList(false)
                  );
                  $updateToolbar();
                  return;
                }
                if (blockType !== "bullet") {
                  editor.dispatchCommand(
                    INSERT_UNORDERED_LIST_COMMAND,
                    undefined
                  );
                } else {
                  formatParagraph();
                }
              }}
            >
              <IconListUl />
            </ToolbarButton>
          )}
          {isItemVisible("numberList") && (
            <ToolbarButton
              disabled={disabled}
              active={blockType === "number"}
              onClick={() => {
                // 在 HTML 块模式下，execCommand 的列表命令本身是切换命令
                if (
                  importHtmlOptions?.preserveStructure &&
                  isPreserveHtmlBlockMode(activeEditor)
                ) {
                  applyHtmlBlockFormatAndSync(activeEditor, () =>
                    applyHtmlBlockList(true)
                  );
                  $updateToolbar();
                  return;
                }
                if (blockType !== "number") {
                  editor.dispatchCommand(
                    INSERT_ORDERED_LIST_COMMAND,
                    undefined
                  );
                } else {
                  formatParagraph();
                }
              }}
            >
              <IconListOl />
            </ToolbarButton>
          )}
          {isItemVisible("checkList") && (
            <ToolbarButton
              disabled={disabled}
              active={blockType === "check"}
              onClick={() => {
                if (
                  importHtmlOptions?.preserveStructure &&
                  isPreserveHtmlBlockMode(activeEditor)
                ) {
                  // HTML 块模式下使用无序列表模拟 checklist
                  applyHtmlBlockFormatAndSync(activeEditor, () =>
                    applyHtmlBlockList(false)
                  );
                  $updateToolbar();
                  return;
                }
                if (blockType !== "check") {
                  editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
                } else {
                  formatParagraph();
                }
              }}
            >
              <IconChecklist />
            </ToolbarButton>
          )}
          {isItemVisible("quote") && (
            <ToolbarButton
              disabled={disabled}
              active={blockType === "quote"}
              onClick={() => {
                if (
                  importHtmlOptions?.preserveStructure &&
                  isPreserveHtmlBlockMode(activeEditor)
                ) {
                  if (blockType !== "quote") {
                    applyHtmlBlockFormatAndSync(activeEditor, () =>
                      applyHtmlBlockQuote()
                    );
                  } else {
                    applyHtmlBlockFormatAndSync(activeEditor, () =>
                      applyHtmlBlockHeading("paragraph")
                    );
                  }
                  $updateToolbar();
                  return;
                }
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
          )}
        </Fragment>
      );
    }

    if (isGroupRenderable("htmlView")) {
      children.push(
        <Fragment key="htmlView">
          <ToolbarButton
            disabled={disabled}
            title="查看 HTML 源码"
            onClick={() => {
              showModal("HTML 源码", (onClose) => (
                <HtmlViewDialog
                  editor={activeEditor}
                  onClose={onClose}
                  editable={htmlViewEditable}
                  importHtmlOptions={importHtmlOptions}
                />
              ));
            }}
          >
            <IconCode />
          </ToolbarButton>
        </Fragment>
      );
    }

    if (isGroupRenderable("insert")) {
      children.push(
        <Fragment key="insert">
          {isItemVisible("image") && (
            <ToolbarButton
              disabled={disabled}
              onClick={() => {
                showModal("插入图片", (onClose) => (
                  <InsertImageDialog
                    activeEditor={activeEditor}
                    onClose={onClose}
                  />
                ));
              }}
            >
              <IconFileImage />
            </ToolbarButton>
          )}
          {isItemVisible("youtube") && (
            <ToolbarButton
              disabled={disabled}
              onClick={() => {
                showModal(`添加 YouTube 视频`, (onClose) => (
                  <InsetYouTubeDialog
                    activeEditor={activeEditor}
                    onClose={onClose}
                  />
                ));
              }}
            >
              <IconYoutube />
            </ToolbarButton>
          )}
          {isItemVisible("link") && (
            <ToolbarButton
              disabled={disabled}
              active={isLink}
              onClick={insertLink}
            >
              <IconLink />
            </ToolbarButton>
          )}
          {isItemVisible("horizontalRule") && (
            <ToolbarButton
              disabled={disabled}
              onClick={() =>
                editor.dispatchCommand(
                  INSERT_HORIZONTAL_RULE_COMMAND,
                  undefined
                )
              }
            >
              <IconHorizontalRule />
            </ToolbarButton>
          )}
          {isItemVisible("table") && (
            <ToolbarButton
              disabled={disabled}
              onClick={() => {
                showModal("插入表格", (onClose) => (
                  <InsertTableDialog
                    activeEditor={activeEditor}
                    onClose={onClose}
                  />
                ));
              }}
            >
              <IconTable />
            </ToolbarButton>
          )}
        </Fragment>
      );
    }

    if (isGroupRenderable("clear")) {
      children.push(
        <Fragment key="clear">
          <ToolbarButton
            disabled={isEditorEmpty || disabled}
            onClick={() =>
              editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined)
            }
          >
            <IconCloseOutlined />
          </ToolbarButton>
        </Fragment>
      );
    }

    if (hasCollapsedGroups) {
      children.push(
        <Fragment key="expand">
          {!isExpanded ? (
            <ToolbarButton
              disabled={disabled}
              onClick={() => setIsExpanded(true)}
              title="更多"
            >
              <IconChevronDoubleLeft />
            </ToolbarButton>
          ) : (
            <ToolbarButton
              disabled={disabled}
              onClick={() => setIsExpanded(false)}
              title="收起"
            >
              <IconChevronDoubleRight />
            </ToolbarButton>
          )}
        </Fragment>
      );
    }

    return children;
  };

  const slotContext: ToolbarSlotContext = {
    editor: activeEditor,
    disabled,
  };
  const startSlots = renderToolbarSlots(
    toolbarSlotPosition === "start" ? toolbarSlots : undefined,
    slotContext,
    "toolbar-slot-start"
  );
  const endSlots = renderToolbarSlots(
    toolbarSlotPosition === "end" ? toolbarSlots : undefined,
    slotContext,
    "toolbar-slot-end"
  );
  const toolbarGroups = _renderToolbarGroup();

  return (
    <div ref={toolbarRef} className={clsx("lexicaltheme__toolbar", sticky && "lexicaltheme__toolbar--sticky")}>
      {startSlots.length > 0 && (
        <>
          {startSlots}
          {toolbarGroups.length > 0 && <Divider key="divider-start-slots" />}
        </>
      )}
      {intersperse(
        toolbarGroups,
        (i) => <Divider key={`divider-${i}`} />
      )}
      {endSlots.length > 0 && (
        <>
          {toolbarGroups.length > 0 && <Divider key="divider-end-slots" />}
          {endSlots}
        </>
      )}
      {modal}
    </div>
  );
};

export default ToolbarPlugin;

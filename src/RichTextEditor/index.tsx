import React, { useEffect, useState } from "react";
// import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { CharacterLimitPlugin } from "@lexical/react/LexicalCharacterLimitPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { ClearEditorPlugin } from "@lexical/react/LexicalClearEditorPlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { HashtagPlugin } from "@lexical/react/LexicalHashtagPlugin";
import { CAN_USE_DOM } from "@lexical/utils";

import ToolbarPlugin from "./plugins/ToolbarPlugin";
import theme from "./themes/CommentEditorTheme";
import { useSharedHistoryContext } from "./context/SharedHistoryContext";
import { SettingsContext, useSettings } from "./context/SettingsContext";
import PlaygroundNodes from "./nodes/PlaygroundNodes";
import PageBreakPlugin from "./plugins/PageDividerPlugin";
import LexicalContentEditable from "./components/ContentEditable";
import EmojisPlugin from "./plugins/EmojisPlugin";
import NewMentionsPlugin from "./plugins/MentionsPlugin";
import ImagesPlugin from "./plugins/ImagesPlugin";
import FloatingLinkEditorPlugin from "./plugins/FloatingLinkEditorPlugin";
import TableCellResizerPlugin from "./plugins/TableCellResizerPlugin";
import TableActionMenuPlugin from "./plugins/TableActionMenuPlugin";
import LinkPlugin from "./plugins/LinkPlugin";
import FloatingTextFormatToolbarPlugin from "./plugins/FloatingTextFormatToolbarPlugin";
import YouTubePlugin from "./plugins/YouTubePlugin";
import SerializationPlugin from "./plugins/SerializationPlugin";
import HtmlBlockToolbarPlugin from "./plugins/HtmlBlockToolbarPlugin";
import {
  LexicalEditor,
  TextNode,
} from "lexical";
import MaxLengthPlugin from "./plugins/MaxLengthPlugin";
import { $setEditorHtml } from "./utils/htmlImport";
import { useDebounceEffect } from "ahooks";
import TableHoverActionsPlugin from "./plugins/TableHoverActionsPlugin";
import TableOfContentsPlugin from "./plugins/TableOfContentsPlugin";
import DraggableBlockPlugin from "./plugins/DraggableBlockPlugin";
import { ExtendedTextNode } from "./nodes/ExtendedTextNode";
import { TableContext } from "./plugins/TablePlugin";

import type { ReactNode } from "react";
import type {
  ToolbarGroupKey,
  ToolbarHiddenKey,
  ToolbarItemKey,
  ToolbarSlotContext,
} from "./plugins/ToolbarPlugin";
import { RichTextEditorContextProvider } from "./context/RichTextEditorContext";

export type {
  ToolbarGroupKey,
  ToolbarHiddenKey,
  ToolbarItemKey,
  ToolbarSlotContext,
};
export { TOOLBAR_GROUP_ITEMS } from "./utils/toolbarItems";
export {
  $getEditorHtml,
  $setEditorHtml,
  getEditorHtml,
  importHtmlToEditor,
} from "./utils/htmlImport";
export type { ImportHtmlOptions } from "./utils/htmlImport";
export { useRichTextEditor } from "./context/RichTextEditorContext";
export { ToolbarButton } from "./plugins/ToolbarPlugin";

export interface LnkstoneEditorProps {
  id?: string;
  disabled?: boolean;
  placeholder?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  max?: { len: number; preventInput?: boolean };
  status?: "error" | "success" | "warning" | "info" | "default";
  /** 默认收起的分组，为空则不收起 */
  collapsedGroups?: ToolbarGroupKey[];
  /** 是否显示 HTML 源码查看按钮，默认 true */
  enableHtmlView?: boolean;
  /** HTML 源码是否可编辑并应用回编辑器，默认 true */
  htmlViewEditable?: boolean;
  /** 工具栏扩展插槽，支持传入多个自定义组件或 render 函数 */
  toolbarSlots?:
    | ReactNode
    | ReactNode[]
    | ((context: ToolbarSlotContext) => ReactNode | ReactNode[]);
  /** 插槽位置，默认 start */
  toolbarSlotPosition?: "start" | "end";
  /** 隐藏的内置工具栏按钮，支持单个按钮 key 或分组 key */
  hiddenToolbarItems?: ToolbarHiddenKey[];
  /** 为 true 时完整保留 HTML 源码，不做任何 Lexical 转换 */
  preserveHtmlStructure?: boolean;
  /** 为 true 时工具栏在滚动时固定在顶部 */
  stickyToolbar?: boolean;
}

const LnkstoneEditor: React.FC<LnkstoneEditorProps> = (props) => {
  const {
    id,
    max,
    disabled,
    onChange,
    placeholder,
    defaultValue,
    status = "default",
    collapsedGroups = [],
    enableHtmlView = true,
    htmlViewEditable = true,
    toolbarSlots,
    toolbarSlotPosition = "start",
    hiddenToolbarItems,
    preserveHtmlStructure = false,
    stickyToolbar = false,
  } = props;

  const borderColor = new Map<string, string>([
    ["default", "#e2e2e2"],
    ["error", "#FF0000"],
    ["success", "#4caf50"],
    ["warning", "#ff9800"],
    ["info", "#2196f3"],
  ]);

  const [richTextValue, setRichTextValue] = useState<string>();
  const [count, setCount] = useState<number>(0);

  const { historyState } = useSharedHistoryContext();
  const {
    settings: {
      isCharLimit,
      tableCellMerge,
      isCharLimitUtf8,
      showTableOfContents,
      tableCellBackgroundColor,
    },
  } = useSettings();

  function prepopulatedRichText(params: {
    value: string;
    editor: LexicalEditor;
  }) {
    $setEditorHtml(params.editor, params.value, {
      preserveStructure: preserveHtmlStructure,
    });
  }

  const initialConfig = {
    editable: !disabled,
    editorState:
      defaultValue !== undefined
        ? (editor: LexicalEditor) =>
            prepopulatedRichText({ value: defaultValue!, editor })
        : undefined,
    namespace: "RichTextEditor" + id,
    nodes: [
      ...PlaygroundNodes,
      ExtendedTextNode,
      {
        replace: TextNode,
        with: (node: TextNode) => new ExtendedTextNode(node.__text),
        withKlass: ExtendedTextNode,
      },
    ],
    onError(error: Error) {
      throw error;
    },
    theme: theme,
  };

  const [floatingAnchorElem, setFloatingAnchorElem] =
    useState<HTMLDivElement | null>(null);

  const [isSmallWidthViewport, setIsSmallWidthViewport] =
    useState<boolean>(false);

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport =
        CAN_USE_DOM && window.matchMedia("(max-width: 860px)").matches;

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener("resize", updateViewPortWidth);

    return () => {
      window.removeEventListener("resize", updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);

  useDebounceEffect(
    () => {
      if (count === 0) {
        setCount(count + 1);
        return;
      }
      onChange && onChange(richTextValue ?? "");
    },
    [richTextValue],
    { wait: 20 }
  );

  return (
    <SettingsContext>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextEditorContextProvider disabled={disabled}>
        <TableContext>
          <div
            id={id}
            className="richtext-editor"
            style={{ borderColor: borderColor.get(status) }}
          >
            <ToolbarPlugin
              disabled={disabled}
              collapsedGroups={collapsedGroups}
              enableHtmlView={enableHtmlView}
              htmlViewEditable={htmlViewEditable}
              toolbarSlots={toolbarSlots}
              toolbarSlotPosition={toolbarSlotPosition}
              hiddenToolbarItems={hiddenToolbarItems}
              sticky={stickyToolbar}
              importHtmlOptions={{
                preserveStructure: preserveHtmlStructure,
              }}
            />
            {max && (
              <MaxLengthPlugin max={max.len} preventInput={max.preventInput} />
            )}
            {/* <AutoFocusPlugin /> */}
            <ClearEditorPlugin />

            <NewMentionsPlugin />
            <EmojisPlugin />
            <HashtagPlugin />
            {/* <EmojiPickerPlugin /> */}

            <RichTextPlugin
              contentEditable={
                <div className="editor-scroller">
                  <div ref={onRef} className="editor">
                    <LexicalContentEditable
                      placeholder={placeholder ?? "请输入"}
                    />
                  </div>
                </div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            {/* {isCollab ? (
              <CollaborationPlugin
                id="main"
                providerFactory={createWebsocketProvider}
                shouldBootstrap={!skipCollaborationInit}
              />
            ) : (
            )} */}
            <ImagesPlugin />
            <HistoryPlugin externalHistoryState={historyState} />

            <ListPlugin />
            <CheckListPlugin />
            <TablePlugin
              hasCellMerge={tableCellMerge}
              hasCellBackgroundColor={tableCellBackgroundColor}
            />
            <TableCellResizerPlugin />
            <ClickableLinkPlugin />
            <HorizontalRulePlugin />

            <PageBreakPlugin />
            <LinkPlugin />
            <YouTubePlugin />

            {floatingAnchorElem && !isSmallWidthViewport && (
              <>
                <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
                <FloatingLinkEditorPlugin anchorElem={floatingAnchorElem} />
                <FloatingTextFormatToolbarPlugin
                  anchorElem={floatingAnchorElem}
                />
                <TableActionMenuPlugin
                  anchorElem={floatingAnchorElem}
                  cellMerge={true}
                />
                <TableHoverActionsPlugin anchorElem={floatingAnchorElem} />
              </>
            )}
            <SerializationPlugin
              onChange={(value) => setRichTextValue(value)}
              preserveHtmlStructure={preserveHtmlStructure}
            />
            {preserveHtmlStructure && <HtmlBlockToolbarPlugin />}
            {(isCharLimit || isCharLimitUtf8) && (
              <CharacterLimitPlugin
                charset={isCharLimit ? "UTF-16" : "UTF-8"}
                maxLength={5}
              />
            )}

            {/* <TreeViewPlugin /> */}

            <div>{showTableOfContents && <TableOfContentsPlugin />}</div>
          </div>
        </TableContext>
        </RichTextEditorContextProvider>
      </LexicalComposer>
    </SettingsContext>
  );
};

export default LnkstoneEditor;

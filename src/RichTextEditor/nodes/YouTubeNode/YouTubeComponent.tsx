import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  BaseSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type ElementFormatType,
  type LexicalEditor,
  type NodeKey,
} from "lexical";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import clsx from "clsx";

import { RIGHT_CLICK_IMAGE_COMMAND } from "../ImageNode/ImageComponent";
import ImageResizer from "../../components/ImageResizer";

import { $isYouTubeNode } from ".";

type YouTubeComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  videoID: string;
}>;

const YouTubeComponent: React.FC<YouTubeComponentProps> = (props) => {
  const { className, format, nodeKey, videoID } = props;

  const iframeRef = useRef<null | HTMLIFrameElement>(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const isEditable = useLexicalEditable();
  const [editor] = useLexicalComposerContext();
  const [selection, setSelection] = useState<BaseSelection | null>(null);
  const activeEditorRef = useRef<LexicalEditor | null>(null);

  const isResized = useRef<boolean>(false);
  const isFocused = (isSelected || isResizing) && isEditable;

  const $onDelete = useCallback(
    (payload: KeyboardEvent) => {
      const deleteSelection = $getSelection();

      if (isSelected && $isNodeSelection(deleteSelection)) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        editor.update(() => {
          deleteSelection.getNodes().forEach((node) => {
            if ($isYouTubeNode(node)) node.remove();
          });
        });
      }
      return false;
    },
    [editor, isSelected]
  );

  const onClick = useCallback(
    (payload: MouseEvent) => {
      const event = payload;
      if (isResizing) return true;

      if (event.target === iframeRef.current) {
        if (event.shiftKey) {
          setSelected(!isSelected);
        } else {
          clearSelection();
          setSelected(true);
        }
        return true;
      }

      return false;
    },
    [isResizing, isSelected, setSelected, clearSelection]
  );

  useEffect(() => {
    let isMounted = true;
    const unregister = mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        if (isMounted) setSelection(editorState.read(() => $getSelection()));
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor;
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<MouseEvent>(
        RIGHT_CLICK_IMAGE_COMMAND,
        onClick,
        COMMAND_PRIORITY_LOW
      ),

      editor.registerCommand(
        KEY_DELETE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW
      )
    );

    return () => {
      isMounted = false;
      unregister();
    };
  }, [
    clearSelection,
    editor,
    isResizing,
    isSelected,
    nodeKey,
    $onDelete,
    onClick,
    setSelected,
  ]);
  const onResizeStart = () => {
    setIsResizing(true);
    isResized.current = true;
  };
  const onResizeEnd = (nextWidth: number) => {
    // Delay hiding the resize bars for click case
    setTimeout(() => {
      setIsResizing(false);
    }, 200);

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isYouTubeNode(node)) node.setWidth(nextWidth);
    });
  };
  return (
    <div
      className={clsx("relative", className.base, isFocused && className.focus)}
      style={{ width: isResized.current ? "min-content" : "100%" }}
    >
      <div ref={iframeRef}>
        <iframe
          title="YouTube video"
          allowFullScreen={true}
          src={`https://www.youtube-nocookie.com/embed/${videoID}`}
          style={{
            aspectRatio: "16/9",
            pointerEvents: "none",
            width: "100%",
            height: "auto",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
      {$isNodeSelection(selection) && isFocused && (
        <ImageResizer
          editor={editor}
          imageRef={iframeRef}
          resizeDirections={{ x: true, y: false }}
          onResizeStart={onResizeStart}
          onResizeEnd={(width) => {
            if (typeof width === "number") onResizeEnd(width);
          }}
        />
      )}
    </div>
  );
};

export default YouTubeComponent;

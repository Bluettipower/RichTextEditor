import type {
  BaseSelection,
  LexicalCommand,
  LexicalEditor,
  NodeKey,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLexicalEditable } from "@lexical/react/useLexicalEditable";
import { useLexicalNodeSelection } from "@lexical/react/useLexicalNodeSelection";
import { mergeRegister } from "@lexical/utils";
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $isRangeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGSTART_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import ImageResizer from "../../components/ImageResizer";

import { $isImageNode, SerializedImageNode } from ".";
import { IconImage, IconTrash } from "../../icons";
import Modal from "../../components/Modal";
import TextInput from "../../components/TextInput";
import CheckInput from "../../components/CheckInput";
import { DialogActions } from "../../components/Dialog";
import { set } from "lodash";

const imageCache = new Set();

// eslint-disable-next-line react-refresh/only-export-components
export const RIGHT_CLICK_IMAGE_COMMAND: LexicalCommand<MouseEvent> =
  createCommand("RIGHT_CLICK_IMAGE_COMMAND");
// eslint-disable-next-line react-refresh/only-export-components
export const DELETE_IMAGE_COMMAND: LexicalCommand<MouseEvent> = createCommand(
  "DELETE_IMAGE_COMMAND"
);

function useSuspenseImage(src: string) {
  if (!imageCache.has(src)) {
    throw new Promise((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imageCache.add(src);
        resolve(null);
      };
      img.onerror = () => {
        imageCache.add(src);
      };
    });
  }
}

interface LazyImageProps {
  altText: string;
  className: string | null;
  height: string | number;
  imageRef: { current: null | HTMLImageElement };
  maxWidth?: number;
  src: string;
  width: string | number;
  onError: () => void;
}

const LazyImage: React.FC<LazyImageProps> = (props) => {
  const {
    altText,
    className,
    imageRef,
    src,
    width,
    height,
    maxWidth,
    onError,
  } = props;

  useSuspenseImage(src);

  return (
    <img
      src={src}
      alt={altText}
      ref={imageRef}
      onError={onError}
      draggable="false"
      className={className || undefined}
      style={{ height, maxWidth, width }}
    />
  );
};

interface BrokenImageProps {
  focuesd: boolean;
  imageRef: { current: null | HTMLImageElement };
}

const BrokenImage: React.FC<BrokenImageProps> = ({ focuesd, imageRef }) => {
  return (
    <img
      ref={imageRef}
      draggable="false"
      style={{ height: 200, opacity: 0.2, width: 200 }}
      className={focuesd ? "outline-2 outline outline-blue-500" : ""}
      src="data:image/png;base64,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"
    />
  );
};

interface EditImageDialogProps {
  onClose: () => void;
  imageNode: SerializedImageNode;
  onSave: (value: {
    width: string | number;
    src: string;
    altText: string;
  }) => void;
}

const EditImageDialog: React.FC<EditImageDialogProps> = (props) => {
  const { imageNode, onSave, onClose } = props;

  const [width, setWidth] = useState<string>("");
  const [widthSuffix, setWidthSuffix] = useState<string>("px");
  const [src, setSrc] = useState<string>("");
  const [altText, setAltText] = useState<string>("");

  const coverImageSize = (value: string | number) => {
    if (typeof value === "number") return value.toString();
    if (value.trim() === "") return "";
    else return value.replace("px", "").replace("%", "");
  };

  useEffect(() => {
    setWidth(coverImageSize(imageNode.width ?? ""));
    setWidthSuffix(imageNode.width?.toString().includes("%") ? "%" : "px");
    setSrc(imageNode.src);
    setAltText(imageNode.altText);
  }, [imageNode]);

  return (
    <Modal title={"编辑图片"} closeOnClickOutside={false} onClose={onClose}>
      <div className="flex flex-col gap-2 p-4 max-w-[500px]">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <TextInput
            label="宽度"
            type="number"
            value={width}
            suffix={widthSuffix}
            onChange={(v) => setWidth(v)}
            disabled={widthSuffix === "%"}
          />
          <CheckInput
            label="铺满屏幕"
            value={widthSuffix === "%"}
            onChange={(val) => {
              if (val) {
                setWidthSuffix("%");
                setWidth("100");
              } else {
                setWidthSuffix("px");
              }
            }}
          />
        </div>
        <TextInput
          type="url"
          value={src}
          label="图片地址"
          placeholder="https://"
          onChange={(v) => setSrc(v)}
        />
        <TextInput
          label="图片描述"
          value={altText}
          placeholder="alt text"
          onChange={(v) => setAltText(v)}
        />
      </div>
      <DialogActions>
        <button
          type="button"
          className="insertimage-dialog-button"
          disabled={width.trim() === "" || src.trim() === ""}
          onClick={() => {
            onSave({
              altText,
              src,
              width: widthSuffix === "%" ? "100%" : Number(width),
            });
          }}
        >
          确定
        </button>
      </DialogActions>
    </Modal>
  );
};

interface ImageComponentProps {
  altText: string;
  height: string | number;
  maxWidth?: number;
  nodeKey: NodeKey;
  resizable: boolean;
  src: string;
  width: string | number;
}

const ImageComponent: React.FC<ImageComponentProps> = (props) => {
  const { src, altText, nodeKey, width, height, maxWidth, resizable } = props;

  const imageRef = useRef<null | HTMLImageElement>(null);
  const [isSelected, setSelected, clearSelection] =
    useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const [selection, setSelection] = useState<BaseSelection | null>(null);
  const activeEditorRef = useRef<LexicalEditor | null>(null);
  const [isLoadError, setIsLoadError] = useState<boolean>(false);
  const isEditable = useLexicalEditable();

  const [imageNode, setImageNode] = useState<SerializedImageNode>();

  const $onDelete = useCallback(
    (payload: KeyboardEvent) => {
      const deleteSelection = $getSelection();

      if (isSelected && $isNodeSelection(deleteSelection)) {
        const event: KeyboardEvent = payload;
        event.preventDefault();
        editor.update(() => {
          deleteSelection.getNodes().forEach((node) => {
            if ($isImageNode(node)) node.remove();
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
      if (isResizing) {
        return true;
      }
      if (event.target === imageRef.current) {
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

  const onRightClick = useCallback(
    (event: MouseEvent): void => {
      // event.preventDefault();
      editor.getEditorState().read(() => {
        const latestSelection = $getSelection();
        const domElement = event.target as HTMLElement;
        if (
          domElement.tagName === "IMG" &&
          $isRangeSelection(latestSelection) &&
          latestSelection.getNodes().length === 1
        ) {
          editor.dispatchCommand(
            RIGHT_CLICK_IMAGE_COMMAND,
            event as MouseEvent
          );
        }
      });
    },
    [editor]
  );

  useEffect(() => {
    let isMounted = true;
    const rootElement = editor.getRootElement();
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
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageRef.current) {
            event.preventDefault();
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        DELETE_IMAGE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        $onDelete,
        COMMAND_PRIORITY_LOW
      )
    );

    rootElement?.addEventListener("contextmenu", onRightClick);

    return () => {
      isMounted = false;
      unregister();
      rootElement?.removeEventListener("contextmenu", onRightClick);
    };
  }, [
    clearSelection,
    editor,
    isResizing,
    isSelected,
    nodeKey,
    $onDelete,
    onClick,
    onRightClick,
    setSelected,
  ]);

  const onResizeEnd = (
    nextWidth: string | number,
    nextHeight: string | number
  ) => {
    // Delay hiding the resize bars for click case
    setTimeout(() => {
      setIsResizing(false);
    }, 200);

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) node.setWidthAndHeight(nextWidth, nextHeight);
    });
  };

  const onResizeStart = () => {
    setIsResizing(true);
  };

  const draggable = isSelected && $isNodeSelection(selection) && !isResizing;
  const isFocused = (isSelected || isResizing) && isEditable;

  return (
    <Suspense fallback={null}>
      <>
        <div draggable={draggable} className="relative">
          {isLoadError ? (
            <BrokenImage focuesd={isFocused} imageRef={imageRef} />
          ) : (
            <LazyImage
              className={
                isFocused
                  ? `focused ${$isNodeSelection(selection) ? "draggable" : ""}`
                  : null
              }
              src={src}
              width={width}
              height={height}
              altText={altText}
              imageRef={imageRef}
              maxWidth={maxWidth}
              onError={() => setIsLoadError(true)}
            />
          )}
        </div>
        {$isNodeSelection(selection) && isFocused && (
          <>
            <div
              className="lexicaltheme__image__edit"
              onClick={(ev) => {
                ev.stopPropagation();
                editor.read(() => {
                  const node = $getNodeByKey(nodeKey);
                  if (!node || !$isImageNode(node)) return;
                  const [width, height, maxWidth] = node.getSize();
                  const src = node.getSrc();
                  const altText = node.getAltText();
                  setImageNode({
                    width,
                    height,
                    src,
                    altText,
                    maxWidth,
                    version: 1,
                    type: "image",
                  });
                });
              }}
            >
              <IconImage />
            </div>
            <div
              className="lexicaltheme__image__delete"
              onClick={(ev) => {
                ev.stopPropagation();
                editor.dispatchCommand(
                  DELETE_IMAGE_COMMAND,
                  ev as unknown as MouseEvent
                );
              }}
            >
              <IconTrash />
            </div>
          </>
        )}
        {resizable && $isNodeSelection(selection) && isFocused && (
          <ImageResizer
            editor={editor}
            imageRef={imageRef}
            maxWidth={maxWidth}
            onResizeEnd={onResizeEnd}
            onResizeStart={onResizeStart}
          />
        )}
        {imageNode && (
          <EditImageDialog
            imageNode={imageNode}
            onSave={({ width, src, altText }) => {
              editor.update(() => {
                const node = $getNodeByKey(nodeKey);
                if ($isImageNode(node)) {
                  node.setWidthAndHeight(width, "auto");
                  node.setSrcAndAltText(src, altText);
                }
                setImageNode(undefined);
              });
            }}
            onClose={() => setImageNode(undefined)}
          />
        )}
      </>
    </Suspense>
  );
};

export default ImageComponent;

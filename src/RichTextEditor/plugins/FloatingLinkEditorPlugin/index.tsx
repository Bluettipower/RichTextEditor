import {
  $createLinkNode,
  $isAutoLinkNode,
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $findMatchingParent, mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isLineBreakNode,
  $isRangeSelection,
  BaseSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_ESCAPE_COMMAND,
  LexicalEditor,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { Dispatch, useCallback, useEffect, useRef, useState } from "react";
import * as React from "react";
import { createPortal } from "react-dom";

import { getSelectedNode } from "../../utils/getSelectedNode";
import { setFloatingElemPositionForLinkEditor } from "../../utils/setFloatingElemPositionForLinkEditor";
import { sanitizeUrl } from "../../utils/url";
import { IconEdit } from "../../icons";
import { DialogActions } from "../../components/Dialog";
import TextInput from "../../components/TextInput";
import Modal from "../../components/Modal";

interface FloatingLinkEditorProps {
  editor: LexicalEditor;
  isLink: boolean;
  setIsLink: Dispatch<boolean>;
  anchorElem: HTMLElement;
  onClose?: () => void;
}

interface LinkProps {
  url: string;
  target: string;
  type: string;
}

const FloatingLinkEditorModal: React.FC<{
  open: boolean;
  value: LinkProps;
  onClose: () => void;
  onSubmit: (linkValue: LinkProps) => void;
}> = (props) => {
  const { value, open, onClose, onSubmit } = props;
  const [linkValues, setLinkValues] = useState<LinkProps>({
    url: "",
    target: "",
    type: "https://",
  });

  useEffect(() => {
    if (open) setLinkValues(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <>
      {open ? (
        <Modal title="超链接" onClose={() => onClose()} closeOnClickOutside>
          <div style={{ width: 500 }}>
            <div className="lexicaltheme__link-editor-box">
              <TextInput
                label="链接地址"
                value={linkValues.url}
                placeholder="请输入链接地址"
                onChange={(val) => setLinkValues({ ...linkValues, url: val })}
                prefix={
                  <div className="lexicaltheme__link-prefix">
                    {linkValues.type}
                  </div>
                }
              />
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                {[
                  { value: "https://", label: "https" },
                  { value: "http://", label: "http" },
                  { value: "mailto:", label: "邮件" },
                  { value: "tel:", label: "电话" },
                ].map((typeValue) => (
                  <div key={typeValue.value} className="lexicaltheme__radio">
                    <input
                      type="radio"
                      id={`link-type-${typeValue.value}`}
                      checked={linkValues.type === typeValue.value}
                      onChange={() => {
                        setLinkValues({ ...linkValues, type: typeValue.value });
                      }}
                    />
                    <label
                      className="checkbox-label"
                      htmlFor={`link-type-${typeValue.value}`}
                    >
                      {typeValue.label}
                    </label>
                  </div>
                ))}
              </div>
              <div className="lexicaltheme__checkboxInput">
                <input
                  type="checkbox"
                  id="link-new-window"
                  checked={linkValues.target === "_blank"}
                  onChange={(event) => {
                    setLinkValues({
                      ...linkValues,
                      target: event.target.checked ? "_blank" : "",
                    });
                  }}
                />
                <label className="checkbox-label" htmlFor="link-new-window">
                  从新窗口打开
                </label>
              </div>
            </div>
            <DialogActions>
              <button
                role="button"
                className="insertimage-dialog-button"
                onClick={() => onSubmit(linkValues)}
              >
                确定
              </button>
            </DialogActions>
          </div>
        </Modal>
      ) : null}
    </>
  );
};

const FloatingLinkEditor: React.FC<FloatingLinkEditorProps> = (props) => {
  const { editor, isLink, setIsLink, anchorElem } = props;

  const editorRef = useRef<HTMLDivElement | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkType, setLinkType] = useState("https://");
  const [target, setTarget] = useState("");
  const [editedLinkUrl, setEditedLinkUrl] = useState("");
  const [lastSelection, setLastSelection] = useState<BaseSelection | null>(
    null
  );
  const [openModal, setOpenModal] = useState(false);

  const $updateLinkEditor = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection);
      const linkParent = $findMatchingParent(node, $isLinkNode);

      if (linkParent) {
        setLinkUrl(linkParent.getURL());
        setTarget(linkParent.getTarget() ?? "");
      } else if ($isLinkNode(node)) {
        setLinkUrl(node.getURL());
        setTarget(node.getTarget() ?? "");
      } else {
        setLinkUrl("");
        setTarget("");
      }
      let url = linkUrl;
      let type = "https://";
      if (linkUrl.startsWith("https://")) {
        url = linkUrl.replace("https://", "");
        type = "https://";
      } else if (linkUrl.startsWith("http://")) {
        url = linkUrl.replace("http://", "");
        type = "http://";
      } else if (linkUrl.startsWith("mailto:")) {
        url = linkUrl.replace("mailto:", "");
        type = "mailto:";
      } else if (linkUrl.startsWith("tel:")) {
        url = linkUrl.replace("tel:", "");
        type = "tel:";
      }
      setEditedLinkUrl(url);
      setLinkType(type);
    }
    const editorElem = editorRef.current;
    const nativeSelection = window.getSelection();
    const activeElement = document.activeElement;

    if (editorElem === null) return;

    const rootElement = editor.getRootElement();

    if (
      selection !== null &&
      nativeSelection !== null &&
      rootElement !== null &&
      rootElement.contains(nativeSelection.anchorNode) &&
      editor.isEditable()
    ) {
      const domRect: DOMRect | undefined =
        nativeSelection.focusNode?.parentElement?.getBoundingClientRect();
      // console.log(nativeSelection.focusNode?.parentElement);
      if (domRect) {
        domRect.y += 40;
        setFloatingElemPositionForLinkEditor(domRect, editorElem, anchorElem);
      }
      setLastSelection(selection);
    } else if (!activeElement || activeElement.className !== "link-input") {
      if (rootElement !== null) {
        setFloatingElemPositionForLinkEditor(null, editorElem, anchorElem);
      }
      setLastSelection(null);
      setLinkUrl("");
    }

    return true;
  }, [anchorElem, editor, linkUrl]);

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement;

    const update = () => {
      editor.getEditorState().read(() => {
        $updateLinkEditor();
      });
    };

    window.addEventListener("resize", update);

    if (scrollerElem) scrollerElem.addEventListener("scroll", update);

    return () => {
      window.removeEventListener("resize", update);

      if (scrollerElem) scrollerElem.removeEventListener("scroll", update);
    };
  }, [anchorElem.parentElement, editor, $updateLinkEditor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateLinkEditor();
        });
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateLinkEditor();
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (!isLink) return false;

          setIsLink(false);
          return true;
        },
        COMMAND_PRIORITY_HIGH
      )
    );
  }, [editor, $updateLinkEditor, setIsLink, isLink]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      $updateLinkEditor();
    });
  }, [editor, $updateLinkEditor]);

  const handleLinkSubmission = (value: LinkProps) => {
    if (lastSelection !== null) {
      if (linkUrl !== "") {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, {
          url: sanitizeUrl(value.type + value.url),
          target: value.target,
        });
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const parent = getSelectedNode(selection).getParent();
            if ($isAutoLinkNode(parent)) {
              const linkNode = $createLinkNode(parent.getURL(), {
                rel: parent.__rel,
                target: parent.__target,
                title: parent.__title,
              });
              parent.replace(linkNode, true);
            }
          }
        });
        setTimeout(() => setOpenModal(false), 200);
      }
    }
  };

  return (
    <div
      ref={editorRef}
      onClick={() => setOpenModal(true)}
      className="lexicaltheme__link-editor2"
      style={{ backgroundColor: isLink ? "white" : "transparent" }}
    >
      {openModal ? (
        <FloatingLinkEditorModal
          open={openModal}
          onClose={() => {
            setTimeout(() => {
              setOpenModal(false);
            }, 200);
          }}
          onSubmit={handleLinkSubmission}
          value={{ target, url: editedLinkUrl, type: linkType }}
        />
      ) : null}
      {!isLink ? null : <IconEdit className="edit-icon" />}
    </div>
  );
};

const FloatingLinkEditorPlugin: React.FC<{ anchorElem?: HTMLElement }> = (
  props
) => {
  const { anchorElem = document.body } = props;
  const [editor] = useLexicalComposerContext();

  const [activeEditor, setActiveEditor] = useState(editor);
  const [isLink, setIsLink] = useState(false);

  useEffect(() => {
    function $updateToolbar() {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const focusNode = getSelectedNode(selection);
        const focusLinkNode = $findMatchingParent(focusNode, $isLinkNode);
        const focusAutoLinkNode = $findMatchingParent(
          focusNode,
          $isAutoLinkNode
        );
        if (!(focusLinkNode || focusAutoLinkNode)) {
          setIsLink(false);
          return;
        }
        const badNode = selection
          .getNodes()
          .filter((node) => !$isLineBreakNode(node))
          .find((node) => {
            const linkNode = $findMatchingParent(node, $isLinkNode);
            const autoLinkNode = $findMatchingParent(node, $isAutoLinkNode);
            return (
              (focusLinkNode && !focusLinkNode.is(linkNode)) ||
              (linkNode && !linkNode.is(focusLinkNode)) ||
              (focusAutoLinkNode && !focusAutoLinkNode.is(autoLinkNode)) ||
              (autoLinkNode &&
                (!autoLinkNode.is(focusAutoLinkNode) ||
                  autoLinkNode.getIsUnlinked()))
            );
          });
        if (!badNode) setIsLink(true);
        else setIsLink(false);
      }
    }
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          $updateToolbar();
          setActiveEditor(newEditor);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        CLICK_COMMAND,
        (payload) => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const node = getSelectedNode(selection);
            const linkNode = $findMatchingParent(node, $isLinkNode);
            if ($isLinkNode(linkNode) && (payload.metaKey || payload.ctrlKey)) {
              window.open(linkNode.getURL(), "_blank");
              return true;
            }
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor]);

  return (
    <>
      {createPortal(
        <FloatingLinkEditor
          editor={activeEditor}
          isLink={isLink}
          anchorElem={anchorElem}
          setIsLink={setIsLink}
        />,
        anchorElem
      )}
    </>
  );
};

export default FloatingLinkEditorPlugin;

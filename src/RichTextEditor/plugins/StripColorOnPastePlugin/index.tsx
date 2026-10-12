import { $insertDataTransferForRichText } from "@lexical/clipboard";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE, eventFiles } from "@lexical/rich-text";
import { objectKlassEquals } from "@lexical/utils";
import {
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
  PasteCommandType,
  $getSelection,
  isDOMNode,
  isSelectionCapturedInDecoratorInput,
  LexicalEditor,
} from "lexical";
import { useEffect } from "react";

import {
  createExternalPasteDataTransfer,
  shouldPreservePasteColors,
} from "../../utils/pasteClipboardStrip";

function getClipboardDataFromPasteEvent(
  event: PasteCommandType
): DataTransfer | null {
  if (
    objectKlassEquals(event, InputEvent) ||
    objectKlassEquals(event, KeyboardEvent)
  ) {
    return null;
  }
  if (objectKlassEquals(event, ClipboardEvent)) {
    return (event as ClipboardEvent).clipboardData;
  }
  return null;
}

function insertPasteDataTransfer(
  editor: LexicalEditor,
  dataTransfer: DataTransfer
): void {
  editor.update(
    () => {
      const selection = $getSelection();
      if (selection !== null) {
        $insertDataTransferForRichText(dataTransfer, selection, editor);
      }
    },
    { tag: "paste" }
  );
}

export interface StripColorOnPastePluginProps {
  enabled?: boolean;
}

export default function StripColorOnPastePlugin({
  enabled = true,
}: StripColorOnPastePluginProps): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return editor.registerCommand<PasteCommandType>(
      PASTE_COMMAND,
      (event) => {
        const [, files, hasTextContent] = eventFiles(event);
        if (files.length > 0 && !hasTextContent) {
          editor.dispatchCommand(DRAG_DROP_PASTE, files);
          return true;
        }

        if (
          isDOMNode(event.target) &&
          isSelectionCapturedInDecoratorInput(event.target)
        ) {
          return false;
        }

        const selection = $getSelection();
        if (selection === null) {
          return false;
        }

        const clipboardData = getClipboardDataFromPasteEvent(event);
        if (clipboardData === null) {
          return false;
        }

        event.preventDefault();

        const namespace = editor._config.namespace;
        const dataTransfer = shouldPreservePasteColors(
          clipboardData,
          namespace
        )
          ? clipboardData
          : createExternalPasteDataTransfer(clipboardData);

        insertPasteDataTransfer(editor, dataTransfer);
        return true;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor, enabled]);

  return null;
}

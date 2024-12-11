import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import {
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  LexicalEditor,
} from "lexical";
import { useEffect, useRef, useState } from "react";

import { $createYouTubeNode, YouTubeNode } from "../../nodes/YouTubeNode";
import TextInput from "../../components/TextInput";
import { DialogActions } from "../../components/Dialog";

export const INSERT_YOUTUBE_COMMAND: LexicalCommand<string> = createCommand(
  "INSERT_YOUTUBE_COMMAND"
);

export const InsetYouTubeDialog: React.FC<{
  activeEditor: LexicalEditor;
  onClose: () => void;
}> = ({ activeEditor, onClose }) => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const hasModifier = useRef(false);

  useEffect(() => {
    hasModifier.current = false;
    const handler = (e: KeyboardEvent) => {
      hasModifier.current = e.altKey;
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
    };
  }, [activeEditor]);

  const onClick = () => {
    const match =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/.exec(url);

    const id = match ? (match?.[2].length === 11 ? match[2] : null) : null;
    if (id) {
      activeEditor.dispatchCommand(INSERT_YOUTUBE_COMMAND, id);
      onClose();
    } else {
      setError("请输入正确的YouTube链接");
    }
  };

  return (
    <div>
      <div className="lexicaltheme__dialogbody">
        <TextInput
          value={url}
          onChange={setUrl}
          placeholder="https://www.youtube.com/watch?v="
          className={error ? "lexicaltheme__fileinput__error" : ""}
        />
        {error ? (
          <div className="lexicaltheme__fileinput__errortext">{error}</div>
        ) : null}
      </div>
      <DialogActions>
        <button
          type="button"
          onClick={() => onClick()}
          disabled={url.trim() === ""}
          className="lexicaltheme__dialogfotter__action"
        >
          确定
        </button>
      </DialogActions>
    </div>
  );
};

export default function YouTubePlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([YouTubeNode])) {
      throw new Error("YouTubePlugin: YouTubeNode not registered on editor");
    }

    return editor.registerCommand<string>(
      INSERT_YOUTUBE_COMMAND,
      (payload) => {
        const youTubeNode = $createYouTubeNode(payload);
        $insertNodeToNearestRoot(youTubeNode);

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}

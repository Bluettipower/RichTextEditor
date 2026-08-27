import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import {
  COMMAND_PRIORITY_HIGH,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
} from "lexical";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { useEffect } from "react";

import {
  applyHtmlBlockElementFormat,
  applyHtmlBlockFormatAndSync,
  applyHtmlBlockIndent,
  applyHtmlBlockTextFormat,
  insertHtmlBlockHorizontalRule,
  insertHtmlBlockImage,
  insertHtmlBlockTable,
  insertHtmlBlockYouTube,
  isPreserveHtmlBlockMode,
} from "../../utils/htmlBlockFormatting";
import { INSERT_IMAGE_COMMAND } from "../ImagesPlugin";
import { INSERT_YOUTUBE_COMMAND } from "../YouTubePlugin";

const HtmlBlockToolbarPlugin: React.FC = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      (format) => {
        return applyHtmlBlockFormatAndSync(editor, () =>
          applyHtmlBlockTextFormat(format)
        );
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      FORMAT_ELEMENT_COMMAND,
      (format) => {
        return applyHtmlBlockFormatAndSync(editor, () =>
          applyHtmlBlockElementFormat(format)
        );
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      INDENT_CONTENT_COMMAND,
      () => {
        return applyHtmlBlockFormatAndSync(editor, () =>
          applyHtmlBlockIndent(false)
        );
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      OUTDENT_CONTENT_COMMAND,
      () => {
        return applyHtmlBlockFormatAndSync(editor, () =>
          applyHtmlBlockIndent(true)
        );
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        if (!isPreserveHtmlBlockMode(editor)) {
          return false;
        }
        return applyHtmlBlockFormatAndSync(editor, () =>
          insertHtmlBlockImage(
            payload.src,
            payload.altText ?? "",
            typeof payload.width === "number"
              ? `${payload.width}px`
              : payload.width?.toString(),
            typeof payload.height === "number"
              ? `${payload.height}px`
              : payload.height?.toString()
          )
        );
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      INSERT_YOUTUBE_COMMAND,
      (videoId) => {
        if (!isPreserveHtmlBlockMode(editor)) {
          return false;
        }
        return applyHtmlBlockFormatAndSync(editor, () =>
          insertHtmlBlockYouTube(videoId)
        );
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      INSERT_HORIZONTAL_RULE_COMMAND,
      () => {
        if (!isPreserveHtmlBlockMode(editor)) {
          return false;
        }
        return applyHtmlBlockFormatAndSync(editor, () =>
          insertHtmlBlockHorizontalRule()
        );
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      INSERT_TABLE_COMMAND,
      (payload) => {
        if (!isPreserveHtmlBlockMode(editor)) {
          return false;
        }
        return applyHtmlBlockFormatAndSync(editor, () =>
          insertHtmlBlockTable(
            Number(payload.rows),
            Number(payload.columns),
            payload.includeHeaders as
              | { rows?: boolean; columns?: boolean }
              | undefined
          )
        );
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
};

export default HtmlBlockToolbarPlugin;

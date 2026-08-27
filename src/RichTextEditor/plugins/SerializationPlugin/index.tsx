import { $generateHtmlFromNodes } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $getRoot, $isParagraphNode } from "lexical";

import { $getRawHtmlFromEditor } from "../../utils/htmlImport";

const SerializationPlugin: React.FC<{
  onChange: (value: string) => void;
  preserveHtmlStructure?: boolean;
}> = ({ onChange, preserveHtmlStructure = false }) => {
  const [editor] = useLexicalComposerContext();
  return (
    <OnChangePlugin
      onChange={(v) => {
        v.read(() => {
          if (preserveHtmlStructure) {
            const rawHtml = $getRawHtmlFromEditor(editor);
            if (rawHtml !== null) {
              onChange(rawHtml);
              return;
            }
          }

          const root = $getRoot();
          const children = root.getChildren();

          if (children.length <= 1) {
            if ($isParagraphNode(children[0])) {
              const paragraphChildren = children[0].getChildren();
              if (paragraphChildren.length === 0) {
                onChange("");
                return;
              }
            }
          }
          const htmlString = $generateHtmlFromNodes(editor);
          onChange(htmlString);
        });
      }}
    />
  );
};

export default SerializationPlugin;

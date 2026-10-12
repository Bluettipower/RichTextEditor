import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalEditor } from "lexical";
import React, { createContext, useContext } from "react";

export interface RichTextEditorContextValue {
  editor: LexicalEditor;
  disabled?: boolean;
  stripColorsOnExternalPaste?: boolean;
}

const RichTextEditorContext =
  createContext<RichTextEditorContextValue | null>(null);

export const RichTextEditorContextProvider: React.FC<{
  disabled?: boolean;
  stripColorsOnExternalPaste?: boolean;
  children: React.ReactNode;
}> = ({ disabled, stripColorsOnExternalPaste = true, children }) => {
  const [editor] = useLexicalComposerContext();

  return (
    <RichTextEditorContext.Provider
      value={{ editor, disabled, stripColorsOnExternalPaste }}
    >
      {children}
    </RichTextEditorContext.Provider>
  );
};

export function useRichTextEditor(): RichTextEditorContextValue {
  const context = useContext(RichTextEditorContext);
  if (context === null) {
    throw new Error("useRichTextEditor must be used within RichTextEditor");
  }
  return context;
}

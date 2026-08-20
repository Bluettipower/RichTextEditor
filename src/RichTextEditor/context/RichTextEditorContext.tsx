import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalEditor } from "lexical";
import React, { createContext, useContext } from "react";

export interface RichTextEditorContextValue {
  editor: LexicalEditor;
  disabled?: boolean;
}

const RichTextEditorContext =
  createContext<RichTextEditorContextValue | null>(null);

export const RichTextEditorContextProvider: React.FC<{
  disabled?: boolean;
  children: React.ReactNode;
}> = ({ disabled, children }) => {
  const [editor] = useLexicalComposerContext();

  return (
    <RichTextEditorContext.Provider value={{ editor, disabled }}>
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

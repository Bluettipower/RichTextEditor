import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TreeView } from '@lexical/react/LexicalTreeView';

export default function TreeViewPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  return (
    <TreeView
      editor={editor}
      timeTravelPanelSliderClassName="w-full"
      timeTravelPanelClassName="p-2.5 order-first w-[90%] m-auto flex gap-2"
      treeTypeButtonClassName="text-[14px] p-2 border-none outline-none cursor-pointer bg-transparent text-white hover:underline"
      timeTravelButtonClassName="text-[14px] p-2 border-none outline-none cursor-pointer bg-transparent text-white hover:underline"
      timeTravelPanelButtonClassName="flex-1 border-none outline-none cursor-pointer bg-transparent text-white text-[14px] whitespace-nowrap"
      viewClassName="block bg-[#222] flex flex-col items-start text-white font-[12px] mt-px pb-2.5 px-auto relative overflow-hidden rounded-b-lg"
    />
  );
}

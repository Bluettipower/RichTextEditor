import { DraggableBlockPlugin_EXPERIMENTAL } from "@lexical/react/LexicalDraggableBlockPlugin";
import { useRef } from "react";

import { IconDraggableBlockMenu } from "../../icons";

function isOnMenu(element: HTMLElement): boolean {
  return !!element.closest(".draggable-block-menu");
}

const DraggableBlockPlugin: React.FC<{
  anchorElem?: HTMLElement;
}> = ({ anchorElem = document.body }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const targetLineRef = useRef<HTMLDivElement>(null);
  return (
    <DraggableBlockPlugin_EXPERIMENTAL
      menuRef={menuRef}
      anchorElem={anchorElem}
      targetLineRef={targetLineRef}
      menuComponent={
        <div ref={menuRef} className="draggable-block-menu">
          <div className="icon">
            <IconDraggableBlockMenu />
          </div>
        </div>
      }
      targetLineComponent={
        <div ref={targetLineRef} className="draggable-block-target-line" />
      }
      isOnMenu={isOnMenu}
    />
  );
};

export default DraggableBlockPlugin;

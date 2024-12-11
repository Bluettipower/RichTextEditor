import clsx from "clsx";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { IconArrowDropDown } from "../icons";

type DropDownContextType = {
  registerItem: (ref: React.RefObject<HTMLButtonElement>) => void;
};

const DropDownContext = React.createContext<DropDownContextType | null>(null);

const dropDownPadding = 4;

interface DropDownItemProps {
  children: React.ReactNode;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  active?: boolean;
}

export const DropDownItem: React.FC<DropDownItemProps> = (props) => {
  const { children, onClick, title, active } = props;
  const ref = useRef<HTMLButtonElement>(null);

  const dropDownContext = React.useContext(DropDownContext);

  if (dropDownContext === null) {
    throw new Error("DropDownItem must be used within a DropDown");
  }

  const { registerItem } = dropDownContext;

  useEffect(() => {
    if (ref && ref.current) registerItem(ref);
  }, [ref, registerItem]);

  return (
    <button
      ref={ref}
      title={title}
      type="button"
      onClick={onClick}
      className={clsx(
        "lexicaltheme__dropdown__item",
        active && "lexicaltheme__dropdown__item_active"
      )}
    >
      {children}
    </button>
  );
};

const DropDownItems: React.FC<{
  children: React.ReactNode;
  dropDownRef: React.Ref<HTMLDivElement>;
  onClose: () => void;
}> = (props) => {
  const { children, dropDownRef, onClose } = props;
  const [items, setItems] = useState<React.RefObject<HTMLButtonElement>[]>();
  const [highlightedItem, setHighlightedItem] =
    useState<React.RefObject<HTMLButtonElement>>();

  const registerItem = useCallback(
    (itemRef: React.RefObject<HTMLButtonElement>) => {
      setItems((prev) => (prev ? [...prev, itemRef] : [itemRef]));
    },
    [setItems]
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!items) return;

    const key = event.key;

    if (["Escape", "ArrowUp", "ArrowDown", "Tab"].includes(key)) {
      event.preventDefault();
    }

    if (key === "Escape" || key === "Tab") {
      onClose();
    } else if (key === "ArrowUp") {
      setHighlightedItem((prev) => {
        if (!prev) return items[0];

        const index = items.indexOf(prev) - 1;
        return items[index === -1 ? items.length - 1 : index];
      });
    } else if (key === "ArrowDown") {
      setHighlightedItem((prev) => {
        if (!prev) return items[0];

        return items[items.indexOf(prev) + 1];
      });
    }
  };

  const contextValue = useMemo(
    () => ({
      registerItem,
    }),
    [registerItem]
  );

  useEffect(() => {
    if (items && !highlightedItem) setHighlightedItem(items[0]);

    if (highlightedItem && highlightedItem.current)
      highlightedItem.current.focus();
  }, [items, highlightedItem]);

  return (
    <DropDownContext.Provider value={contextValue}>
      <div
        ref={dropDownRef}
        onKeyDown={handleKeyDown}
        className="lexicaltheme__dropdowns"
      >
        {children}
      </div>
    </DropDownContext.Provider>
  );
};

interface DropDownProps {
  disabled?: boolean;
  children: ReactNode;
  buttonLabel?: ReactNode;
  buttonAriaLabel?: string;
  type?: "button" | "dropdown";
  stopCloseOnClickSelf?: boolean;
}

const DropDown: React.FC<DropDownProps> = (props) => {
  const {
    children,
    buttonLabel,
    disabled = false,
    type = "dropdown",
    stopCloseOnClickSelf,
  } = props;

  const dropDownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showDropDown, setShowDropDown] = useState(false);

  const handleClose = () => {
    setShowDropDown(false);
    if (buttonRef && buttonRef.current) buttonRef.current.focus();
  };

  useEffect(() => {
    const button = buttonRef.current;
    const dropDown = dropDownRef.current;

    if (showDropDown && button !== null && dropDown !== null) {
      const { top, left } = button.getBoundingClientRect();
      dropDown.style.top = `${top + button.offsetHeight + dropDownPadding}px`;
      dropDown.style.left = `${Math.min(
        left,
        window.innerWidth - dropDown.offsetWidth - 20
      )}px`;
    }
  }, [dropDownRef, buttonRef, showDropDown]);

  useEffect(() => {
    const button = buttonRef.current;

    if (button !== null && showDropDown) {
      const handle = (event: MouseEvent) => {
        const target = event.target;
        if (stopCloseOnClickSelf) {
          if (
            dropDownRef.current &&
            dropDownRef.current.contains(target as Node)
          )
            return;
        }
        if (!button.contains(target as Node)) setShowDropDown(false);
      };
      document.addEventListener("click", handle);

      return () => {
        document.removeEventListener("click", handle);
      };
    }
  }, [dropDownRef, buttonRef, showDropDown, stopCloseOnClickSelf]);

  useEffect(() => {
    const handleButtonPositionUpdate = () => {
      if (showDropDown) {
        const button = buttonRef.current;
        const dropDown = dropDownRef.current;
        if (button !== null && dropDown !== null) {
          const { top } = button.getBoundingClientRect();
          const newPosition = top + button.offsetHeight + dropDownPadding;
          if (newPosition !== dropDown.getBoundingClientRect().top) {
            dropDown.style.top = `${newPosition}px`;
          }
        }
      }
    };

    document.addEventListener("scroll", handleButtonPositionUpdate);

    return () => {
      document.removeEventListener("scroll", handleButtonPositionUpdate);
    };
  }, [buttonRef, dropDownRef, showDropDown]);

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        disabled={disabled}
        onClick={() => setShowDropDown(!showDropDown)}
        className={clsx(
          type === "button"
            ? "lexicaltheme__dropdown__activor_sm"
            : "lexicaltheme__dropdown__activor",
          showDropDown ? "lexicaltheme__dropdown__activor_active" : ""
        )}
      >
        {buttonLabel && typeof buttonLabel === "string" ? (
          <span>{buttonLabel}</span>
        ) : (
          buttonLabel
        )}
        {type === "dropdown" && (
          <IconArrowDropDown style={{ color: "#9ca3af " }} />
        )}
      </button>

      {showDropDown &&
        createPortal(
          <DropDownItems dropDownRef={dropDownRef} onClose={handleClose}>
            {children}
          </DropDownItems>,
          document.body
        )}
    </>
  );
};
export default DropDown;

import React, { ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IconCloseOutlined } from "../icons";

interface PortalImplProps {
  children: ReactNode;
  closeOnClickOutside: boolean;
  onClose: () => void;
  title: string;
}

const PortalImpl: React.FC<PortalImplProps> = (props) => {
  const { onClose, children, title, closeOnClickOutside } = props;
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modalRef.current !== null) {
      modalRef.current.focus();
    }
  }, []);

  useEffect(() => {
    let modalOverlayElement: HTMLElement | null = null;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    const clickOutsideHandler = (event: MouseEvent) => {
      const target = event.target;
      if (
        modalRef.current !== null &&
        !modalRef.current.contains(target as Node) &&
        closeOnClickOutside
      ) {
        onClose();
      }
    };
    const modelElement = modalRef.current;
    if (modelElement !== null) {
      modalOverlayElement = modelElement.parentElement;
      if (modalOverlayElement !== null) {
        modalOverlayElement.addEventListener("click", clickOutsideHandler);
      }
    }

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
      if (modalOverlayElement !== null) {
        modalOverlayElement?.removeEventListener("click", clickOutsideHandler);
      }
    };
  }, [closeOnClickOutside, onClose]);

  return (
    <div role="dialog" className="lexicaltheme__dialog">
      <div tabIndex={-1} ref={modalRef} className="lexicaltheme__diablogbox">
        <div className="lexicaltheme__dialogheader">
          <h2 className="lexicaltheme__dialogheader__title">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="lexicaltheme__dialogheader__close"
          >
            <IconCloseOutlined />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

interface ModalProps {
  children: ReactNode;
  closeOnClickOutside?: boolean;
  onClose: () => void;
  title: string;
}

const Modal: React.FC<ModalProps> = (props) => {
  const { onClose, children, title, closeOnClickOutside = false } = props;
  return createPortal(
    <PortalImpl
      title={title}
      onClose={onClose}
      closeOnClickOutside={closeOnClickOutside}
    >
      {children}
    </PortalImpl>,
    document.body
  );
};

export default Modal;

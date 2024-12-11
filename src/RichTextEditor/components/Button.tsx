import clsx from "clsx";
import React, { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}

const Button: React.FC<ButtonProps> = (props) => {
  const { children, className, onClick, disabled, title } = props;
  return (
    <button
      type="button"
      disabled={disabled}
      className={clsx("lexicaltheme__button", className)}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
};

export default Button;

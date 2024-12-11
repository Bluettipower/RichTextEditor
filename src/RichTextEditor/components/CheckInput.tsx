import clsx from "clsx";
import React from "react";

interface CheckInputProps {
  id?: string;
  label?: string;
  value: boolean;
  className?: string;
  onChange: (val: boolean) => void;
}

const CheckInput: React.FC<CheckInputProps> = (props) => {
  const { label, value, id, onChange, className } = props;

  return (
    <div className={clsx("lexicaltheme__checkboxInput", className)}>
      <input
        id={id}
        type="checkbox"
        checked={value}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label ? (
        <label className="checkbox-label" htmlFor={id}>
          {label}
        </label>
      ) : null}
    </div>
  );
};

export default CheckInput;

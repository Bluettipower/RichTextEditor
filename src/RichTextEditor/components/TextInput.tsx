import clsx from "clsx";
import React, { HTMLInputTypeAttribute, useState } from "react";

interface TextInputProps {
  label?: string;
  value: string;
  className?: string;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  onChange: (val: string) => void;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
  onBlur?: () => void;
  disabled?: boolean;
}

const TextInput: React.FC<TextInputProps> = (props) => {
  const {
    label,
    value,
    suffix,
    prefix,
    onChange,
    className,
    type = "text",
    placeholder = "",
    onBlur,
    disabled,
  } = props;

  const [focused, setFocused] = useState(false);
  // const [error, setError] = useState("");

  return (
    <div style={{ display: "flex", height: "32px" }}>
      {label ? (
        <label className="lexicaltheme__textinputlabel">{label}</label>
      ) : null}
      <div
        className={clsx(
          "lexicaltheme__textinputwrapper",
          focused && "lexicaltheme__textinputwrapperfocused",
          disabled && "lexicaltheme__textinputwrapperdisabled"
        )}
      >
        {prefix}
        <input
          // type={type}
          value={value}
          type="text"
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur && onBlur();
          }}
          onChange={(e) => {
            if (type === "number") {
              const value = e.target.value.trim();
              if (!/^\d*\.?\d*$/.test(value)) return;
              onChange(value);
            } else {
              onChange(e.target.value);
            }
          }}
          className={clsx("lexicaltheme__textinput", className)}
        />
        {suffix}
      </div>
    </div>
  );
};

export default TextInput;

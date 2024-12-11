import { first } from "lodash";
import React, { useState } from "react";

interface FileInputProps {
  label: string;
  accept?: string;
  onChange: (files: FileList | null) => void;
}
const FileInput: React.FC<FileInputProps> = (props) => {
  const { accept, label, onChange } = props;

  const inputRef = React.useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>();

  return (
    <div style={{ display: "flex", height: "32px" }}>
      <label className="lexicaltheme__textinputlabel">{label}</label>
      <div
        className="lexicaltheme__fileinput"
        onClick={() => inputRef.current?.click()}
      >
        {fileName || "选择文件"}
      </div>
      <input
        type="file"
        ref={inputRef}
        accept={accept}
        multiple={false}
        style={{ display: "none" }}
        onChange={(e) => {
          onChange(e.target.files);
          setFileName(first(e.target.files)?.name);
        }}
      />
    </div>
  );
};

export default FileInput;

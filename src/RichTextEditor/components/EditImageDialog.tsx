import React, { useEffect, useState } from "react";

import CheckInput from "./CheckInput";
import { DialogActions } from "./Dialog";
import Modal from "./Modal";
import TextInput from "./TextInput";

export interface EditImageDialogValues {
  src: string;
  altText: string;
  width?: string | number;
}

export interface EditImageDialogFormProps {
  image: EditImageDialogValues;
  onSave: (value: {
    width: string | number;
    src: string;
    altText: string;
  }) => void;
}

function coverImageSize(value: string | number): string {
  if (typeof value === "number") {
    return value.toString();
  }
  if (value.trim() === "") {
    return "";
  }
  return value.replace("px", "").replace("%", "");
}

export const EditImageDialogForm: React.FC<EditImageDialogFormProps> = ({
  image,
  onSave,
}) => {
  const [width, setWidth] = useState("");
  const [widthSuffix, setWidthSuffix] = useState("px");
  const [src, setSrc] = useState("");
  const [altText, setAltText] = useState("");

  useEffect(() => {
    setWidth(coverImageSize(image.width ?? ""));
    setWidthSuffix(image.width?.toString().includes("%") ? "%" : "px");
    setSrc(image.src);
    setAltText(image.altText);
  }, [image]);

  return (
    <>
      <div
        style={{
          width: 500,
          maxWidth: "100%",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <TextInput
            label="宽度"
            type="number"
            value={width}
            suffix={widthSuffix}
            onChange={(v) => setWidth(v)}
            disabled={widthSuffix === "%"}
          />
          <CheckInput
            label="铺满屏幕"
            value={widthSuffix === "%"}
            onChange={(val) => {
              if (val) {
                setWidthSuffix("%");
                setWidth("100");
              } else {
                setWidthSuffix("px");
              }
            }}
          />
        </div>
        <TextInput
          type="url"
          value={src}
          label="图片地址"
          placeholder="https://"
          onChange={(v) => setSrc(v)}
        />
        <TextInput
          label="图片描述"
          value={altText}
          placeholder="alt text"
          onChange={(v) => setAltText(v)}
        />
      </div>
      <DialogActions>
        <button
          type="button"
          className="insertimage-dialog-button"
          disabled={width.trim() === "" || src.trim() === ""}
          onClick={() => {
            onSave({
              altText,
              src,
              width: widthSuffix === "%" ? "100%" : Number(width),
            });
          }}
        >
          确定
        </button>
      </DialogActions>
    </>
  );
};

export interface EditImageDialogProps extends EditImageDialogFormProps {
  onClose: () => void;
}

const EditImageDialog: React.FC<EditImageDialogProps> = ({
  image,
  onSave,
  onClose,
}) => {
  return (
    <Modal title="编辑图片" closeOnClickOutside={false} onClose={onClose}>
      <EditImageDialogForm image={image} onSave={onSave} />
    </Modal>
  );
};

export default EditImageDialog;

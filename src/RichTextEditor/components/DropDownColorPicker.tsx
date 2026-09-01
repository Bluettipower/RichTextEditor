import * as React from "react";

import ColorPicker from "./ColorPicker";
import DropDown from "./DropDown";

interface DropdownColorPickerProps {
  color: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  onChange?: (color: string, skipHistoryStack: boolean) => void;
  showTransparent?: boolean;
}

const DropdownColorPicker: React.FC<DropdownColorPickerProps> = (props) => {
  const { color, disabled, icon, onChange, showTransparent, ...rest } = props;
  return (
    <DropDown
      {...rest}
      type="button"
      buttonLabel={icon}
      disabled={disabled}
      stopCloseOnClickSelf
    >
      <ColorPicker
        color={color}
        onChange={onChange}
        showTransparent={showTransparent}
      />
    </DropDown>
  );
};

export default DropdownColorPicker;

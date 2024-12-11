import {
  ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  LexicalEditor,
  OUTDENT_CONTENT_COMMAND,
} from 'lexical';
import React from 'react';

import {
  IconIndent,
  IconJustify,
  IconOutdent,
  IconTextCenter,
  IconTextLeft,
  IconTextRight,
} from '../icons';

import DropDown, { DropDownItem } from './DropDown';

interface DropDownAlignmentProps {
  value: ElementFormatType;
  editor: LexicalEditor;
  disabled?: boolean;
}

const DropDownAlignment: React.FC<DropDownAlignmentProps> = (props) => {
  const { editor, value } = props;

  return (
    <DropDown buttonLabel={'对齐'}>
      <DropDownItem
        active={value === 'left'}
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
      >
        <IconTextLeft />
        <span className="text">Left Align</span>
      </DropDownItem>
      <DropDownItem
        active={value === 'center'}
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
      >
        <IconTextCenter />
        <span className="text">Center Align</span>
      </DropDownItem>
      <DropDownItem
        active={value === 'right'}
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
      >
        <IconTextRight />
        <span className="text">Right Align</span>
      </DropDownItem>
      <DropDownItem
        active={value === 'justify'}
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
        }}
      >
        <IconJustify />
        <span className="text">Justify Align</span>
      </DropDownItem>
      <DropDownItem
        active={value === 'start'}
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'start')}
      >
        <IconTextLeft />
        <span className="text">Start Align</span>
      </DropDownItem>
      <DropDownItem
        active={value === 'end'}
        onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'end')}
      >
        <IconTextRight />
        <span className="text">End Align</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
        }}
      >
        <IconOutdent />
        <span className="text">Outdent</span>
      </DropDownItem>
      <DropDownItem
        onClick={() => {
          editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
        }}
      >
        <IconIndent />
        <span className="text">Indent</span>
      </DropDownItem>
    </DropDown>
  );
};

export default DropDownAlignment;

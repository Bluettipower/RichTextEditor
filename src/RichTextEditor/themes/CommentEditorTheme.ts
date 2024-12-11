import type { EditorThemeClasses } from 'lexical';

import './CommentEditorTheme.css';

import baseTheme from './EditorTheme';

const theme: EditorThemeClasses = {
  ...baseTheme,
  paragraph: 'CommentEditorTheme__paragraph',
};

export default theme;

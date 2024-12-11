import { INSERT_TABLE_COMMAND } from "@lexical/table";
import { EditorThemeClasses, Klass, LexicalEditor, LexicalNode } from "lexical";
import { createContext, useEffect, useMemo, useState } from "react";

import Button from "../../components/Button";
import { DialogActions } from "../../components/Dialog";
import TextInput from "../../components/TextInput";
import CheckInput from "../../components/CheckInput";

export type InsertTableCommandPayload = Readonly<{
  columns: string;
  rows: string;
  includeHeaders?: boolean;
}>;

export type CellContextShape = {
  cellEditorConfig: null | CellEditorConfig;
  cellEditorPlugins: null | JSX.Element | Array<JSX.Element>;
  set: (
    cellEditorConfig: null | CellEditorConfig,
    cellEditorPlugins: null | JSX.Element | Array<JSX.Element>
  ) => void;
};

export type CellEditorConfig = Readonly<{
  namespace: string;
  nodes?: ReadonlyArray<Klass<LexicalNode>>;
  onError: (error: Error, editor: LexicalEditor) => void;
  readOnly?: boolean;
  theme?: EditorThemeClasses;
}>;

// export const INSERT_NEW_TABLE_COMMAND: LexicalCommand<InsertTableCommandPayload> =
//   createCommand("INSERT_NEW_TABLE_COMMAND");

export const CellContext = createContext<CellContextShape>({
  cellEditorConfig: null,
  cellEditorPlugins: null,
  set: () => {
    // Empty
  },
});

export function TableContext({ children }: { children: JSX.Element }) {
  const [contextValue, setContextValue] = useState<{
    cellEditorConfig: null | CellEditorConfig;
    cellEditorPlugins: null | JSX.Element | Array<JSX.Element>;
  }>({
    cellEditorConfig: null,
    cellEditorPlugins: null,
  });
  return (
    <CellContext.Provider
      value={useMemo(
        () => ({
          cellEditorConfig: contextValue.cellEditorConfig,
          cellEditorPlugins: contextValue.cellEditorPlugins,
          set: (cellEditorConfig, cellEditorPlugins) => {
            setContextValue({ cellEditorConfig, cellEditorPlugins });
          },
        }),
        [contextValue.cellEditorConfig, contextValue.cellEditorPlugins]
      )}
    >
      {children}
    </CellContext.Provider>
  );
}

export function InsertTableDialog({
  activeEditor,
  onClose,
}: {
  activeEditor: LexicalEditor;
  onClose: () => void;
}): JSX.Element {
  const [rows, setRows] = useState("5");
  const [columns, setColumns] = useState("5");
  const [rowsHeader, setRowsHeader] = useState(true);
  const [columnsHeader, setColumnsHeader] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    const row = Number(rows);
    const column = Number(columns);
    if (row && row > 0 && row <= 500 && column && column > 0 && column <= 50) {
      setIsDisabled(false);
    } else {
      setIsDisabled(true);
    }
  }, [rows, columns]);

  const onClick = () => {
    activeEditor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns,
      rows,
      includeHeaders: {
        rows: rowsHeader,
        columns: columnsHeader,
      },
    });

    onClose();
  };

  return (
    <>
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <TextInput
          label="行"
          value={rows}
          type="number"
          onChange={setRows}
          placeholder="请输入行数（1-50）"
        />
        <TextInput
          label="列"
          type="number"
          value={columns}
          onChange={setColumns}
          placeholder="请输入列数（1-50）"
        />
        <CheckInput
          id="contains-headers-row"
          value={rowsHeader}
          label="包含表头（行）"
          onChange={(v) => setRowsHeader(v)}
        />
        <CheckInput
          label="包含表头（列）"
          id="contains-headers-col"
          value={columnsHeader}
          onChange={(v) => setColumnsHeader(v)}
        />
      </div>
      <DialogActions>
        <Button disabled={isDisabled} onClick={onClick}>
          确认
        </Button>
      </DialogActions>
    </>
  );
}

// export function TablePlugin({
//   cellEditorConfig,
//   children,
// }: {
//   cellEditorConfig: CellEditorConfig;
//   children: JSX.Element | Array<JSX.Element>;
// }): JSX.Element | null {
//   const [editor] = useLexicalComposerContext();
//   const cellContext = useContext(CellContext);

//   useEffect(() => {
//     if (!editor.hasNodes([TableNode])) {
//       throw new Error("TablePlugin: TableNode is not registered on editor");
//     }

//     cellContext.set(cellEditorConfig, children);

//     return editor.registerCommand<InsertTableCommandPayload>(
//       INSERT_NEW_TABLE_COMMAND,
//       ({ columns, rows, includeHeaders }) => {
//         const tableNode = $createTableNodeWithDimensions(
//           Number(rows),
//           Number(columns),
//           includeHeaders
//         );
//         $insertNodes([tableNode]);
//         return true;
//       },
//       COMMAND_PRIORITY_EDITOR
//     );
//   }, [cellContext, cellEditorConfig, children, editor]);

//   return null;
// }

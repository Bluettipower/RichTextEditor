import type { Meta, StoryObj } from "@storybook/react-vite";

import RichTextEditor, { type ToolbarGroupKey } from "../RichTextEditor";

const meta = {
  title: "Example/RichTextEditor",
  component: RichTextEditor,
  parameters: {},
  tags: ["RichTextEditor"],
  argTypes: {
    collapsedGroups: {
      control: "object",
      description:
        "需要默认收起的分组：undo|fontSize|format|script|align|list|insert|clear，为空则不收起",
    },
  },
  args: {
    collapsedGroups: [],
  },
} satisfies Meta<typeof RichTextEditor>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    id: "my-editor",
    defaultValue: "This is some initial content",
    max: { preventInput: true, len: 200 },
    collapsedGroups: [] as ToolbarGroupKey[],
    onChange(value) {
      console.log(value);
    },
  },
};

/** 部分分组收起：仅显示撤销/重做、格式、上下标与表情，可点击「更多」展开 */
export const ToolbarPartiallyCollapsed: Story = {
  args: {
    id: "my-editor-partial",
    collapsedGroups: [
      "fontSize",
      "align",
      "list",
      "insert",
      "clear",
    ] as ToolbarGroupKey[],
  },
};

/** 全部展开：不收起任何分组，无「更多」按钮 */
export const ToolbarFull: Story = {
  args: {
    id: "my-editor-full",
    collapsedGroups: [],
  },
};

export const Disabled: Story = {
  args: {
    id: "my-editor-disabled",
    disabled: true,
  },
};

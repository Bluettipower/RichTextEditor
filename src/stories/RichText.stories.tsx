import type { Meta, StoryObj } from "@storybook/react-vite";

import RichTextEditor, {
  ToolbarButton,
  type ToolbarGroupKey,
  type ToolbarSlotContext,
} from "../RichTextEditor";

const InsertProductButton = () => (
  <ToolbarButton title="插入产品">
    <span style={{ fontSize: 12, padding: "0 4px" }}>插入产品</span>
  </ToolbarButton>
);

const InsertCustomButtons = ({ editor, disabled }: ToolbarSlotContext) => (
  <>
    <ToolbarButton
      disabled={disabled}
      title="插入产品"
      onClick={() => {
        editor.update(() => {
          console.log("insert product");
        });
      }}
    >
      <span style={{ fontSize: 12, padding: "0 4px" }}>插入产品</span>
    </ToolbarButton>
    <ToolbarButton
      disabled={disabled}
      title="插入变量"
      onClick={() => {
        editor.update(() => {
          console.log("insert variable");
        });
      }}
    >
      <span style={{ fontSize: 12, padding: "0 4px" }}>插入变量</span>
    </ToolbarButton>
  </>
);

const meta = {
  title: "Example/RichTextEditor",
  component: RichTextEditor,
  parameters: {},
  tags: ["RichTextEditor"],
  argTypes: {
    collapsedGroups: {
      control: "object",
      description:
        "需要默认收起的分组：undo|heading|fontSize|format|script|align|list|insert|htmlView|clear，为空则不收起",
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

/** 工具栏插槽：在 toolbar 区域扩展多个自定义按钮 */
export const WithToolbarSlots: Story = {
  args: {
    id: "my-editor-slots",
    defaultValue: "<h2>标题示例</h2><p>可通过 toolbarSlots 扩展工具栏</p>",
    toolbarSlots: InsertCustomButtons,
  },
};

/** 工具栏插槽：直接传入多个 ReactNode */
export const WithToolbarSlotNodes: Story = {
  args: {
    id: "my-editor-slot-nodes",
    toolbarSlots: [<InsertProductButton key="product" />],
  },
};

/** HTML 源码只读查看 */
export const HtmlViewReadonly: Story = {
  args: {
    id: "my-editor-html-readonly",
    defaultValue: "<p><strong>Hello</strong> World</p>",
    htmlViewEditable: false,
  },
};

/** 隐藏内置图片按钮，改用自定义插槽上传 */
export const HideBuiltinImage: Story = {
  args: {
    id: "my-editor-hide-image",
    hiddenToolbarItems: ["image"],
    toolbarSlots: ({ editor, disabled }) => (
      <ToolbarButton
        disabled={disabled}
        title="自定义上传图片"
        onClick={() => {
          editor.update(() => {
            console.log("custom image upload");
          });
        }}
      >
        <span style={{ fontSize: 12, padding: "0 4px" }}>上传图片</span>
      </ToolbarButton>
    ),
    toolbarSlotPosition: "end",
  },
};

/** 隐藏整个 insert 分组 */
export const HideInsertGroup: Story = {
  args: {
    id: "my-editor-hide-insert",
    hiddenToolbarItems: ["insert"],
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

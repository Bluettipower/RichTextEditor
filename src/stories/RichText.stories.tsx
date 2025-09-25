import type { Meta, StoryObj } from "@storybook/react-vite";

import RichTextEditor from "../index";

const meta = {
  title: "Example/RichTextEditor",
  component: RichTextEditor,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["RichTextEditor"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {},
} satisfies Meta<typeof RichTextEditor>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  args: {
    id: "my-editor",
    max: { preventInput: true, len: 200 },
    onChange(value) {
      console.log(value);
    },
  },
};
export const Disabled: Story = {
  args: {
    id: "my-editor-disabled",
    disabled: true,
  },
};

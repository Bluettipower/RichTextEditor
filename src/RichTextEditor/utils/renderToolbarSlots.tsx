import { Fragment, ReactNode } from "react";

import type { ToolbarSlotContext } from "../plugins/ToolbarPlugin";

export function normalizeToolbarSlots(
  toolbarSlots:
    | ReactNode
    | ReactNode[]
    | ((context: ToolbarSlotContext) => ReactNode | ReactNode[])
    | undefined,
  context: ToolbarSlotContext
): ReactNode[] {
  if (toolbarSlots === undefined) {
    return [];
  }

  const slots =
    typeof toolbarSlots === "function" ? toolbarSlots(context) : toolbarSlots;

  return (Array.isArray(slots) ? slots : [slots]).filter(Boolean);
}

export function renderToolbarSlots(
  toolbarSlots:
    | ReactNode
    | ReactNode[]
    | ((context: ToolbarSlotContext) => ReactNode | ReactNode[])
    | undefined,
  context: ToolbarSlotContext,
  keyPrefix: string
) {
  return normalizeToolbarSlots(toolbarSlots, context).map((slot, index) => (
    <Fragment key={`${keyPrefix}-${index}`}>{slot}</Fragment>
  ));
}

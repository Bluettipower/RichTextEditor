export function setFloatingElemPositionForLinkEditor(
  targetRect: DOMRect | null,
  floatingElem: HTMLElement,
  anchorElem: HTMLElement,
  verticalGap: number = 10,
  horizontalOffset: number = 5
): void {
  if (targetRect === null) {
    floatingElem.style.opacity = "0";
    floatingElem.style.transform = "translate(-10000px, -10000px)";
    return;
  }

  const floatingElemRect = floatingElem.getBoundingClientRect();
  const anchorRect = anchorElem.getBoundingClientRect();

  // 基于 anchor 相对位置
  let top =
    targetRect.top - anchorRect.top - floatingElemRect.height - verticalGap;
  let left = targetRect.left - anchorRect.left + horizontalOffset;

  // 如果浮动框超出上边界 → 放到下方
  if (top < 0) {
    top = targetRect.bottom - anchorRect.top + verticalGap;
  }

  // 如果浮动框超出右边界 → 左移
  if (left + floatingElemRect.width > anchorRect.width) {
    left = anchorRect.width - floatingElemRect.width - horizontalOffset;
  }

  floatingElem.style.opacity = "1";
  floatingElem.style.transform = `translate(${left}px, ${top}px)`;
}

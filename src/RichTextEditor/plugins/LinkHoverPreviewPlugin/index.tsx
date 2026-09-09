import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface LinkPreview {
  url: string;
  left: number;
  top: number;
}

function resolveLinkHref(link: HTMLAnchorElement): string {
  const raw = link.getAttribute("href")?.trim() ?? "";
  if (raw && raw !== "#") {
    return raw;
  }
  return link.href || "";
}

function getHoveredLink(
  target: EventTarget | null,
  root: HTMLElement
): HTMLAnchorElement | null {
  if (!(target instanceof Element)) {
    return null;
  }
  const link = target.closest("a[href]");
  if (!(link instanceof HTMLAnchorElement) || !root.contains(link)) {
    return null;
  }
  return link;
}

export default function LinkHoverPreviewPlugin(): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const currentLinkRef = useRef<HTMLAnchorElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current != null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const hidePreview = useCallback(() => {
    currentLinkRef.current = null;
    setPreview(null);
  }, []);

  const showPreview = useCallback((link: HTMLAnchorElement) => {
    const url = resolveLinkHref(link);
    if (!url) {
      hidePreview();
      return;
    }

    const rect = link.getBoundingClientRect();
    const maxWidth = 360;
    const estimatedHeight = 32;
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow < estimatedHeight + gap
        ? Math.max(8, rect.top - estimatedHeight - gap)
        : rect.bottom + gap;
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - maxWidth - 8
    );

    currentLinkRef.current = link;
    setPreview({ url, left, top });
  }, [hidePreview]);

  useEffect(() => {
    const onMouseOver = (event: MouseEvent) => {
      const root = editor.getRootElement();
      if (!root) {
        return;
      }
      const link = getHoveredLink(event.target, root);
      if (!link) {
        return;
      }
      if (currentLinkRef.current === link) {
        clearHideTimer();
        return;
      }
      clearHideTimer();
      showPreview(link);
    };

    const onMouseOut = (event: MouseEvent) => {
      const link = currentLinkRef.current;
      if (!link) {
        return;
      }
      const next = event.relatedTarget;
      if (next instanceof Node && link.contains(next)) {
        return;
      }
      clearHideTimer();
      hideTimerRef.current = window.setTimeout(hidePreview, 80);
    };

    const onScroll = () => {
      if (currentLinkRef.current) {
        hidePreview();
      }
    };

    document.addEventListener("mouseover", onMouseOver, true);
    document.addEventListener("mouseout", onMouseOut, true);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      clearHideTimer();
      document.removeEventListener("mouseover", onMouseOver, true);
      document.removeEventListener("mouseout", onMouseOut, true);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [editor, hidePreview, showPreview]);

  if (!preview) {
    return null;
  }

  return createPortal(
    <div
      className="lexicaltheme__link-hover-preview"
      style={{ left: preview.left, top: preview.top }}
    >
      {preview.url}
    </div>,
    document.body
  );
}

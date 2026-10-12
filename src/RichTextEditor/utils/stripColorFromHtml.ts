const TEXT_COLOR_STYLE_PROPS = new Set([
  "color",
  "background-color",
  "background",
  "-webkit-text-fill-color",
]);

const TABLE_CELL_TAGS = new Set(["TD", "TH"]);

function cleanEmptyStyle(el: HTMLElement): void {
  if (!el.getAttribute("style")?.trim()) {
    el.removeAttribute("style");
  }
}

function stripColorFromStyleAttribute(el: HTMLElement): void {
  const raw = el.getAttribute("style");
  if (!raw) {
    return;
  }
  const kept = raw
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((decl) => {
      const colon = decl.indexOf(":");
      if (colon === -1) {
        return true;
      }
      const name = decl
        .slice(0, colon)
        .trim()
        .replace(/\s*!important\s*$/i, "")
        .toLowerCase();
      return !TEXT_COLOR_STYLE_PROPS.has(name);
    });
  if (kept.length > 0) {
    el.setAttribute("style", kept.join("; "));
  } else {
    el.removeAttribute("style");
  }
}

function stripTextColorsFromElement(el: HTMLElement): void {
  if (el.tagName === "STYLE" || el.tagName === "LINK") {
    return;
  }

  if (TABLE_CELL_TAGS.has(el.tagName)) {
    el.style.removeProperty("color");
    el.style.removeProperty("-webkit-text-fill-color");
    stripColorFromStyleAttribute(el);
    cleanEmptyStyle(el);
  } else {
    for (const prop of TEXT_COLOR_STYLE_PROPS) {
      el.style.removeProperty(prop);
    }
    stripColorFromStyleAttribute(el);
    cleanEmptyStyle(el);
    if (el.tagName === "FONT") {
      el.removeAttribute("color");
    }
    el.removeAttribute("bgcolor");
    el.removeAttribute("class");
  }

  Array.from(el.children).forEach((child) => {
    if (child instanceof HTMLElement) {
      stripTextColorsFromElement(child);
    }
  });
}

/** 从粘贴 HTML 中移除文字颜色与高亮，保留 td/th 单元格背景。 */
export function stripTextColorFromHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll("style, link[rel='stylesheet'], link[rel='Stylesheet']")
    .forEach((node) => node.remove());
  stripTextColorsFromElement(doc.body);
  return doc.body.innerHTML;
}

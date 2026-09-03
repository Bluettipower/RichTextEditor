export const FONT_FAMILY_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "默认字体" },
  { value: "Arial", label: "Arial" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Georgia", label: "Georgia" },
  { value: "Verdana", label: "Verdana" },
  { value: "Courier New", label: "Courier New" },
  { value: "Tahoma", label: "Tahoma" },
  { value: "Trebuchet MS", label: "Trebuchet MS" },
  { value: "Microsoft YaHei", label: "微软雅黑" },
  { value: "SimSun", label: "宋体" },
  { value: "SimHei", label: "黑体" },
  { value: "KaiTi", label: "楷体" },
  { value: "FangSong", label: "仿宋" },
];

export function resolveToolbarFontFamily(value?: string | null): string {
  if (!value) {
    return "";
  }

  const first = value
    .split(",")[0]
    .trim()
    .replace(/^["']+|["']+$/g, "");

  if (!first) {
    return "";
  }

  const matched = FONT_FAMILY_OPTIONS.find(
    (option) => option.value && option.value.toLowerCase() === first.toLowerCase()
  );

  return matched?.value ?? "";
}

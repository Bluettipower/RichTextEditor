import * as React from "react";
import type { SVGProps } from "react";
const SvgTypeStrikethrough = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="currentColor"
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M10 19h4v-3h-4zM5 4v3h5v3h4V7h5V4zM3 14h18v-2H3z"></path>
  </svg>
);
export default SvgTypeStrikethrough;

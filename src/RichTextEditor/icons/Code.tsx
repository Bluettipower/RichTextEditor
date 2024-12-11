import * as React from "react";
import type { SVGProps } from "react";
const SvgCode = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    fill="currentColor"
    viewBox="0 0 24 24"
    {...props}
  >
    <path d="M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6z"></path>
  </svg>
);
export default SvgCode;

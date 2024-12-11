import * as React from "react";
import type { SVGProps } from "react";
const SvgArrowDropDown = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width={22}
    height={22}
    fill="currentColor"
    {...props}
  >
    <path d="m7 10 5 5 5-5z"></path>
  </svg>
);
export default SvgArrowDropDown;

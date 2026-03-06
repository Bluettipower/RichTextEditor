import * as React from "react";
import type { SVGProps } from "react";

const SvgChevronDoubleLeft = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M0.75 15.75L8.25 8.25L0.749999 0.750001M6.75 15.75L14.25 8.25L6.75 0.75" />
  </svg>
);
export default SvgChevronDoubleLeft;

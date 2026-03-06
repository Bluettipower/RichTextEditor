import * as React from "react";
import type { SVGProps } from "react";

const SvgChevronDoubleRight = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M14.25 0.750001L6.75 8.25L14.25 15.75M8.25 0.75L0.75 8.25L8.25 15.75" />
  </svg>
);
export default SvgChevronDoubleRight;

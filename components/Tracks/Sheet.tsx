import React, { ReactNode } from "react";
import classNames from "classnames";

import { Rgb } from "utils/colors";

// Mirrors the `paper` and `ink` colours in tailwind.config.js, for the
// contrast maths.
export const PAPER: Rgb = [243, 244, 240];
export const INK: Rgb = [35, 33, 41];

interface SheetProps {
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

const Sheet = ({ title, children, className }: SheetProps) => (
  <div
    className={classNames(
      "sheet px-4 pb-6 pt-8 sm:px-8 md:-rotate-[0.6deg]",
      className,
    )}
  >
    <span aria-hidden="true" className="tape left-6 -rotate-6" />
    <span aria-hidden="true" className="tape right-6 rotate-[5deg]" />
    {title && (
      <h2 className="mb-4 pl-10 font-marker text-2xl leading-tight sm:text-3xl">
        {title}
      </h2>
    )}
    {children}
  </div>
);

export const EncoreBreak = () => (
  <div className="my-3 flex items-center gap-3 pl-10" role="separator">
    <span className="font-marker text-xl">Encore</span>
    <svg
      aria-hidden="true"
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      className="h-3 flex-1 text-ink/70"
    >
      <path
        d="M2 7 C 30 2, 50 11, 80 6 S 130 2, 160 7 S 190 9, 198 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

export default Sheet;

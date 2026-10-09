import React from "react";
import classNames from "classnames";

// The name with a strip of spike tape stuck down behind "Gig". Sized in em,
// so it scales with whatever text size it is given.
const Wordmark = ({ className }: { className?: string }) => (
  <span className={classNames("display relative inline-flex", className)}>
    <span
      aria-hidden="true"
      className="absolute -left-[0.12em] top-[0.2em] h-[0.45em] w-[1.43em] -rotate-6 bg-tape/90"
    />
    <span className="relative">GigPlayList</span>
  </span>
);

export default Wordmark;

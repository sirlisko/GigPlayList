import React from "react";

import Sheet from "components/Tracks/Sheet";

const ResultSkeleton = ({ name }: { name?: string }) => (
  <article aria-busy="true" className="min-h-screen bg-stage text-white">
    <div className="mx-auto w-full max-w-2xl px-4 pb-16 pt-5 sm:px-6">
      <div className="h-5 w-28 rounded bg-white/10" />
      <header className="mt-28 sm:mt-36">
        {name ? (
          <h1 className="display text-6xl sm:text-8xl">{name}</h1>
        ) : (
          <div className="h-16 w-3/4 rounded bg-white/10" />
        )}
        <div className="mt-5 h-4 w-full max-w-prose rounded bg-white/10" />
        <div className="mt-2 h-4 w-2/3 rounded bg-white/10" />
      </header>
      <div className="mb-8 mt-10 h-9 w-56 rounded-full bg-white/10" />
      <Sheet className="animate-pulse motion-reduce:animate-none">
        <ul>
          {Array.from({ length: 8 }, (_, index) => (
            <li key={index} className="flex items-center gap-3 py-2.5">
              <span className="w-7" />
              <span
                className="h-4 rounded bg-ink/10"
                style={{ width: `${70 - index * 5}%` }}
              />
            </li>
          ))}
        </ul>
      </Sheet>
      <p className="sr-only" role="status">
        Loading the setlist
      </p>
    </div>
  </article>
);

export default ResultSkeleton;

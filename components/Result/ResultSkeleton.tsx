import React from "react";

const ResultSkeleton = ({ name }: { name?: string }) => (
  <article
    aria-busy="true"
    className="min-h-screen bg-neutral-900 text-white p-6"
  >
    <div className="w-full max-w-2xl mx-auto">
      <header className="flex justify-center items-center h-9 mb-6">
        {name ? (
          <h1 className="text-3xl font-bold">{name}</h1>
        ) : (
          <div className="h-7 w-48 rounded bg-white/10" />
        )}
      </header>
      <div className="animate-pulse motion-reduce:animate-none">
        <div className="w-32 h-32 mx-auto mb-4 rounded-lg bg-white/10" />
        <div className="h-36 mb-6 rounded-lg bg-white/10" />
        <div className="h-12 w-64 mx-auto mb-8 rounded-full bg-white/10" />
        <ul className="space-y-2">
          {Array.from({ length: 8 }, (_, index) => (
            <li key={index} className="h-12 rounded bg-white/5" />
          ))}
        </ul>
      </div>
      <p className="sr-only" role="status">
        Loading the setlist
      </p>
    </div>
  </article>
);

export default ResultSkeleton;

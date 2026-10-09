import React from "react";

import Sheet, { EncoreBreak } from "components/Tracks/Sheet";

// Illustrative, not real data: it shows how to read a result before there
// is one.
const EXAMPLE = [
  { title: "The opener", share: 100 },
  { title: "The new single", share: 90 },
  { title: "One from the first album", share: 55 },
  { title: "A deep cut", share: 20 },
];

const ExampleRow = ({
  number,
  title,
  share,
}: {
  number: number;
  title: string;
  share: number;
}) => (
  <li className="flex items-center gap-3 py-1.5">
    <span className="w-7 text-right font-marker text-ink/45">{number}</span>
    <span className="relative flex-1">
      <span
        className="absolute inset-y-[18%] left-0 -skew-x-6 rounded-[3px] bg-highlighter/60"
        style={{ width: `${share}%` }}
      />
      <span className="relative font-marker text-lg">{title}</span>
    </span>
  </li>
);

const ExampleSheet = () => (
  <figure className="w-full max-w-sm">
    <Sheet title="Tonight" className="md:rotate-[1.2deg]">
      <ol aria-hidden="true">
        {EXAMPLE.map(({ title, share }, index) => (
          <ExampleRow
            key={title}
            number={index + 1}
            title={title}
            share={share}
          />
        ))}
      </ol>
      <EncoreBreak />
      <ol aria-hidden="true">
        <ExampleRow number={5} title="The one everyone waits for" share={95} />
      </ol>
    </Sheet>
    <figcaption className="mt-4 text-sm text-white/70">
      Songs in the order they&apos;re played. The highlight shows how often each
      one made the set.
    </figcaption>
  </figure>
);

export default ExampleSheet;

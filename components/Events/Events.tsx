import React, { useState } from "react";
import classNames from "classnames";
import { CircleCheck } from "lucide-react";

import { Event } from "types";
import { parseGigDate } from "utils/labels";

interface EventsProps {
  events: Event[];
  selectedGig?: string;
  onSelectGig: (id?: string) => void;
}

const COLLAPSED_COUNT = 3;

const Events = ({ events, selectedGig, onSelectGig }: EventsProps) => {
  const [expanded, setExpanded] = useState(false);
  if (events.length === 0) {
    return null;
  }

  const visible = expanded ? events : events.slice(0, COLLAPSED_COUNT);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">Upcoming near you</h2>
      <p className="text-sm text-white/70">
        Going to one? Name the playlist after it.
      </p>
      <ul role="list" className="mt-3 divide-y divide-white/10">
        {visible.map(({ id, date, venueName, location, buyUrl }) => {
          const eventDate = parseGigDate(date);
          const isSelected = id === selectedGig;
          return (
            <li key={id} className="flex items-center gap-4 py-3">
              <div className="w-11 shrink-0 text-center leading-none">
                <span className="display block text-3xl">
                  {eventDate.getDate()}
                </span>
                <span className="text-xs text-white/70">
                  {eventDate.toLocaleDateString("en-gb", { month: "short" })}
                </span>
              </div>
              <a
                href={buyUrl}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 hover:underline underline-offset-4"
              >
                <span className="block truncate font-medium">{venueName}</span>
                <span className="block truncate text-sm text-white/70">
                  {location}
                </span>
              </a>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectGig(isSelected ? undefined : id)}
                className={classNames(
                  "flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors",
                  isSelected
                    ? "bg-white text-black"
                    : "border border-white/40 hover:bg-white/10",
                )}
              >
                {isSelected && <CircleCheck size={14} aria-hidden="true" />}
                {isSelected ? "Going" : "I'm going"}
              </button>
            </li>
          );
        })}
      </ul>
      {events.length > COLLAPSED_COUNT && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm text-white/80 underline underline-offset-4 hover:text-white"
        >
          {expanded
            ? "Show fewer gigs"
            : `Show ${events.length - COLLAPSED_COUNT} more gigs`}
        </button>
      )}
    </section>
  );
};

export default Events;

import React from "react";
import classNames from "classnames";

import { Event } from "types";
import { parseGigDate } from "utils/labels";

import { Calendar, CircleCheck } from "lucide-react";

interface EventsProps {
  events: Event[];
  selectedGig?: string;
  onSelectGig: (id?: string) => void;
}

const Events = ({ events, selectedGig, onSelectGig }: EventsProps) => {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="bg-black bg-opacity-30 rounded-lg py-4 px-3 mb-6">
      <h2 className="text-xl font-semibold mb-2 px-1">
        {events.length === 1 ? "Next Gig" : `Upcoming Gigs (${events.length})`}
      </h2>
      <ul role="list" className="space-y-1 max-h-48 overflow-y-auto">
        {events.map(({ id, date, venueName, location, buyUrl }) => {
          const eventDate = parseGigDate(date);
          const isSelected = id === selectedGig;
          return (
            <li
              key={id}
              className={classNames(
                "flex items-center justify-between gap-2 rounded",
                { "bg-white bg-opacity-10": isSelected },
              )}
            >
              <a
                href={buyUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded p-1 hover:bg-white hover:bg-opacity-10 transition-colors"
              >
                <Calendar className="shrink-0" size={18} />
                <span>
                  {eventDate.toLocaleDateString("en-gb", { month: "short" })}{" "}
                  {eventDate.getDate()} - {venueName}, {location}
                </span>
              </a>
              <button
                type="button"
                aria-pressed={isSelected}
                onClick={() => onSelectGig(isSelected ? undefined : id)}
                className={classNames(
                  "shrink-0 flex items-center gap-1 rounded-full px-3 py-1 text-sm transition-colors",
                  isSelected
                    ? "bg-white text-black"
                    : "border border-white/40 hover:bg-white/10",
                )}
              >
                {isSelected && <CircleCheck size={14} />}
                {isSelected ? "Going" : "I'm going"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Events;

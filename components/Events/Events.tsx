import React from "react";

import { Event } from "types";

import { Calendar } from "lucide-react";

interface EventsProps {
  events: Event[];
}

const Events = ({ events }: EventsProps) => {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="bg-black bg-opacity-30 rounded-lg p-4 mb-6">
      <h2 className="text-xl font-semibold mb-2">
        {events.length === 1 ? "Next Gig" : `Upcoming Gigs (${events.length})`}
      </h2>
      <ul role="list" className="space-y-1 max-h-48 overflow-y-auto">
        {events.map(({ date, venueName, location, buyUrl }) => {
          const eventDate = new Date(date);
          return (
            <li key={buyUrl}>
              <a
                href={buyUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded p-1 -mx-1 hover:bg-white hover:bg-opacity-10 transition-colors"
              >
                <Calendar className="shrink-0" size={18} />
                <span>
                  {eventDate.toLocaleDateString("en-gb", { month: "short" })}{" "}
                  {eventDate.getDate()} - {venueName}, {location}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Events;

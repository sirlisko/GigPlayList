import duration from "humanize-duration";

import type { Link as LinkType, SetList } from "types";

export const sanitiseDate = (dateString: string | null) => {
  if (!dateString) return null;
  const [day, month, year] = dateString.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

// A bare "2026-10-14" parses as UTC midnight, which is the day before
// anywhere west of Greenwich.
export const parseGigDate = (date: string) =>
  new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00` : date);

export const formatGigDate = (date: string) =>
  parseGigDate(date).toLocaleDateString("en-gb", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const calculatePlaylistDuration = (songs: LinkType[]) => {
  if (!songs.length) return 0;
  return duration(
    songs.reduce((acc, song) => acc + song.duration_ms, 0),
    { round: true, largest: 2 },
  );
};

export const describeEncores = (data: SetList) => {
  const totalSetLists = data.totalSetLists;
  const encores = data.encores;

  if (!encores) {
    return null;
  }

  const ordinal = (n: number) =>
    ["", "first", "second", "third"][n] ?? `${n}th`;

  const encoreLabels = Object.entries(encores)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([encoreNumber, count], index) => {
      const n = parseInt(encoreNumber);
      const share = `${((count / totalSetLists) * 100).toFixed(0)}%`;
      const encore = n === 1 ? "an encore" : `a ${ordinal(n)} encore`;
      return index === 0
        ? `${share} of shows had ${encore}`
        : `${share} ${n === 1 ? encore : `a ${ordinal(n)}`}`;
    });

  return encoreLabels.join(", ");
};

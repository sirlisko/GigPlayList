import duration from "humanize-duration";

import type { Link as LinkType, SetList } from "types";

export const sanitiseDate = (dateString: string | null) => {
  if (!dateString) return null;
  const [day, month, year] = dateString.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
};

export const calculatePlaylistDuration = (songs: LinkType[]) => {
  if (!songs.length) return 0;
  return duration(
    songs.reduce((acc, song) => acc + song.duration_ms, 0),
    { round: true, largest: 2 },
  );
};

export const generateEncoreLabel = (data: SetList) => {
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

  return (
    <>
      <strong>Encores: </strong>
      {encoreLabels.join(", ")}
    </>
  );
};

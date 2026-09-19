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

  const numberToWord = (n: number) => {
    const words = ["zero", "one", "two", "three"];
    return words[n] || n.toString();
  };

  const encoreLabels = Object.entries(encores).map(([encoreNumber, count]) => {
    const probability = ((count / totalSetLists) * 100).toFixed(0);
    return `${probability}% chance of ${numberToWord(parseInt(encoreNumber))}`;
  });

  return (
    <>
      <strong>Encore likelihood: </strong>
      {encoreLabels.join(", ")}
    </>
  );
};

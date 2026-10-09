import { SetList, Track } from "types";

export type Order = "running" | "played";

export interface SetlistView {
  main: Track[];
  encore: Track[];
  extras: Track[];
}

export const typicalSetLength = ({ totalTracks, totalSetLists }: SetList) =>
  totalSetLists > 0 ? Math.max(1, Math.round(totalTracks / totalSetLists)) : 0;

const byPosition = (a: Track, b: Track) => a.position - b.position;

// `tracks` arrive sorted by play count, so the head is what a typical show
// holds and the tail is what only turns up some nights.
export const buildSetlistView = (
  tracks: Track[],
  setLength: number,
  order: Order,
): SetlistView => {
  const core = tracks.slice(0, setLength);
  const extras = tracks.slice(setLength);

  if (order === "played") {
    return { main: core, encore: [], extras };
  }

  return {
    main: core.filter(({ isEncore }) => !isEncore).sort(byPosition),
    encore: core.filter(({ isEncore }) => isEncore).sort(byPosition),
    extras,
  };
};

export const playlistTracks = (
  { main, encore, extras }: SetlistView,
  includeExtras: boolean,
) => [...main, ...encore, ...(includeExtras ? extras : [])];

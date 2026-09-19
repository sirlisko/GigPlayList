import { JSONPath } from "jsonpath-plus";

import { SetList, Track } from "types";

export interface Song {
  name: string;
  cover?: {
    name: string;
  };
}

interface Set {
  "@encore"?: string;
  encore?: string;
  song: Song | Song[];
}

interface FaultySetlist {
  sets: "";
}

interface LegitSetlist {
  artist?: { name: string };
  sets: {
    set: Set | Set[];
  };
  eventDate: string;
}

type Setlist = LegitSetlist | FaultySetlist;

export interface Setlists {
  setlist: Setlist[];
}

const normaliseSongTitle = (song: Song | Song[]) =>
  Array.isArray(song)
    ? song.map(({ name, cover }: Song) => ({
        name: name.toLowerCase(),
        cover: cover?.name,
      }))
    : [{ name: song.name.toLowerCase(), cover: song.cover?.name }];

const isLegitSetlist = (setlist: Setlist): setlist is LegitSetlist =>
  setlist.sets !== "" &&
  (Array.isArray(setlist.sets.set)
    ? setlist.sets.set.length > 0 && Array.isArray(setlist.sets.set[0].song)
      ? setlist.sets.set[0].song.length > 0
      : false
    : true);

export const getAggregatedSetlists = (setlists: Setlists): SetList => {
  const legitSets = setlists.setlist.filter(isLegitSetlist);

  if (legitSets.length === 0) {
    return {
      tracks: [],
      totalSetLists: 0,
      totalTracks: 0,
      to: null,
      from: null,
      encores: null,
    };
  }

  const songList = legitSets.flatMap(({ sets: { set } }) =>
    (Array.isArray(set)
      ? set.flatMap(({ song }: Set) => normaliseSongTitle(song))
      : normaliseSongTitle(set.song)
    ).filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.name === item.name),
    ),
  );

  const tracks = Object.entries<{
    count: number;
    cover?: string;
  }>(
    songList
      .filter(({ name }) => name !== "")
      .reduce(
        (
          acc: {
            [key: string]: {
              count: number;
              cover?: string;
            };
          },
          song,
        ) => ({
          ...acc,
          [song.name]: {
            cover: song.cover,
            count: (acc[song.name]?.count || 0) + 1,
          },
        }),
        {},
      ),
  )
    .sort((a, b) => b[1].count - a[1].count)
    .map(([title, { count, cover }]): Track => ({ title, count, cover }));

  const encoreCounts = JSONPath({
    json: setlists,
    path: "$..`@encore,encore",
  }).reduce((acc: Record<string, number>, item: string) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});

  return {
    tracks,
    totalSetLists: legitSets.length,
    totalTracks: tracks.reduce((acc, track) => acc + track.count, 0),
    to: legitSets?.[0].eventDate,
    from: legitSets?.[legitSets.length - 1].eventDate,
    encores: Object.keys(encoreCounts).length === 0 ? null : encoreCounts,
  };
};

import { JSONPath } from "jsonpath-plus";

import { SetList, Show, Track } from "types";

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

interface Venue {
  name: string;
  city?: { name: string };
}

interface FaultySetlist {
  sets: "";
}

interface LegitSetlist {
  artist?: { name: string };
  venue?: Venue;
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

const formatVenue = (venue?: Venue) =>
  venue ? [venue.name, venue.city?.name].filter(Boolean).join(", ") : undefined;

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

  const songList = legitSets.flatMap(({ sets: { set }, eventDate, venue }) => {
    const setArray = Array.isArray(set) ? set : [set];

    const encoreNames = new Set(
      setArray
        .filter((s) => Boolean(s["@encore"] ?? s.encore))
        .flatMap(({ song }: Set) =>
          normaliseSongTitle(song).map(({ name }) => name),
        ),
    );

    return setArray
      .flatMap(({ song }: Set) => normaliseSongTitle(song))
      .filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.name === item.name),
      )
      .map((song) => ({
        ...song,
        isEncore: encoreNames.has(song.name),
        show: { date: eventDate, venue: formatVenue(venue) } as Show,
      }));
  });

  const tracks = Object.entries<{
    count: number;
    cover?: string;
    isEncore: boolean;
    shows: Show[];
  }>(
    songList
      .filter(({ name }) => name !== "")
      .reduce(
        (
          acc: {
            [key: string]: {
              count: number;
              cover?: string;
              isEncore: boolean;
              shows: Show[];
            };
          },
          song,
        ) => ({
          ...acc,
          [song.name]: {
            cover: acc[song.name]?.cover ?? song.cover,
            count: (acc[song.name]?.count || 0) + 1,
            isEncore: acc[song.name]?.isEncore || song.isEncore,
            shows: [...(acc[song.name]?.shows ?? []), song.show],
          },
        }),
        {},
      ),
  )
    .sort((a, b) => b[1].count - a[1].count)
    .map(
      ([title, { count, cover, isEncore, shows }]): Track => ({
        title,
        count,
        cover,
        isEncore,
        shows,
      }),
    );

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

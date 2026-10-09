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
  tour?: { name: string };
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
  (Array.isArray(song) ? song : [song]).map(({ name, cover }: Song) => ({
    key: name.toLowerCase(),
    name,
    cover: cover?.name,
  }));

const formatVenue = (venue?: Venue) =>
  venue ? [venue.name, venue.city?.name].filter(Boolean).join(", ") : undefined;

const isLegitSetlist = (setlist: Setlist): setlist is LegitSetlist =>
  setlist.sets !== "" &&
  (Array.isArray(setlist.sets.set)
    ? setlist.sets.set.length > 0 && Array.isArray(setlist.sets.set[0].song)
      ? setlist.sets.set[0].song.length > 0
      : false
    : true);

const getSharedTour = (setlists: LegitSetlist[]) => {
  const tour = setlists[0].tour?.name;
  return tour && setlists.every((setlist) => setlist.tour?.name === tour)
    ? tour
    : null;
};

// Setlists arrive newest first, and so do the tours. A Map keeps that order
// even for tours named like numbers ("2024"), which objects would reorder.
const listTours = (setlists: LegitSetlist[]) => {
  const shows = new Map<string, number>();
  setlists.forEach(({ tour }) => {
    if (tour?.name) {
      shows.set(tour.name, (shows.get(tour.name) ?? 0) + 1);
    }
  });
  return Array.from(shows, ([name, count]) => ({ name, shows: count }));
};

export const getAggregatedSetlists = (
  setlists: Setlists,
  tour?: string,
): SetList => {
  const allLegitSets = setlists.setlist.filter(isLegitSetlist);
  const tours = listTours(allLegitSets);
  const legitSets = tour
    ? allLegitSets.filter((setlist) => setlist.tour?.name === tour)
    : allLegitSets;

  if (legitSets.length === 0) {
    return {
      tracks: [],
      totalSetLists: 0,
      totalTracks: 0,
      to: null,
      from: null,
      encores: null,
      tour: null,
      tours,
    };
  }

  const songList = legitSets.flatMap(({ sets: { set }, eventDate, venue }) => {
    const setArray = Array.isArray(set) ? set : [set];

    const encoreKeys = new Set(
      setArray
        .filter((s) => Boolean(s["@encore"] ?? s.encore))
        .flatMap(({ song }: Set) =>
          normaliseSongTitle(song).map(({ key }) => key),
        ),
    );

    const songs = setArray
      .flatMap(({ song }: Set) => normaliseSongTitle(song))
      .filter(
        (item, index, self) =>
          item.key !== "" &&
          index === self.findIndex((t) => t.key === item.key),
      );

    // Relative (0 = opener, 1 = closer) so shows of different lengths compare.
    return songs.map((song, index) => ({
      ...song,
      position: songs.length > 1 ? index / (songs.length - 1) : 0,
      isEncore: encoreKeys.has(song.key),
      show: { date: eventDate, venue: formatVenue(venue) } as Show,
    }));
  });

  const tracks = Object.values<{
    title: string;
    count: number;
    encoreCount: number;
    positionSum: number;
    cover?: string;
    shows: Show[];
  }>(
    songList.reduce(
      (
        acc: {
          [key: string]: {
            title: string;
            count: number;
            encoreCount: number;
            positionSum: number;
            cover?: string;
            shows: Show[];
          };
        },
        song,
      ) => ({
        ...acc,
        [song.key]: {
          title: acc[song.key]?.title ?? song.name,
          cover: acc[song.key]?.cover ?? song.cover,
          count: (acc[song.key]?.count || 0) + 1,
          encoreCount:
            (acc[song.key]?.encoreCount || 0) + (song.isEncore ? 1 : 0),
          positionSum: (acc[song.key]?.positionSum || 0) + song.position,
          shows: [...(acc[song.key]?.shows ?? []), song.show],
        },
      }),
      {},
    ),
  )
    .sort((a, b) => b.count - a.count)
    .map(
      ({ title, count, encoreCount, positionSum, cover, shows }): Track => ({
        title,
        count,
        cover,
        position: positionSum / count,
        // A song that closed one show out of twenty isn't an encore song.
        isEncore: encoreCount * 2 > count,
        shows,
      }),
    );

  // How many shows reached each encore number, so a show with two encores
  // counts towards both the first and the second.
  const encoreCounts = legitSets.reduce(
    (acc: Record<string, number>, { sets: { set } }) => {
      const encores = new Set(
        (Array.isArray(set) ? set : [set])
          .map((s) => s["@encore"] ?? s.encore)
          .filter(Boolean)
          .map(String),
      );
      encores.forEach((encore) => {
        acc[encore] = (acc[encore] || 0) + 1;
      });
      return acc;
    },
    {},
  );

  return {
    tracks,
    totalSetLists: legitSets.length,
    totalTracks: tracks.reduce((acc, track) => acc + track.count, 0),
    to: legitSets?.[0].eventDate,
    from: legitSets?.[legitSets.length - 1].eventDate,
    encores: Object.keys(encoreCounts).length === 0 ? null : encoreCounts,
    tour: getSharedTour(legitSets),
    tours,
  };
};

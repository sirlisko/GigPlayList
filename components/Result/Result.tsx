import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import classNames from "classnames";
import { ArrowLeft, Frown, TriangleAlert } from "lucide-react";

import Events from "components/Events/Events";
import Tracks from "components/Tracks/Tracks";

import SavePlaylist from "components/SavePlaylist/SavePlaylist";
import { useViewParams } from "components/Result/useViewParams";

import { useArtistData } from "services/artistData";
import { useTracks } from "services/tracks";
import { useEvents } from "services/events";
import { useGetArtist } from "services/searchArtist";
import { useMissingTracks } from "services/missingTracks";
import { matchSongs, resolveTrack } from "utils/matchSongs";
import {
  buildSetlistView,
  Order,
  playlistTracks,
  typicalSetLength,
} from "utils/setlistView";
import {
  calculatePlaylistDuration,
  describeEncores,
  formatGigDate,
  sanitiseDate,
} from "utils/labels";
import { BLACK, readableUnder, Rgb, WHITE } from "utils/colors";

interface Props {
  artistQuery: string[];
}

const ORDERS: [Order, string][] = [
  ["running", "Running order"],
  ["played", "Most played"],
];

// Mirrors `stage` in tailwind.config.js.
const STAGE: Rgb = [22, 25, 63];

const monthYear = (date: string | null) =>
  sanitiseDate(date)?.toLocaleDateString("en-gb", {
    month: "short",
    year: "numeric",
  });

const Result = ({ artistQuery }: Props) => {
  const {
    gig,
    setGig,
    tour,
    setTour,
    order,
    includeExtras,
    hideCovers,
    setOrder,
    setIncludeExtras,
    setHideCovers,
  } = useViewParams();
  const {
    artistData,
    isLoading: isLoadingArtist,
    isError: isErrorArtist,
    retry: retryArtist,
  } = useArtistData(artistQuery[0], artistQuery[1]);
  const {
    data,
    isLoading: isLoadingTracks,
    isError: isErrorTracks,
    retry: retryTracks,
  } = useTracks(artistQuery[0], artistQuery[1], tour);
  const { artist } = useGetArtist(artistQuery?.[1]);
  const { events } = useEvents(artistQuery[0]);

  const unmatchedTitles = useMemo(
    () =>
      artistData && data
        ? data.tracks
            .filter((track) => !resolveTrack(track, artistData.tracks))
            .map(({ title }) => title)
        : [],
    [artistData, data],
  );
  const { missingTracks, isLoading: isLoadingMissingTracks } = useMissingTracks(
    artistData?.name,
    unmatchedTitles,
  );

  const links = useMemo(
    () => [...(artistData?.tracks ?? []), ...(missingTracks ?? [])],
    [artistData?.tracks, missingTracks],
  );

  // The artist's darkest vivid colour lights the stage, darkened if needed so
  // white text on it stays readable.
  const stage = readableUnder(
    (artistData?.palette?.DarkVibrant?.rgb as Rgb) ?? STAGE,
    1,
    BLACK,
    WHITE,
  );
  const from = `rgb(${stage.join(",")})`;

  useEffect(() => {
    const initialBackground = document.body.style.background;
    return () => {
      document.body.style.background = initialBackground;
    };
  }, []);

  useEffect(() => {
    document.body.style.background = from;
  }, [from]);

  const filteredTracks = useMemo(
    () => data?.tracks.filter((track) => !hideCovers || !track.cover) ?? [],
    [data?.tracks, hideCovers],
  );

  const setLength = data ? typicalSetLength(data) : 0;

  const view = useMemo(
    () => buildSetlistView(filteredTracks, setLength, order),
    [filteredTracks, setLength, order],
  );

  const playlist = useMemo(
    () => playlistTracks(view, includeExtras),
    [view, includeExtras],
  );

  const songs = useMemo(() => matchSongs(playlist, links), [playlist, links]);

  const playlistDuration = useMemo(
    () => calculatePlaylistDuration(songs),
    [songs],
  );

  if (isLoadingArtist || isLoadingTracks) {
    return null;
  }

  const isErrorState = isErrorArtist || isErrorTracks;

  const isArtistiWithTrack =
    data?.tracks && data.tracks.length > 0 && artistData;

  const unmatchedCount = playlist.length - songs.length;

  const encores = data && describeEncores(data);

  const hasCovers = data?.tracks.some((track) => track.cover) ?? false;

  const selectedGig = events?.find(({ id }) => id === gig);

  const sheetTitle =
    order === "played"
      ? "Most played"
      : selectedGig
        ? `${selectedGig.venueName}, ${formatGigDate(selectedGig.date)}`
        : (data?.tour ?? "Running order");

  return (
    <article
      className="relative min-h-screen text-white"
      style={{
        backgroundColor: from,
        backgroundImage: `linear-gradient(to bottom, ${from} 0, ${from} 24rem, #000 100%)`,
      }}
    >
      {isArtistiWithTrack && artistData.image ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-96 overflow-hidden"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artistData.image}
            alt=""
            className="h-full w-full object-cover opacity-40"
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(${stage.join(",")},0.1), ${from})`,
            }}
          />
        </div>
      ) : null}

      <div className="relative mx-auto w-full max-w-2xl px-4 pb-16 pt-5 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          New search
        </Link>

        {isArtistiWithTrack ? (
          <>
            <header className="mt-28 sm:mt-36">
              <h1 className="display text-6xl sm:text-8xl">
                {artistData.name}
              </h1>
              <p className="mt-5 max-w-prose text-white/85">
                Likely setlist from{" "}
                <strong>{data.totalSetLists} recent concerts</strong>
                {data.tour ? (
                  <>
                    {" "}
                    on the <strong>{data.tour}</strong> tour
                  </>
                ) : null}
                , {monthYear(data.from)} to {monthYear(data.to)}. A typical show
                has {setLength} songs.
                {encores ? ` ${encores}.` : ""}
              </p>
              {artist?.["life-span"].ended && (
                <p className="mt-4 flex max-w-prose gap-2 text-sm text-white/85">
                  <TriangleAlert
                    size={18}
                    className="shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    This artist stopped performing in{" "}
                    {new Date(artist["life-span"].end).toLocaleDateString(
                      "en-gb",
                      { year: "numeric", month: "long" },
                    )}
                    , so these setlists may be out of date.
                  </span>
                </p>
              )}
            </header>

            {events && (
              <Events events={events} selectedGig={gig} onSelectGig={setGig} />
            )}

            <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm">
              <div
                role="group"
                aria-label="Sort songs"
                className="inline-flex rounded-full bg-black/35 p-1"
              >
                {ORDERS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={order === value}
                    onClick={() => setOrder(value)}
                    className={classNames(
                      "rounded-full px-3 py-1.5 transition-colors",
                      order === value
                        ? "bg-white text-black"
                        : "text-white/80 hover:text-white",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {data.tours.length > 1 && (
                <label className="flex items-center gap-2">
                  <span className="text-white/80">Shows from</span>
                  <select
                    value={tour ?? ""}
                    onChange={(e) => setTour(e.target.value || undefined)}
                    className="rounded-full bg-black/35 px-3 py-1.5"
                  >
                    <option value="">All recent shows</option>
                    {data.tours.map(({ name, shows }) => (
                      <option key={name} value={name}>
                        {name} ({shows} {shows === 1 ? "show" : "shows"})
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {hasCovers && (
                <label className="flex cursor-pointer items-center gap-2 text-white/85">
                  <input
                    type="checkbox"
                    checked={hideCovers}
                    onChange={(e) => setHideCovers(e.target.checked)}
                  />
                  Only songs by {artistData.name}
                </label>
              )}
            </div>
            <p className="mb-8 mt-3 text-sm text-white/70">
              The highlight shows how many of the {data.totalSetLists} shows
              each song was played at.
            </p>

            <Tracks
              sheetTitle={sheetTitle}
              main={view.main}
              encore={view.encore}
              extras={view.extras}
              extrasHeading={
                <div className="mb-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h2 className="text-lg font-semibold">Sometimes played</h2>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={includeExtras}
                        onChange={(e) => setIncludeExtras(e.target.checked)}
                      />
                      Add these {view.extras.length} to the playlist
                    </label>
                  </div>
                  <p className="text-sm text-white/70">
                    Not part of a typical night, but they turned up at some
                    shows.
                  </p>
                </div>
              }
              totalShows={data.totalSetLists}
              links={links}
              palette={artistData?.palette}
            />
          </>
        ) : isErrorState ? (
          <div className="mt-32 flex flex-col items-start gap-4">
            <TriangleAlert size={48} aria-hidden="true" />
            <h1 className="display break-words text-5xl">
              {artistQuery[0]} didn&apos;t load
            </h1>
            <p className="text-white/80">
              One of the music services didn&apos;t answer. Try again, or search
              for someone else.
            </p>
            <div className="flex gap-4">
              <button
                className="rounded-full bg-white px-5 py-2.5 font-semibold text-black"
                onClick={() => {
                  retryArtist?.();
                  retryTracks?.();
                }}
              >
                Try again
              </button>
              <Link
                href="/"
                className="self-center underline underline-offset-4"
              >
                Search another artist
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-32 flex flex-col items-start gap-4">
            <Frown size={48} aria-hidden="true" />
            <h1 className="display break-words text-5xl">
              No setlists for {artistQuery[0]}
            </h1>
            <p className="text-white/80">
              setlist.fm has no recent shows for this artist, so there&apos;s
              nothing to build a playlist from yet.
            </p>
            <Link href="/" className="underline underline-offset-4">
              Search another artist
            </Link>
          </div>
        )}
      </div>

      {isArtistiWithTrack && songs.length > 0 ? (
        <SavePlaylist
          gig={selectedGig}
          artistData={artistData}
          songs={songs}
          duration={playlistDuration || undefined}
          unmatchedCount={unmatchedCount}
          ready={!isLoadingMissingTracks}
        />
      ) : null}
    </article>
  );
};

export default Result;

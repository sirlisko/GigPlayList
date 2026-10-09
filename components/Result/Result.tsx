import React, { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import classNames from "classnames";
import { ArrowLeft, Frown, TriangleAlert } from "lucide-react";

import Events from "components/Events/Events";
import Tracks, { TrackSection } from "components/Tracks/Tracks";

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
  generateEncoreLabel,
  sanitiseDate,
} from "utils/labels";

interface Props {
  artistQuery: string[];
}

const ORDERS: [Order, string][] = [
  ["running", "Running order"],
  ["played", "Most played"],
];

const SectionHeading = ({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) => (
  <div className="mb-2 flex items-center gap-3">
    <h2 className="text-sm font-semibold opacity-80">{children}</h2>
    <div className="flex-1 border-t border-white/20" />
    {action}
  </div>
);

const Result = ({ artistQuery }: Props) => {
  const [initialBaground] = useState<string>(document.body.style.background);
  const {
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

  const darkVibrantRgb = artistData?.palette?.DarkVibrant?.rgb ?? [0, 0, 0];
  const from = `rgba(${darkVibrantRgb.join(",")},100)`;

  useEffect(() => {
    return () => {
      document.body.style.background = initialBaground;
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

  const encoreLabel = data && generateEncoreLabel(data);

  const hasCovers = data?.tracks.some((track) => track.cover) ?? false;

  const sections: TrackSection[] = [
    { id: "main", tracks: view.main },
    {
      id: "encore",
      heading: <SectionHeading>Encore</SectionHeading>,
      tracks: view.encore,
      isEncore: true,
    },
    {
      id: "extras",
      heading: (
        <SectionHeading
          action={
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={includeExtras}
                onChange={(e) => setIncludeExtras(e.target.checked)}
              />
              Add to playlist
            </label>
          }
        >
          Sometimes played
        </SectionHeading>
      ),
      tracks: view.extras,
    },
  ].filter(({ tracks }) => tracks.length > 0);

  return (
    <article
      className="min-h-screen bg-gradient-to-b to-black text-white p-6"
      style={
        {
          "--tw-gradient-from": from,
          "--tw-gradient-stops": `var(--tw-gradient-from), var(--tw-gradient-to)`,
        } as React.CSSProperties
      }
    >
      <div className="w-full max-w-2xl mx-auto">
        <header className="flex justify-between items-center mb-6">
          <Link
            href="/"
            className="text-white hover:text-gray-300"
            aria-label="Go to homepage"
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl font-bold">
            {isArtistiWithTrack && artistData?.name}
          </h1>
          <div className="w-6"></div>
        </header>
        {isArtistiWithTrack ? (
          <>
            <picture>
              <img
                src={artistData?.image}
                alt={artistData?.name}
                className="w-32 h-32 mx-auto mb-4 rounded-lg shadow-lg"
              />
            </picture>

            {events && <Events events={events} />}

            {artist?.["life-span"].ended && (
              <div className="bg-black bg-opacity-30 rounded-lg p-4 mb-6">
                <h2 className="text-xl font-semibold mb-2 flex gap-1">
                  <TriangleAlert /> Important notice
                </h2>
                <p>
                  Data may be inaccurate as this artist or band stopped
                  performing on{" "}
                  <strong>
                    {new Date(artist["life-span"].end).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "long",
                      },
                    )}
                  </strong>
                  .
                </p>
              </div>
            )}

            {songs && songs.length > 0 ? (
              <>
                <div className="bg-black bg-opacity-30 rounded-lg p-4 mb-6">
                  <p className="mb-3">
                    Generated from <strong>{data.totalTracks} songs</strong>{" "}
                    across <strong>{data.totalSetLists} recent concerts</strong>
                    {data.tour ? (
                      <>
                        {" "}
                        on the <strong>{data.tour}</strong> tour
                      </>
                    ) : null}{" "}
                    (
                    {sanitiseDate(data.from)?.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                    })}{" "}
                    to{" "}
                    {sanitiseDate(data.to)?.toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                    })}
                    )
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <strong className="block">Avg songs/concert</strong>
                      {setLength}
                    </div>
                    <div>
                      <strong className="block">In your playlist</strong>
                      {songs.length}
                    </div>
                    {encoreLabel ? (
                      <div className="col-span-2">{encoreLabel}</div>
                    ) : null}
                    {playlistDuration ? (
                      <div className="col-span-2">
                        <strong>Estimated playtime</strong>: {playlistDuration}
                      </div>
                    ) : null}
                    {unmatchedCount > 0 ? (
                      <div className="col-span-2 text-xs opacity-60">
                        {unmatchedCount} setlist song
                        {unmatchedCount === 1 ? "" : "s"} couldn&apos;t be
                        matched on Spotify.
                      </div>
                    ) : null}
                  </div>
                </div>
                <SavePlaylist
                  artistData={artistData}
                  songs={songs}
                  ready={!isLoadingMissingTracks}
                />
              </>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-sm">
              <div
                role="group"
                aria-label="Sort songs"
                className="inline-flex rounded-full bg-black/30 p-1"
              >
                {ORDERS.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={order === value}
                    onClick={() => setOrder(value)}
                    className={classNames(
                      "rounded-full px-3 py-1 transition-colors",
                      order === value
                        ? "bg-white text-black"
                        : "opacity-80 hover:opacity-100",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {data.tours.length > 1 && (
                <label className="flex items-center gap-2">
                  <span className="opacity-80">Shows from</span>
                  <select
                    value={tour ?? ""}
                    onChange={(e) => setTour(e.target.value || undefined)}
                    className="rounded-full bg-black/30 px-3 py-1"
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
                <label className="flex items-center gap-2 cursor-pointer opacity-90">
                  <input
                    type="checkbox"
                    checked={hideCovers}
                    onChange={(e) => setHideCovers(e.target.checked)}
                  />
                  Only songs by {artistData.name}
                </label>
              )}
            </div>

            <Tracks
              sections={sections}
              totalShows={data.totalSetLists}
              links={links}
              palette={artistData?.palette}
            />
          </>
        ) : isErrorState ? (
          <div className="flex flex-col items-center">
            <div className="m-auto text-center text-2xl p-3">
              <TriangleAlert height={100} width={100} />
            </div>
            <div className="w-full break-words text-center text-2xl p-3">
              Something went wrong loading <b>{artistQuery[0]}</b>
            </div>
            <button
              className="mt-2 px-6 py-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
              onClick={() => {
                retryArtist?.();
                retryTracks?.();
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              className="mt-4 text-sm underline opacity-75 hover:opacity-100"
            >
              Search another artist
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="m-auto text-center text-2xl p-3">
              <Frown height={100} width={100} />
            </div>
            <div className="w-full break-words text-center text-2xl p-3">
              No setlists found for <b>{artistQuery[0]}</b>
            </div>
            <Link
              href="/"
              className="mt-2 text-sm underline opacity-75 hover:opacity-100"
            >
              Search another artist
            </Link>
          </div>
        )}
      </div>
    </article>
  );
};

export default Result;

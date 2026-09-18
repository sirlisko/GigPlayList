import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Frown, TriangleAlert } from "lucide-react";

import Events from "components/Events/Events";
import Tracks from "components/Tracks/Tracks";

import SavePlaylist from "components/SavePlaylist/SavePlaylist";

import { useArtistData } from "services/artistData";
import { useTracks } from "services/tracks";
import { useEvents } from "services/events";
import { useGetArtist } from "services/searchArtist";
import { matchSongs } from "utils/matchSongs";
import {
  calculatePlaylistDuration,
  generateEncoreLabel,
  sanitiseDate,
} from "utils/labels";

interface Props {
  artistQuery: string[];
}

const Result = ({ artistQuery }: Props) => {
  const [initialBaground] = useState<string>(document.body.style.background);
  const {
    artistData,
    isLoading: isLoadingArtist,
    isError: isErrorArtist,
    retry: retryArtist,
  } = useArtistData(artistQuery[0]);
  const {
    data,
    isLoading: isLoadingTracks,
    isError: isErrorTracks,
    retry: retryTracks,
  } = useTracks(artistQuery[0], artistQuery[1]);
  const { artist } = useGetArtist(artistQuery?.[1]);
  const { events } = useEvents(artistQuery[0]);

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

  if (isLoadingArtist || isLoadingTracks) {
    return null;
  }

  const isErrorState = isErrorArtist || isErrorTracks;

  const isArtistiWithTrack =
    data?.tracks && data.tracks.length > 0 && artistData;

  const songs =
    artistData?.tracks && data?.tracks
      ? matchSongs(data.tracks, artistData.tracks)
      : [];

  const playlistDuration = calculatePlaylistDuration(songs);
  const encoreLabel = data && generateEncoreLabel(data);

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
          <Link href="/" passHref>
            <button
              className="text-white hover:text-gray-300"
              aria-label="Go to homepage"
            >
              <ArrowLeft size={24} />
            </button>
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
                  <p>
                    Generated from <strong>{data.totalTracks} songs</strong>{" "}
                    across <strong>{data.totalSetLists} recent concerts</strong>{" "}
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
                  <p className="mt-2">
                    <strong>Average songs per concert</strong>:{" "}
                    {Math.round(data.totalTracks / data.totalSetLists)}
                  </p>
                  <p>{encoreLabel ? <p>{encoreLabel}</p> : null}</p>
                  <p className="mt-2">
                    <strong>{songs.length}</strong> most likely songs to be
                    played, based on performance frequency
                  </p>

                  {playlistDuration ? (
                    <p>
                      Estimated playtime: <strong>{playlistDuration}</strong>
                    </p>
                  ) : null}
                </div>
                <SavePlaylist artistData={artistData} songs={songs} />
              </>
            ) : null}

            <Tracks
              tracks={data.tracks}
              links={artistData?.tracks}
              palette={artistData?.palette}
            />
          </>
        ) : isErrorState ? (
          <div className="flex flex-col">
            <div className="m-auto text-center text-2xl p-3">
              <TriangleAlert height={100} width={100} />
            </div>
            <div className="w-full break-words m-auto text-center text-2xl p-3">
              Something went wrong loading <b>{artistQuery[0]}</b>
            </div>
            <button
              className="mt-2 mx-auto px-6 py-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
              onClick={() => {
                retryArtist?.();
                retryTracks?.();
              }}
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="m-auto text-center text-2xl p-3">
              <Frown height={100} width={100} />
            </div>
            <div className="w-full break-words m-auto text-center text-2xl p-3">
              No setlists found for <b>{artistQuery[0]}</b>
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

export default Result;

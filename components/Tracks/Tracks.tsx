import React, { useEffect, useState } from "react";

import { Track, Link, ArtistData, Show } from "types";
import { resolveTrack } from "utils/matchSongs";
import { sanitiseDate } from "utils/labels";

import { Disc3 as Disc, X } from "lucide-react";
import SpotifyLogo from "components/Icons/Spotify";
import PauseIcon from "components/Icons/Pause";
import PlayIcon from "components/Icons/Play";
import { useRouter } from "next/router";

interface TracksProps {
  tracks: Track[];
  links?: Link[];
  palette?: ArtistData["palette"];
}

const Tracks = ({ tracks, links, palette }: TracksProps) => {
  const [loaded, setLoaded] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<{
    title: string;
    shows: Show[];
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!selectedTrack) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedTrack(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedTrack]);

  const handlePreview = (audioUrl: string | undefined, title: string) => {
    if (!audioUrl) return;
    if (audio) {
      audio.pause();
      setAudio(null);
    }
    if (currentTrack === title) {
      setCurrentTrack(null);
    } else {
      const newAudio = new Audio(audioUrl);
      newAudio.play();
      newAudio.addEventListener("ended", () => setCurrentTrack(null));
      setAudio(newAudio);
      setCurrentTrack(title);
    }
  };

  useEffect(() => {
    const handleRouteChange = () => {
      if (audio) {
        audio.pause();
        setAudio(null);
        setCurrentTrack(null);
      }
    };
    router.events.on("routeChangeStart", handleRouteChange);
    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
    };
  }, [router.events, audio]);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 1);
  }, []);

  const vibrantRgb = palette?.Vibrant?.rgb ?? [255, 255, 255];
  const darkVibrantRgb = palette?.DarkVibrant?.rgb ?? [0, 0, 0];

  const getGradientStyle = (count: number, maxCount: number) => {
    const intensity = (count / maxCount) * 100;
    return {
      background: `linear-gradient(90deg, rgba(${vibrantRgb.join(",")},${intensity / 100}) 0%, rgba(0,0,0,0) 100%)`,
      transition: "all 1s ease-out",
      opacity: loaded ? 1 : 0,
      transform: `translateX(${loaded ? "0" : "-20px"})`,
    };
  };

  const customStyle = {
    "--custom-bg-color": `rgba(${darkVibrantRgb.join(",")}, 1)`,
  } as React.CSSProperties;

  return (
    <>
      <ul role="list" className="space-y-2">
        {tracks.map((track) => {
          const { count, title, cover, isEncore, shows } = track;
          const link = resolveTrack(track, links ?? []);
          const isPlaying = currentTrack === title;
          return (
            <li
              key={title}
              style={getGradientStyle(count, tracks[0].count)}
              className="group relative flex items-center space-between justify-between rounded p-3 transition-all"
            >
              <div className="pl-12 flex items-center">
                <div className="absolute left-0 top-0 h-full">
                  {link?.cover ? (
                    <picture>
                      <img
                        src={link.cover}
                        alt={`${title} album cover`}
                        className="w-12 object-cover rounded h-full"
                      />
                    </picture>
                  ) : (
                    <div
                      className="w-12 flex items-center justify-center rounded h-full"
                      style={{
                        background: `rgba(${vibrantRgb.join(",")}, 255)`,
                      }}
                    >
                      <Disc size={24} className="text-gray-500" />{" "}
                    </div>
                  )}
                </div>
                {link?.previewUrl && (
                  <button
                    onClick={() => handlePreview(link.previewUrl, title)}
                    className={`absolute left-0 top-0 h-full p-3 rounded-full
                              bg-transparent
                              opacity-100 md:opacity-0 group-hover:opacity-100
                              transition-opacity duration-300
                              md:group-hover:bg-black/50
                              md:hover:!bg-[color:var(--custom-bg-color)] hover:opacity-100`}
                    aria-pressed={isPlaying}
                    aria-label={isPlaying ? "Pause" : "Play"}
                    style={{
                      ...customStyle,
                      opacity: isPlaying ? 1 : undefined,
                    }}
                  >
                    {isPlaying ? (
                      <PauseIcon stroke={`rgb(${darkVibrantRgb.join(",")}`} />
                    ) : (
                      <PlayIcon stroke={`rgb(${darkVibrantRgb.join(",")}`} />
                    )}
                  </button>
                )}
                <div className="flex flex-col md:flex-row md:items-baseline">
                  <span className="font-medium">{title}</span>
                  {cover && (
                    <span className="md:ml-1 text-sm opacity-75">
                      (cover of <span className="italic">{cover}</span>)
                    </span>
                  )}
                  {isEncore && (
                    <span className="md:ml-1 text-sm opacity-75">(encore)</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {link?.uri && (
                  <a href={link.uri} aria-label="Open song in Spotify">
                    <SpotifyLogo />
                  </a>
                )}
                {shows.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedTrack({ title, shows })}
                    className="text-sm opacity-75 hover:opacity-100 underline decoration-dotted underline-offset-2"
                  >
                    <span className="hidden md:inline">Played </span>
                    <span className="whitespace-nowrap">{count} times</span>
                  </button>
                ) : (
                  <div className="text-sm opacity-75">
                    <span className="hidden md:inline">Played </span>
                    <span className="whitespace-nowrap">{count} times</span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {selectedTrack && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Shows where "${selectedTrack.title}" was played`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedTrack(null)}
        >
          <div
            className="w-full max-w-sm max-h-[80vh] overflow-y-auto rounded-lg bg-neutral-900 p-4 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium">{selectedTrack.title}</h2>
              <button
                type="button"
                onClick={() => setSelectedTrack(null)}
                aria-label="Close"
                className="opacity-75 hover:opacity-100"
              >
                <X size={18} />
              </button>
            </div>
            <ul className="space-y-1 text-sm opacity-90">
              {selectedTrack.shows.map(({ date, venue }, index) => (
                <li key={index}>
                  {sanitiseDate(date)?.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  {venue ? ` — ${venue}` : ""}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {currentTrack && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 max-w-[90vw] truncate rounded-full bg-black/80 px-4 py-2 text-sm text-white shadow-lg backdrop-blur"
        >
          Now playing: {currentTrack}
        </div>
      )}
    </>
  );
};

export default Tracks;

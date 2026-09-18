import React, { useEffect, useState } from "react";

import { Track, Link, ArtistData } from "types";
import { isSameSong } from "utils/matchSongs";

import { Disc3 as Disc } from "lucide-react";
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
  const router = useRouter();

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
    <ul role="list" className="space-y-2">
      {tracks.map(({ count, title, cover }) => {
        const link = links?.find((link) => isSameSong(link.title, title));
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
                  style={{ ...customStyle, opacity: isPlaying ? 1 : undefined }}
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
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {link?.uri && (
                <a href={link.uri} aria-label="Open song in Spotify">
                  <SpotifyLogo />
                </a>
              )}
              <div className="text-sm opacity-75">
                <span className="hidden md:inline">Played </span>
                <span className="whitespace-nowrap">{count} times</span>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default Tracks;

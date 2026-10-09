import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import classNames from "classnames";
import { Pause, Play, X } from "lucide-react";

import { Track, Link, ArtistData, Show } from "types";
import { resolveTrack } from "utils/matchSongs";
import { sanitiseDate } from "utils/labels";
import { readableUnder, Rgb } from "utils/colors";

import Sheet, { EncoreBreak, PAPER, INK } from "components/Tracks/Sheet";

interface TracksProps {
  sheetTitle: ReactNode;
  main: Track[];
  encore: Track[];
  extras: Track[];
  extrasHeading: ReactNode;
  totalShows: number;
  links?: Link[];
  palette?: ArtistData["palette"];
}

const HIGHLIGHTER_ALPHA = 0.6;
const DEFAULT_HIGHLIGHTER: Rgb = [242, 227, 92];

interface SelectedTrack {
  title: string;
  shows: Show[];
  uri?: string;
}

const Tracks = ({
  sheetTitle,
  main,
  encore,
  extras,
  extrasHeading,
  totalShows,
  links,
  palette,
}: TracksProps) => {
  const [loaded, setLoaded] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<SelectedTrack | null>(
    null,
  );
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
    // Shallow changes only update the view params; the page stays put.
    const handleRouteChange = (
      _url: string,
      { shallow }: { shallow: boolean },
    ) => {
      if (audio && !shallow) {
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

  const highlighter = readableUnder(
    (palette?.Vibrant?.rgb as Rgb) ?? DEFAULT_HIGHLIGHTER,
    HIGHLIGHTER_ALPHA,
    PAPER,
    INK,
  );

  const share = (count: number) => (loaded ? (count / totalShows) * 100 : 0);

  const renderRow = (
    track: Track,
    index: number,
    variant: "sheet" | "stage",
  ) => {
    const { count, title, cover, isEncore, shows } = track;
    const link = resolveTrack(track, links ?? []);
    const isPlaying = currentTrack === title;
    const onSheet = variant === "sheet";
    return (
      <li
        key={title}
        className={classNames("flex items-center gap-3", {
          "py-1.5": onSheet,
          "py-2 border-b border-white/10": !onSheet,
        })}
      >
        {onSheet && (
          <span
            aria-hidden="true"
            className="w-7 shrink-0 text-right font-marker text-ink/45"
          >
            {index + 1}
          </span>
        )}
        <div className="relative min-w-0 flex-1">
          <span
            aria-hidden="true"
            className={classNames(
              "absolute left-0 transition-[width] duration-1000 ease-out",
              onSheet
                ? "inset-y-[18%] -skew-x-6 rounded-[3px]"
                : "-bottom-1 h-0.5 rounded-full bg-white/30",
            )}
            style={{
              width: `${share(count)}%`,
              ...(onSheet && {
                backgroundColor: `rgba(${highlighter.join(",")},${HIGHLIGHTER_ALPHA})`,
              }),
            }}
          />
          <span
            className={classNames(
              "relative",
              onSheet ? "font-marker text-lg sm:text-xl leading-snug" : "",
            )}
          >
            {title}
          </span>
          {cover && (
            <span
              className={classNames(
                "relative ml-2 text-sm",
                onSheet ? "text-ink/70" : "text-white/65",
              )}
            >
              cover of <span className="italic">{cover}</span>
            </span>
          )}
          {isEncore && !onSheet && (
            <span className="relative ml-2 text-sm text-white/65">
              usually an encore
            </span>
          )}
          {!link && (
            <span
              className={classNames(
                "relative ml-2 text-xs",
                onSheet ? "text-ink/60" : "text-white/55",
              )}
            >
              not on Spotify
            </span>
          )}
        </div>
        {link?.previewUrl && (
          <button
            type="button"
            onClick={() => handlePreview(link.previewUrl, title)}
            aria-pressed={isPlaying}
            aria-label={`${isPlaying ? "Pause" : "Play"} a preview of ${title}`}
            className={classNames(
              "grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors",
              onSheet
                ? "border-ink/30 text-ink hover:bg-ink hover:text-paper"
                : "border-white/30 hover:bg-white hover:text-black",
              {
                "bg-ink text-paper": isPlaying && onSheet,
                "bg-white text-black": isPlaying && !onSheet,
              },
            )}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
        )}
        <button
          type="button"
          onClick={() => setSelectedTrack({ title, shows, uri: link?.uri })}
          className={classNames(
            "shrink-0 whitespace-nowrap text-sm tabular-nums underline decoration-dotted underline-offset-4",
            onSheet ? "text-ink/70 hover:text-ink" : "text-white/70",
          )}
          aria-label={`${title}: played at ${count} of ${totalShows} shows. See which.`}
        >
          {count}/{totalShows}
        </button>
      </li>
    );
  };

  return (
    <>
      <Sheet title={sheetTitle}>
        <ol>{main.map((track, index) => renderRow(track, index, "sheet"))}</ol>
        {encore.length > 0 && (
          <>
            <EncoreBreak />
            <ol>
              {encore.map((track, index) =>
                renderRow(track, main.length + index, "sheet"),
              )}
            </ol>
          </>
        )}
      </Sheet>

      {extras.length > 0 && (
        <section className="mt-12">
          {extrasHeading}
          <ul role="list">
            {extras.map((track, index) => renderRow(track, index, "stage"))}
          </ul>
        </section>
      )}

      {selectedTrack && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Shows where "${selectedTrack.title}" was played`}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
          onClick={() => setSelectedTrack(null)}
        >
          <div
            className="sheet w-full max-w-sm max-h-[80vh] overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <h2 className="font-marker text-xl leading-tight">
                {selectedTrack.title}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedTrack(null)}
                aria-label="Close"
                className="text-ink/60 hover:text-ink"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mb-3 text-sm text-ink/70">
              Played at {selectedTrack.shows.length} of {totalShows} recent
              shows:
            </p>
            <ul className="space-y-1.5 text-sm">
              {selectedTrack.shows.map(({ date, venue }, index) => (
                <li key={index} className="flex gap-3">
                  <span className="w-24 shrink-0 tabular-nums text-ink/60">
                    {sanitiseDate(date)?.toLocaleDateString("en-gb", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span>{venue}</span>
                </li>
              ))}
            </ul>
            {selectedTrack.uri && (
              <a
                href={selectedTrack.uri}
                className="mt-4 inline-block text-sm font-semibold underline underline-offset-4"
              >
                Open the song in Spotify
              </a>
            )}
          </div>
        </div>
      )}
      {currentTrack && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 max-w-[90vw] truncate rounded-full bg-black/85 px-4 py-2 text-sm text-white shadow-lg backdrop-blur"
        >
          Now playing a preview of {currentTrack}
        </div>
      )}
    </>
  );
};

export default Tracks;

import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import classNames from "classnames";
import { ChevronDown, Pause, Play, X } from "lucide-react";

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
  onPlayingChange?: (title: string | null) => void;
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
  onPlayingChange,
}: TracksProps) => {
  const [loaded, setLoaded] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<SelectedTrack | null>(
    null,
  );
  const [showExtras, setShowExtras] = useState(false);
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

  useEffect(() => {
    onPlayingChange?.(currentTrack);
  }, [currentTrack, onPlayingChange]);

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
        className={classNames("group flex items-center gap-3", {
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
        <div
          className={classNames(
            "relative min-w-0 flex-1",
            onSheet && "font-marker text-lg leading-snug sm:text-xl",
          )}
        >
          {/* Sized in em so a title that wraps keeps one stroke on its
              first line instead of a block across both. */}
          <span
            aria-hidden="true"
            className={classNames(
              "absolute left-0 transition-[width] duration-1000 ease-out",
              onSheet
                ? "top-[0.24em] h-[0.9em] -skew-x-6 rounded-[3px]"
                : "-bottom-1 h-0.5 rounded-full bg-white/30",
            )}
            style={{
              width: `${share(count)}%`,
              ...(onSheet && {
                backgroundColor: `rgba(${highlighter.join(",")},${HIGHLIGHTER_ALPHA})`,
              }),
            }}
          />
          <span className="relative">{title}</span>
          {cover && (
            <span
              className={classNames(
                "relative ml-2 font-sans text-sm",
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
        </div>
        {link?.previewUrl ? (
          <button
            type="button"
            onClick={() => handlePreview(link.previewUrl, title)}
            aria-pressed={isPlaying}
            aria-label={`${isPlaying ? "Pause" : "Play"} a preview of ${title}`}
            className={classNames(
              "reveal-on-hover grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors",
              onSheet
                ? "text-ink/60 hover:bg-ink hover:text-paper"
                : "text-white/70 hover:bg-white hover:text-black",
              {
                "bg-ink text-paper": isPlaying && onSheet,
                "bg-white text-black": isPlaying && !onSheet,
              },
            )}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
        ) : (
          !link && (
            <span
              className={classNames(
                "shrink-0 whitespace-nowrap text-xs",
                onSheet ? "text-ink/55" : "text-white/55",
              )}
            >
              not on Spotify
            </span>
          )
        )}
        <button
          type="button"
          onClick={() => setSelectedTrack({ title, shows, uri: link?.uri })}
          className={classNames(
            "shrink-0 whitespace-nowrap text-sm tabular-nums underline decoration-dotted underline-offset-4",
            onSheet
              ? "text-ink/60 decoration-ink/30 hover:text-ink"
              : "text-white/70 decoration-white/30 hover:text-white",
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
          <button
            type="button"
            aria-expanded={showExtras}
            aria-controls="extras"
            onClick={() => setShowExtras(!showExtras)}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-white/85 underline underline-offset-4 hover:text-white"
          >
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={classNames("transition-transform", {
                "rotate-180": showExtras,
              })}
            />
            {showExtras
              ? "Hide them"
              : `Show the ${extras.length} ${extras.length === 1 ? "song" : "songs"}`}
          </button>
          {showExtras && (
            <ul id="extras" role="list" className="mt-2">
              {extras.map((track, index) => renderRow(track, index, "stage"))}
            </ul>
          )}
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
    </>
  );
};

export default Tracks;

import React from "react";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { artistDataKey, tracksKey } from "services/keys";
import { ArtistData, SetList } from "types";
import { readableUnderWhite, Rgb } from "utils/colors";
import { buildSetlistView, typicalSetLength } from "utils/setlistView";

export const config = { runtime: "edge" };

const SONGS_SHOWN = 8;
const BAR_ALPHA = 0.55;

const fetchJson = async <T,>(url: string): Promise<T | undefined> => {
  try {
    const response = await fetch(url);
    return response.ok ? ((await response.json()) as T) : undefined;
  } catch {
    return undefined;
  }
};

const rgb = (color: Rgb, alpha = 1) => `rgba(${color.join(",")},${alpha})`;

const handler = async (req: NextRequest) => {
  const { searchParams, origin } = new URL(req.url);
  const artist = searchParams.get("artist");
  const id = searchParams.get("id") ?? undefined;
  if (!artist) {
    return new Response("Missing artist", { status: 400 });
  }

  // Both endpoints are CDN-cached, so this rarely reaches the upstream APIs.
  const [artistData, setList] = await Promise.all([
    fetchJson<ArtistData>(`${origin}${artistDataKey(artist, id)}`),
    fetchJson<SetList>(`${origin}${tracksKey(artist, id)}`),
  ]);

  const name = artistData?.name ?? artist;
  const background = (artistData?.palette?.DarkVibrant?.rgb ?? [
    24, 24, 27,
  ]) as Rgb;
  const bar = readableUnderWhite(
    (artistData?.palette?.Vibrant?.rgb ?? [255, 255, 255]) as Rgb,
    BAR_ALPHA,
    background,
  );
  const songs = setList
    ? (() => {
        const view = buildSetlistView(
          setList.tracks,
          typicalSetLength(setList),
          "running",
        );
        return [...view.main, ...view.encore].slice(0, SONGS_SHOWN);
      })()
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: 56,
          gap: 48,
          color: "white",
          backgroundImage: `linear-gradient(160deg, ${rgb(background)} 0%, #000 100%)`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 300 }}>
          {artistData?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artistData.image}
              width={300}
              height={300}
              style={{ borderRadius: 16, objectFit: "cover" }}
              alt=""
            />
          ) : null}
          <div
            style={{
              display: "flex",
              marginTop: "auto",
              fontSize: 24,
              opacity: 0.7,
            }}
          >
            gigplaylist.sirlisko.com
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              opacity: 0.75,
              marginTop: 12,
              marginBottom: 28,
            }}
          >
            {setList && setList.totalSetLists > 0
              ? `Likely setlist from ${setList.totalSetLists} recent shows`
              : "What they play live"}
          </div>
          {songs.map((song, index) => (
            <div
              key={song.title}
              style={{
                display: "flex",
                position: "relative",
                alignItems: "center",
                justifyContent: "space-between",
                height: 44,
                marginBottom: 6,
                padding: "0 14px",
                borderRadius: 6,
                fontSize: 24,
                backgroundColor: "rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 6,
                  width: `${(song.count / (setList?.totalSetLists || 1)) * 100}%`,
                  backgroundColor: rgb(bar, BAR_ALPHA),
                }}
              />
              <div style={{ display: "flex", gap: 14 }}>
                <span style={{ opacity: 0.6, width: 28 }}>{index + 1}</span>
                <span>{song.title}</span>
              </div>
              <span style={{ opacity: 0.8, fontSize: 20 }}>
                {`${song.count} of ${setList?.totalSetLists}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
};

export default handler;

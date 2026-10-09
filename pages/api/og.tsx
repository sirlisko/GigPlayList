import React from "react";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import { artistDataKey, tracksKey } from "services/keys";
import { ArtistData, SetList, Track } from "types";
import { BLACK, readableUnder, Rgb, WHITE } from "utils/colors";
import { tourName } from "utils/labels";
import { buildSetlistView, typicalSetLength } from "utils/setlistView";
import { INK, PAPER } from "components/Tracks/Sheet";

export const config = { runtime: "edge" };

// Mirrors `stage`, `tape` and `highlighter` in tailwind.config.js.
const STAGE: Rgb = [37, 35, 32];
const TAPE = "rgba(255,61,139,0.92)";
const HIGHLIGHTER: Rgb = [242, 227, 92];
const HIGHLIGHTER_ALPHA = 0.6;

// Satori can't read variable fonts, so these are fixed instances of the
// site's faces: Archivo at the display width, and Permanent Marker.
// The bundler only picks up `new URL` with a literal path.
const fonts = Promise.all(
  (
    [
      [
        new URL(
          "../../assets/fonts/Archivo-ExtraCondensed-ExtraBold.ttf",
          import.meta.url,
        ),
        "Archivo Display",
        800,
      ],
      [
        new URL("../../assets/fonts/Archivo-Regular.ttf", import.meta.url),
        "Archivo",
        400,
      ],
      [
        new URL("../../assets/fonts/Archivo-SemiBold.ttf", import.meta.url),
        "Archivo",
        600,
      ],
      [
        new URL(
          "../../assets/fonts/PermanentMarker-Regular.ttf",
          import.meta.url,
        ),
        "Permanent Marker",
        400,
      ],
    ] as const
  ).map(async ([url, name, weight]) => ({
    name,
    weight,
    style: "normal" as const,
    data: await fetch(url).then((res) => res.arrayBuffer()),
  })),
);

const fetchJson = async <T,>(url: string): Promise<T | undefined> => {
  try {
    const response = await fetch(url);
    return response.ok ? ((await response.json()) as T) : undefined;
  } catch {
    return undefined;
  }
};

const rgb = (color: Rgb, alpha = 1) => `rgba(${color.join(",")},${alpha})`;

interface CardProps {
  name: string;
  image?: string;
  stage: Rgb;
  highlighter: Rgb;
  sheetTitle: string;
  main: Track[];
  encore: Track[];
  setLength: number;
  totalShows: number;
  summary: string;
}

const nameSize = (name: string, sizes: [number, number, number, number]) =>
  name.length <= 9
    ? sizes[0]
    : name.length <= 14
      ? sizes[1]
      : name.length <= 22
        ? sizes[2]
        : sizes[3];

const Tape = ({ left, rotate }: { left: number; rotate: number }) => (
  <div
    style={{
      position: "absolute",
      top: -14,
      left,
      width: 112,
      height: 32,
      backgroundColor: TAPE,
      transform: `rotate(${rotate}deg)`,
    }}
  />
);

const EncoreBreak = ({ size }: { size: number }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      height: size * 1.7,
      paddingLeft: size * 1.9,
      gap: 14,
    }}
  >
    <span style={{ fontFamily: "Permanent Marker", fontSize: size }}>
      Encore
    </span>
    <svg
      width="100%"
      height="12"
      viewBox="0 0 200 12"
      preserveAspectRatio="none"
      style={{ flex: 1, opacity: 0.7 }}
    >
      <path
        d="M2 7 C 30 2, 50 11, 80 6 S 130 2, 160 7 S 190 9, 198 5"
        fill="none"
        stroke={rgb(INK)}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

const Row = ({
  track,
  number,
  totalShows,
  highlighter,
  size,
}: {
  track: Track;
  number: number;
  totalShows: number;
  highlighter: Rgb;
  size: number;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      height: size * 1.7,
      fontFamily: "Permanent Marker",
    }}
  >
    <span
      style={{
        width: size * 1.4,
        marginRight: size * 0.5,
        justifyContent: "flex-end",
        display: "flex",
        fontSize: size * 0.85,
        opacity: 0.45,
      }}
    >
      {number}
    </span>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        position: "relative",
        flex: 1,
        minWidth: 0,
        height: size * 1.3,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: size * 0.46,
          height: size * 0.74,
          width: `${(track.count / (totalShows || 1)) * 100}%`,
          borderRadius: 3,
          transform: "skewX(-6deg)",
          backgroundColor: rgb(highlighter, HIGHLIGHTER_ALPHA),
        }}
      />
      <span
        style={{
          fontSize: size,
          lineHeight: 1.3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {track.title}
      </span>
    </div>
  </div>
);

const sheetRows = (
  {
    main,
    encore,
    totalShows,
    highlighter,
  }: Pick<CardProps, "main" | "encore" | "totalShows" | "highlighter">,
  size: number,
  offset = 0,
) => [
  ...main.map((track, index) => (
    <Row
      key={track.title}
      track={track}
      number={offset + index + 1}
      totalShows={totalShows}
      highlighter={highlighter}
      size={size}
    />
  )),
  ...(encore.length > 0 ? [<EncoreBreak key="encore" size={size} />] : []),
  ...encore.map((track, index) => (
    <Row
      key={track.title}
      track={track}
      number={offset + main.length + index + 1}
      totalShows={totalShows}
      highlighter={highlighter}
      size={size}
    />
  )),
];

// The wordmark from components/Logo, restated in inline styles for Satori.
// Satori misplaces mixed-size baselines, so the line boxes are set to the
// text, bottom-aligned, and the URL nudged up onto the wordmark's baseline.
const Brand = () => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 24 }}>
    <div
      style={{
        display: "flex",
        position: "relative",
        fontFamily: "Archivo Display",
        fontSize: 40,
        lineHeight: 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -5,
          top: 8,
          width: 57,
          height: 18,
          backgroundColor: TAPE,
          transform: "rotate(-6deg)",
        }}
      />
      <span>GigPlayList</span>
    </div>
    <span
      style={{
        fontSize: 22,
        lineHeight: 1,
        opacity: 0.7,
        marginBottom: 6,
      }}
    >
      gigplaylist.sirlisko.com
    </span>
  </div>
);

// The artist page in miniature: their colour and photo, the name set big,
// and the sheet taped down, running off the bottom edge.
const SheetOnStage = (props: CardProps) => {
  const { name, image, stage, sheetTitle, summary } = props;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        color: "white",
        fontFamily: "Archivo",
        backgroundColor: rgb(stage),
      }}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          width={1200}
          height={630}
          alt=""
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            objectFit: "cover",
            opacity: 0.32,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1200,
          height: 630,
          backgroundImage: `linear-gradient(170deg, ${rgb(stage, 0.15)} 0%, ${rgb(stage, 0.85)} 55%, rgba(0,0,0,0.9) 100%)`,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 600,
          padding: "60px 0 52px 64px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: "Archivo Display",
              fontSize: nameSize(name, [150, 118, 92, 70]),
              lineHeight: 0.92,
              letterSpacing: -1,
            }}
          >
            {name}
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 28,
              lineHeight: 1.35,
              opacity: 0.88,
              maxWidth: 480,
            }}
          >
            {summary}
          </div>
        </div>
        <Brand />
      </div>
      <div
        style={{
          position: "absolute",
          left: 672,
          top: 58,
          width: 480,
          height: 660,
          display: "flex",
          flexDirection: "column",
          padding: "44px 32px 0 24px",
          backgroundColor: rgb(PAPER),
          color: rgb(INK),
          borderRadius: 3,
          transform: "rotate(-1.6deg)",
          boxShadow: "0 28px 56px rgba(0,0,0,0.55)",
        }}
      >
        <Tape left={28} rotate={-6} />
        <Tape left={330} rotate={5} />
        <div
          style={{
            display: "flex",
            fontFamily: "Permanent Marker",
            fontSize: 34,
            paddingLeft: 52,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {sheetTitle}
          </span>
        </div>
        {sheetRows(props, 24)}
      </div>
    </div>
  );
};

const example = (title: string, count: number, isEncore = false): Track => ({
  title,
  count,
  isEncore,
  position: 0,
  shows: [],
});

// The home page's pitch and its example sheet, for links to the site itself.
const HomeCard = () => (
  <div
    style={{
      width: "100%",
      height: "100%",
      display: "flex",
      position: "relative",
      overflow: "hidden",
      color: "white",
      fontFamily: "Archivo",
      backgroundColor: rgb(STAGE),
      backgroundImage:
        "radial-gradient(ellipse 36% 60% at 76% 52%, rgba(255,214,150,0.2), transparent 75%)",
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: 640,
        padding: "64px 0 52px 64px",
      }}
    >
      <div
        style={{
          fontFamily: "Archivo Display",
          fontSize: 104,
          lineHeight: 0.92,
          letterSpacing: -1,
        }}
      >
        Know the setlist before the lights go down
      </div>
      <Brand />
    </div>
    <div
      style={{
        position: "absolute",
        left: 712,
        top: 92,
        width: 440,
        display: "flex",
        flexDirection: "column",
        padding: "44px 32px 30px 20px",
        backgroundColor: rgb(PAPER),
        color: rgb(INK),
        borderRadius: 3,
        transform: "rotate(1.6deg)",
        boxShadow: "0 28px 56px rgba(0,0,0,0.55)",
      }}
    >
      <Tape left={24} rotate={-6} />
      <Tape left={300} rotate={5} />
      <div
        style={{
          display: "flex",
          fontFamily: "Permanent Marker",
          fontSize: 34,
          paddingLeft: 52,
          marginBottom: 10,
        }}
      >
        Tonight
      </div>
      {sheetRows(
        {
          main: [
            example("The opener", 100),
            example("The new single", 90),
            example("One from the first album", 55),
            example("A deep cut", 20),
          ],
          encore: [example("The one everyone waits for", 95, true)],
          totalShows: 100,
          highlighter: HIGHLIGHTER,
        },
        24,
      )}
    </div>
  </div>
);

const CACHE_CONTROL = "public, s-maxage=86400, stale-while-revalidate=604800";

const handler = async (req: NextRequest) => {
  const { searchParams, origin } = new URL(req.url);
  const artist = searchParams.get("artist");
  const id = searchParams.get("id") ?? undefined;
  if (!artist) {
    return new ImageResponse(<HomeCard />, {
      width: 1200,
      height: 630,
      fonts: await fonts,
      headers: { "Cache-Control": CACHE_CONTROL },
    });
  }

  // Both endpoints are CDN-cached, so this rarely reaches the upstream APIs.
  const [artistData, setList] = await Promise.all([
    fetchJson<ArtistData>(`${origin}${artistDataKey(artist, id)}`),
    fetchJson<SetList>(`${origin}${tracksKey(artist, id)}`),
  ]);

  const palette = artistData?.palette;
  const setLength = setList ? typicalSetLength(setList) : 0;
  const view = setList
    ? buildSetlistView(setList.tracks, setLength, "running")
    : { main: [], encore: [] };
  const totalShows = setList?.totalSetLists ?? 0;

  const props: CardProps = {
    name: artistData?.name ?? artist,
    image: artistData?.image,
    stage: readableUnder(
      (palette?.DarkVibrant?.rgb as Rgb) ?? STAGE,
      1,
      BLACK,
      WHITE,
    ),
    highlighter: readableUnder(
      (palette?.Vibrant?.rgb as Rgb) ?? HIGHLIGHTER,
      HIGHLIGHTER_ALPHA,
      PAPER,
      INK,
    ),
    sheetTitle: setList?.tour ?? "Running order",
    main: view.main,
    encore: view.encore,
    setLength,
    totalShows,
    summary:
      totalShows > 0
        ? `A typical night is ${setLength} songs. Built from ${totalShows} recent shows${
            setList?.tour ? ` on the ${tourName(setList.tour)}` : ""
          }.`
        : "What they play live, from their recent setlists.",
  };

  return new ImageResponse(<SheetOnStage {...props} />, {
    width: 1200,
    height: 630,
    fonts: await fonts,
    headers: { "Cache-Control": CACHE_CONTROL },
  });
};

export default handler;

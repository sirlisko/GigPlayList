import type { NextApiResponse } from "next";

const HOUR = 60 * 60;
const DAY = 24 * HOUR;

// Setlists only change once a night and the upstream APIs are rate limited
// (setlist.fm allows 1,440 requests a day), so repeat views come from the CDN.
export const CACHE = {
  setlists: HOUR,
  spotify: DAY,
} as const;

export const cachePublicly = (res: NextApiResponse, seconds: number) =>
  res.setHeader(
    "Cache-Control",
    `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 24}`,
  );

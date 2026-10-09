import { HttpStatusCode } from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

import { findArtistTracks } from "server/apis/spotify";
import { CACHE, cachePublicly } from "server/cache";

import { Link } from "types";

// One Spotify search per title, so keep a request from fanning out too far.
const MAX_TITLES = 25;

export default async (req: NextApiRequest, res: NextApiResponse<Link[]>) => {
  const { artistName, title } = req.query as {
    artistName: string;
    title?: string | string[];
  };
  const titles = [title ?? []].flat().slice(0, MAX_TITLES);
  if (!artistName || titles.length === 0) {
    return res.status(HttpStatusCode.BadRequest).end();
  }
  try {
    const { links, complete } = await findArtistTracks(artistName, titles);
    if (complete) {
      cachePublicly(res, CACHE.spotify);
    }
    res.status(HttpStatusCode.Ok).json(links);
  } catch {
    res.status(HttpStatusCode.InternalServerError).end();
  }
};

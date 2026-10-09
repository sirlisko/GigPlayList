import { HttpStatusCode } from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

import { findArtistTracks } from "server/apis/spotify";

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
    res
      .status(HttpStatusCode.Ok)
      .json(await findArtistTracks(artistName, titles));
  } catch {
    res.status(HttpStatusCode.InternalServerError).end();
  }
};

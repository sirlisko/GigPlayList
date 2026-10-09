import { getArtistSetlistSummary } from "server/artistSetlist";
import { CACHE, cachePublicly } from "server/cache";

import type { NextApiRequest, NextApiResponse } from "next";
import axios, { HttpStatusCode } from "axios";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { artistName, artistId, tour } = req.query as {
    artistName?: string;
    artistId?: string;
    tour?: string;
  };
  if (!artistName && !artistId) {
    return res.status(HttpStatusCode.BadRequest).end();
  }
  try {
    const setList = await getArtistSetlistSummary(artistName, artistId, tour);
    cachePublicly(res, CACHE.setlists);
    res.status(HttpStatusCode.Ok).json(setList);
  } catch (e) {
    const upstream = axios.isAxiosError<{ code?: number; message?: string }>(e)
      ? e.response?.data
      : undefined;
    res
      .status(upstream?.code ?? HttpStatusCode.InternalServerError)
      .end(upstream?.message || "Ops! There was a problem!");
  }
};

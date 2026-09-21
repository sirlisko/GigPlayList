import { getArtistSetlist } from "server/apis/setlistFm";
import { attachCoverOriginals } from "server/apis/spotify";
import { getAggregatedSetlists } from "server/setlists";

import type { NextApiRequest, NextApiResponse } from "next";
import axios, { HttpStatusCode } from "axios";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { artistName, artistId } = req.query as {
    artistName?: string;
    artistId?: string;
  };
  if (!artistName && !artistId) {
    return res.status(HttpStatusCode.BadRequest).end();
  }
  try {
    const setList = await getArtistSetlist(artistName, artistId);
    const aggregated = getAggregatedSetlists(setList);
    const tracks = await attachCoverOriginals(aggregated.tracks).catch(
      () => aggregated.tracks,
    );
    res.status(HttpStatusCode.Ok).json({ ...aggregated, tracks });
  } catch (e) {
    const upstream = axios.isAxiosError<{ code?: number; message?: string }>(e)
      ? e.response?.data
      : undefined;
    res
      .status(upstream?.code ?? HttpStatusCode.InternalServerError)
      .end(upstream?.message || "Ops! There was a problem!");
  }
};

import { getArtistSetlist } from "server/apis/setlistFm";
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
    res.status(HttpStatusCode.Ok).json(getAggregatedSetlists(setList));
  } catch (e) {
    const upstream = axios.isAxiosError<{ code?: number; message?: string }>(e)
      ? e.response?.data
      : undefined;
    res
      .status(upstream?.code ?? HttpStatusCode.InternalServerError)
      .end(upstream?.message || "Ops! There was a problem!");
  }
};

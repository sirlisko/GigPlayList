import { HttpStatusCode } from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

import { getArtistTracks } from "server/apis/spotify";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { artistName } = req.query as { artistName: string };
  if (!artistName) {
    return res.status(HttpStatusCode.BadRequest).end();
  }
  try {
    const artistData = await getArtistTracks(artistName);
    res.status(HttpStatusCode.Ok).json(artistData);
  } catch (e) {
    const err = e as {
      response?: { data?: { code?: number; message?: string } };
      status?: number;
      message?: string;
    };
    res
      .status(
        err?.response?.data?.code ??
          err?.status ??
          HttpStatusCode.InternalServerError,
      )
      .end(
        err?.response?.data?.message ??
          err?.message ??
          "Ops! There was a problem!",
      );
  }
};

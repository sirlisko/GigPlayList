import axios from "axios";

const DOMAIN = "https://api.setlist.fm";
const ARTIST_PATH = "/rest/1.0/search/artists?sort=relevance&artistName=";
const SETLIST_PATH = "/rest/1.0/search/setlists?artistMbid=";

const headers = {
  Accept: "application/json",
  "x-api-key": process.env.SETLISTFMAPIKEY as string,
};

export const getArtistSetlist = async (
  artistName?: string,
  artistId?: string,
) => {
  if (artistId) {
    const { data } = await axios(`${DOMAIN}${SETLIST_PATH}${artistId}`, {
      headers,
    });
    return data;
  }
  if (artistName) {
    const { data: artistData } = await axios(
      `${DOMAIN}${ARTIST_PATH}${artistName}`,
      {
        headers,
      },
    );
    const mbid = artistData?.artist?.[0]?.mbid;
    if (!mbid) {
      throw new Error(`No artist found on SetList.fm for "${artistName}"`);
    }
    const { data } = await axios(`${DOMAIN}${SETLIST_PATH}${mbid}`, {
      headers,
    });
    return data;
  }
  throw new Error("No artist name or id provided");
};

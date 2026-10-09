import axios from "axios";

const URL = "https://musicbrainz.org/ws/2/artist";
const SPOTIFY_ARTIST_URL = "https://open.spotify.com/artist/";

interface Relation {
  url?: { resource: string };
}

// MusicBrainz links each artist to its Spotify profile, which disambiguates
// artists sharing a name far better than a Spotify name search.
export const getSpotifyArtistId = async (mbid: string) => {
  try {
    const { data } = await axios<{ relations?: Relation[] }>(
      `${URL}/${encodeURIComponent(mbid)}`,
      {
        params: { inc: "url-rels", fmt: "json" },
        headers: {
          "User-Agent": "GigPlayList/1.0 (https://gigplaylist.sirlisko.com)",
        },
        timeout: 3000,
      },
    );
    return data.relations
      ?.map(({ url }) => url?.resource)
      .find((resource) => resource?.startsWith(SPOTIFY_ARTIST_URL))
      ?.slice(SPOTIFY_ARTIST_URL.length)
      .split(/[/?]/)[0];
  } catch {
    return undefined;
  }
};

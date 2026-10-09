import SpotifyWebApi from "spotify-web-api-node";
import Vibrant from "node-vibrant";
import { HttpStatusCode } from "axios";

import { Link, Track } from "types";
import { isSameSong, normalizeSong } from "utils/matchSongs";
import { getSpotifyArtistId } from "server/apis/musicbrainz";

const { NEXT_PUBLIC_SPOTIFY_CLIENT_ID, SPOTIFY_SECRET } = process.env;

const spotifyApi = new SpotifyWebApi({
  clientId: NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_SECRET,
});

const authenticate = async () => {
  const {
    body: { access_token },
  } = await spotifyApi.clientCredentialsGrant();
  spotifyApi.setAccessToken(access_token);
};

const findArtist = async (artistName: string, spotifyId?: string) => {
  if (spotifyId) {
    try {
      const { body } = await spotifyApi.getArtist(spotifyId);
      return body;
    } catch {
      // A stale MusicBrainz link shouldn't hide an artist a search can find.
    }
  }
  const { body } = await spotifyApi.searchArtists(artistName);
  return (
    body.artists?.items.find(
      ({ name }) => name.toLowerCase() === artistName.toLocaleLowerCase(),
    ) || body.artists?.items[0]
  );
};

const getArtistInfo = async (artistName: string, spotifyId?: string) => {
  const artist = await findArtist(artistName, spotifyId);
  const image = artist?.images[0]?.url;
  const palette = image && (await Vibrant.from(image).getPalette());
  if (!artist) {
    throw {
      status: HttpStatusCode.NotFound,
      data: "Artist not found",
    };
  }
  return {
    image: image,
    name: artist?.name,
    palette,
  };
};

const getSongs = async (artistName: string, offset = 0, spotifyId?: string) => {
  const { body } = await spotifyApi.searchTracks(`artist:${artistName}`, {
    limit: 50,
    offset,
  });

  return body?.tracks?.items
    ?.filter(
      (track) => !spotifyId || track.artists.some(({ id }) => id === spotifyId),
    )
    .map((track) => ({
      title: track.name.toLowerCase(),
      uri: track.uri,
      cover: track.album.images[2]?.url ?? track.album.images[0]?.url,
      previewUrl: track.preview_url,
      duration_ms: track.duration_ms,
    }));
};

export const getArtistTracks = async (artistName: string, mbid?: string) => {
  const [spotifyId] = await Promise.all([
    mbid ? getSpotifyArtistId(mbid) : undefined,
    authenticate(),
  ]);

  const batch = await Promise.all([
    getSongs(artistName, 0, spotifyId),
    getSongs(artistName, 50, spotifyId),
    getArtistInfo(artistName, spotifyId),
  ]);
  return {
    ...batch[2],
    tracks: [...(batch?.[0] || []), ...(batch?.[1] || [])],
  };
};

const toLink = (track: SpotifyApi.TrackObjectFull): Link => ({
  title: track.name.toLowerCase(),
  uri: track.uri,
  cover: track.album.images[2]?.url ?? track.album.images[0]?.url ?? "",
  previewUrl: track.preview_url ?? "",
  duration_ms: track.duration_ms,
});

// Spotify ranks karaoke and tribute recordings highly, so the credited artist
// has to match rather than trusting the first result.
export const pickOriginal = (
  items: SpotifyApi.TrackObjectFull[],
  title: string,
  originalArtist: string,
) =>
  items.find(
    (item) =>
      isSameSong(item.name, title) &&
      item.artists.some(
        ({ name }) => normalizeSong(name) === normalizeSong(originalArtist),
      ),
  );

const findTrack = async (title: string, artist: string) => {
  const quote = (value: string) => `"${value.replace(/"/g, "")}"`;
  try {
    const { body } = await spotifyApi.searchTracks(
      `track:${quote(title)} artist:${quote(artist)}`,
      { limit: 10 },
    );
    const match = pickOriginal(body.tracks?.items ?? [], title, artist);
    return match && toLink(match);
  } catch {
    return undefined;
  }
};

export const attachCoverOriginals = async (tracks: Track[]) => {
  const covers = tracks.filter(({ cover }) => Boolean(cover));
  if (covers.length === 0) {
    return tracks;
  }

  await authenticate();
  const originals = new Map(
    await Promise.all(
      covers.map(
        async ({ title, cover }) =>
          [title, await findTrack(title, cover as string)] as const,
      ),
    ),
  );

  return tracks.map((track) => {
    const original = originals.get(track.title);
    return original ? { ...track, original } : track;
  });
};

// The artist-wide search only returns 100 tracks, which misses deep cuts of
// artists with large catalogues.
export const findArtistTracks = async (
  artistName: string,
  titles: string[],
) => {
  await authenticate();
  const links = await Promise.all(
    titles.map((title) => findTrack(title, artistName)),
  );
  return links.filter((link): link is Link => Boolean(link));
};

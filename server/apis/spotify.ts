import SpotifyWebApi from "spotify-web-api-node";
import Vibrant from "node-vibrant";
import { HttpStatusCode } from "axios";

import { Link, Track } from "types";
import { isSameSong, normalizeSong } from "utils/matchSongs";

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

const getArtistInfo = async (artistName: string) => {
  const { body } = await spotifyApi.searchArtists(artistName);
  const artist =
    body.artists?.items.find(
      ({ name }) => name.toLowerCase() === artistName.toLocaleLowerCase(),
    ) || body.artists?.items[0];
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

const getSongs = async (artistName: string, offset = 0) => {
  const { body } = await spotifyApi.searchTracks(`artist:${artistName}`, {
    limit: 50,
    offset,
  });

  return body?.tracks?.items?.map((track) => ({
    title: track.name.toLowerCase(),
    uri: track.uri,
    cover: track.album.images[2]?.url ?? track.album.images[0]?.url,
    previewUrl: track.preview_url,
    duration_ms: track.duration_ms,
  }));
};

export const getArtistTracks = async (artistName: string) => {
  await authenticate();

  const batch = await Promise.all([
    getSongs(artistName, 0),
    getSongs(artistName, 50),
    getArtistInfo(artistName),
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

const findOriginal = async (title: string, originalArtist: string) => {
  const quote = (value: string) => `"${value.replace(/"/g, "")}"`;
  try {
    const { body } = await spotifyApi.searchTracks(
      `track:${quote(title)} artist:${quote(originalArtist)}`,
      { limit: 10 },
    );
    const match = pickOriginal(body.tracks?.items ?? [], title, originalArtist);
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
          [title, await findOriginal(title, cover as string)] as const,
      ),
    ),
  );

  return tracks.map((track) => {
    const original = originals.get(track.title);
    return original ? { ...track, original } : track;
  });
};

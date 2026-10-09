import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Spotify from "spotify-web-api-js";

import { useAuth } from "components/UserContext/UserContext";
import LoginBanner, {
  SAVE_AFTER_LOGIN_STORAGE_KEY,
} from "components/LoginBanner/LoginBanner";
import { ArtistData, Event, Link } from "types";
import { formatGigDate } from "utils/labels";
import { CircleCheckBig, LoaderCircle } from "lucide-react";

interface SavePlaylistProps {
  gig?: Event;
  artistData: ArtistData;
  songs: Link[];
  duration?: string;
  unmatchedCount?: number;
  // False while songs may still change, so a resumed save doesn't go early.
  ready?: boolean;
}

interface SavedPlaylist {
  url: string;
  uris: string;
}

const TRACKS_PER_REQUEST = 100;

const chunk = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

// 403 covers tokens granted before the private playlist scopes existed.
const needsLogin = (e: unknown) =>
  typeof e === "object" &&
  e !== null &&
  "status" in e &&
  (e.status === 401 || e.status === 403);

const PRIVATE_PREFERENCE_KEY = "gigplaylist:private";

const readPrivatePreference = () => {
  try {
    return localStorage.getItem(PRIVATE_PREFERENCE_KEY) === "true";
  } catch {
    return false;
  }
};

const createdSessionKey = (name: string) => `gigplaylist:created:${name}`;

const readSavedPlaylist = (name: string): SavedPlaylist | null => {
  try {
    const saved = JSON.parse(
      sessionStorage.getItem(createdSessionKey(name)) ?? "null",
    );
    return saved?.url && typeof saved.uris === "string" ? saved : null;
  } catch {
    return null;
  }
};

const PLAYLISTS_PER_PAGE = 50;
const MAX_PLAYLIST_PAGES = 20;

const findExistingPlaylist = async (
  spotify: InstanceType<typeof Spotify>,
  userId: string,
  playlistName: string,
) => {
  for (let page = 0; page < MAX_PLAYLIST_PAGES; page++) {
    const { items, next } = await spotify.getUserPlaylists(userId, {
      limit: PLAYLISTS_PER_PAGE,
      offset: page * PLAYLISTS_PER_PAGE,
    });
    const match = items.find(
      (playlist) =>
        playlist.name === playlistName && playlist.owner.id === userId,
    );
    if (match) return match;
    if (!next) return undefined;
  }
  return undefined;
};

const addTracksInChunks = (
  spotify: InstanceType<typeof Spotify>,
  playlistId: string,
  chunks: string[][],
) =>
  chunks.reduce<Promise<unknown>>(
    (promise, uris) =>
      promise.then(() => spotify.addTracksToPlaylist(playlistId, uris)),
    Promise.resolve(),
  );

const playlistTitle = (artist: string, gig?: Event) =>
  gig
    ? `${artist} at ${gig.venueName}, ${formatGigDate(gig.date)} - GigPlayList`
    : `${artist} - GigPlayList`;

const SavePlaylist = ({
  gig,
  artistData: { name },
  songs,
  duration,
  unmatchedCount = 0,
  ready = true,
}: SavePlaylistProps) => {
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState<SavedPlaylist | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const { user, getAccessToken, logout } = useAuth();
  const playlistName = playlistTitle(name, gig);

  useEffect(() => {
    setSaved(readSavedPlaylist(playlistName));
  }, [playlistName]);
  useEffect(() => {
    setIsPrivate(readPrivatePreference());
  }, []);
  const { asPath } = useRouter();
  const uris = songs.map((song) => song.uri);
  const signature = `${isPrivate ? "private" : "public"}:${uris.join(",")}`;
  const isUpToDate = saved?.uris === signature;

  const changePrivacy = (value: boolean) => {
    setIsPrivate(value);
    try {
      localStorage.setItem(PRIVATE_PREFERENCE_KEY, String(value));
    } catch {
      // Only a convenience; the choice still applies to this save.
    }
  };

  const savePlaylist = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const accessToken = await getAccessToken?.();
      if (!accessToken) {
        setError("Your Spotify login expired. Log in again to save.");
        return;
      }
      const spotify = new Spotify();
      spotify.setAccessToken(accessToken);

      const uriChunks = chunk(uris, TRACKS_PER_REQUEST);

      const existingPlaylist = await findExistingPlaylist(
        spotify,
        user.user.id,
        playlistName,
      );

      let url: string;
      if (existingPlaylist) {
        await spotify.replaceTracksInPlaylist(
          existingPlaylist.id,
          uriChunks[0] ?? [],
        );
        await addTracksInChunks(
          spotify,
          existingPlaylist.id,
          uriChunks.slice(1),
        );
        await spotify.changePlaylistDetails(existingPlaylist.id, {
          public: !isPrivate,
        });
        url = existingPlaylist.external_urls.spotify;
      } else {
        const playlist = await spotify.createPlaylist(user.user.id, {
          name: playlistName,
          description:
            "Playlist generated by https://gigplaylist.sirlisko.com/",
          public: !isPrivate,
        });
        await addTracksInChunks(spotify, playlist.id, uriChunks);
        url = playlist.external_urls.spotify;
      }

      const savedPlaylist = { url, uris: signature };
      sessionStorage.setItem(
        createdSessionKey(playlistName),
        JSON.stringify(savedPlaylist),
      );
      setSaved(savedPlaylist);
    } catch (e) {
      if (needsLogin(e)) {
        logout?.();
        setError("Spotify needs you to log in again before saving.");
      } else {
        setError("Your playlist wasn't saved. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !ready || songs.length === 0) return;
    if (sessionStorage.getItem(SAVE_AFTER_LOGIN_STORAGE_KEY) !== asPath) return;
    sessionStorage.removeItem(SAVE_AFTER_LOGIN_STORAGE_KEY);
    savePlaylist();
  }, [user, ready, songs.length]);

  const summary = `${songs.length} ${songs.length === 1 ? "song" : "songs"}${
    duration ? `, ${duration}` : ""
  }`;

  return (
    <div className="border-t border-white/10 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3 sm:px-6">
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold">{summary}</p>
          {error ? (
            <p role="alert" className="text-red-300">
              {error}
            </p>
          ) : saved && isUpToDate ? (
            <p role="status" className="text-white/75">
              Saved to Spotify
            </p>
          ) : (
            <p className="text-white/70">
              {!user
                ? "You'll log in to Spotify first."
                : unmatchedCount > 0
                  ? `${unmatchedCount} ${unmatchedCount === 1 ? "song isn't" : "songs aren't"} on Spotify.`
                  : saved
                    ? "The list changed since you saved it."
                    : "Ready to save."}
            </p>
          )}
          <label className="mt-1 inline-flex cursor-pointer items-center gap-2 text-xs text-white/70">
            <input
              type="checkbox"
              className="checkbox"
              checked={isPrivate}
              disabled={loading}
              onChange={(e) => changePrivacy(e.target.checked)}
            />
            Make the playlist private
          </label>
        </div>
        {loading ? (
          <p className="flex items-center gap-2 font-semibold" role="status">
            <LoaderCircle
              size={18}
              className="animate-spin motion-reduce:animate-none"
              aria-hidden="true"
            />
            Saving...
          </p>
        ) : saved && isUpToDate ? (
          <a
            href={saved.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 whitespace-nowrap rounded-full border border-spotify px-5 py-2.5 font-semibold transition-colors hover:bg-spotify hover:text-black"
          >
            <CircleCheckBig size={18} aria-hidden="true" />
            Open in Spotify
          </a>
        ) : (
          <LoginBanner
            onCreatePlaylist={savePlaylist}
            label={saved ? "Update playlist" : "Save to Spotify"}
          />
        )}
      </div>
    </div>
  );
};

export default SavePlaylist;

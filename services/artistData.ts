import useSWR from "swr";
import { ArtistData } from "types";
import { fetcher } from "utils/api";

export const artistDataKey = (artist: string | undefined, mbid?: string) =>
  artist
    ? `/api/artists/${encodeURIComponent(artist)}/spotify${
        mbid ? `?mbid=${encodeURIComponent(mbid)}` : ""
      }`
    : null;

export const useArtistData = (artist: string | undefined, mbid?: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    artistDataKey(artist, mbid),
    fetcher<ArtistData>,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    artistData: data,
    isLoading,
    isError: error,
    retry: mutate,
  };
};

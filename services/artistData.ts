import useSWR from "swr";
import { ArtistData } from "types";
import { fetcher } from "utils/api";
import { artistDataKey } from "services/keys";

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
    // Server-rendered data arrives as SWR fallback, which still counts as
    // loading until the first revalidation; it is ready to show already.
    isLoading: isLoading && !data,
    isError: error,
    retry: mutate,
  };
};

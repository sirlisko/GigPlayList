import useSWR from "swr";
import { ArtistData } from "types";
import { fetcher } from "utils/api";

export const useArtistData = (artist: string | undefined) => {
  const { data, error, isLoading, mutate } = useSWR(
    artist ? `/api/artists/${encodeURIComponent(artist)}/spotify` : null,
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

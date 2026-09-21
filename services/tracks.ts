import useSWR from "swr";
import { SetList } from "types";
import { fetcher } from "utils/api";

export const useTracks = (artistName?: string, artistId?: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    artistId
      ? `/api/tracks?artistId=${encodeURIComponent(artistId)}`
      : artistName
        ? `/api/tracks?artistName=${encodeURIComponent(artistName)}`
        : null,
    fetcher<SetList>,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    data,
    isLoading,
    isError: error,
    retry: mutate,
  };
};

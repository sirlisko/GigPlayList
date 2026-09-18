import useSWR from "swr";
import { SetList } from "types";
import { fetcher } from "utils/api";

export const useTracks = (artistName?: string, artistId?: string) => {
  const { data, error, isLoading, mutate } = useSWR(
    artistId
      ? `/api/tracks?artistId=${artistId}`
      : artistName
        ? `/api/tracks?artistName=${artistName}`
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

import useSWR from "swr";
import { SetList } from "types";
import { fetcher } from "utils/api";
import { tracksKey } from "services/keys";

export const useTracks = (
  artistName?: string,
  artistId?: string,
  tour?: string,
) => {
  const { data, error, isLoading, mutate } = useSWR(
    tracksKey(artistName, artistId, tour),
    fetcher<SetList>,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      revalidateOnReconnect: false,
      // Switching tour keeps the current list up instead of blanking the page.
      keepPreviousData: true,
    },
  );

  return {
    data,
    // Only the first load counts: a tour switch updates the list in place,
    // and server-rendered fallback data is ready to show.
    isLoading: isLoading && !data,
    isError: error,
    retry: mutate,
  };
};

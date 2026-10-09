import useSWR from "swr";
import { SetList } from "types";
import { fetcher } from "utils/api";

export const tracksKey = (
  artistName?: string,
  artistId?: string,
  tour?: string,
) => {
  const params = new URLSearchParams(
    artistId ? { artistId } : artistName ? { artistName } : {},
  );
  if (!params.toString()) {
    return null;
  }
  if (tour) {
    params.set("tour", tour);
  }
  return `/api/tracks?${params}`;
};

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
    // Only the first load counts; a tour switch updates the list in place.
    isLoading: isLoading && !data,
    isError: error,
    retry: mutate,
  };
};

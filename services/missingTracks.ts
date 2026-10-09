import useSWR from "swr";
import { Link } from "types";
import { fetcher } from "utils/api";

// Matches the API's cap; titles arrive most played first.
const MAX_TITLES = 25;

export const useMissingTracks = (
  artistName: string | undefined,
  titles: string[],
) => {
  const query = new URLSearchParams(
    titles.slice(0, MAX_TITLES).map((title) => ["title", title]),
  );
  const { data, isLoading } = useSWR(
    artistName && titles.length > 0
      ? `/api/artists/${encodeURIComponent(artistName)}/tracks?${query}`
      : null,
    fetcher<Link[]>,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      revalidateOnReconnect: false,
    },
  );

  return { missingTracks: data, isLoading };
};

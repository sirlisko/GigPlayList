import { useEffect, useState } from "react";
import useSWR from "swr";
import { ArtistInfo } from "types";
import { fetcher } from "utils/api";

export type SearchResults = {
  artists: ArtistInfo[];
};

// MusicBrainz allows ~1 request/second per client and answers 503 beyond that.
const SEARCH_DEBOUNCE_MS = 400;

const useDebouncedValue = <T>(value: T, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
};

export const useSearchArtistByName = (searchTerm: string | undefined) => {
  const debouncedTerm = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
  const { data, error, isLoading } = useSWR(
    debouncedTerm && debouncedTerm.length > 1
      ? `https://musicbrainz.org/ws/2/artist?query=${encodeURIComponent(debouncedTerm)}&fmt=json`
      : null,
    fetcher<SearchResults>,
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
  };
};

export const useGetArtist = (mbid: string | undefined) => {
  const { data, error, isLoading } = useSWR(
    mbid ? `https://musicbrainz.org/ws/2/artist/${mbid}?fmt=json` : null,
    fetcher<ArtistInfo>,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    artist: data,
    isLoading,
    isError: error,
  };
};

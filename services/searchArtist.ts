import { useEffect, useState } from "react";
import useSWR from "swr";
import { ArtistInfo } from "types";
import { fetcher } from "utils/api";

export type SearchResults = {
  artists: ArtistInfo[];
};

// MusicBrainz allows ~1 request/second per client and answers 503 beyond that.
const SEARCH_DEBOUNCE_MS = 400;
const REQUEST_GAP_MS = 1000;
const RATE_LIMIT_RETRIES = 4;

class SupersededSearch extends Error {}

let lastRequestAt = 0;
let latestSearch = 0;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// A slow typist outpaces the debounce, so searches also wait their turn; one
// still waiting when a newer search starts is dropped rather than spending
// the slot. MusicBrainz also sheds search load for everyone when busy (503,
// `retry-after: 0`), so a 503 waits a turn and tries again.
const searchFetcher = async (url: string): Promise<SearchResults> => {
  const search = ++latestSearch;
  for (let attempt = 0; ; attempt++) {
    await sleep(lastRequestAt + REQUEST_GAP_MS - Date.now());
    if (search !== latestSearch) throw new SupersededSearch();
    lastRequestAt = Date.now();
    const res = await fetch(url);
    if (res.status === 503 && attempt < RATE_LIMIT_RETRIES) continue;
    if (!res.ok) {
      throw new Error(`Artist search failed with status ${res.status}`);
    }
    return res.json();
  }
};

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
    searchFetcher,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      revalidateOnReconnect: false,
    },
  );

  return {
    data,
    // The term `data` and `isError` describe, which trails the typed one.
    query: debouncedTerm,
    isLoading,
    isError: !isLoading && error && !(error instanceof SupersededSearch),
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

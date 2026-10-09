import { useRouter } from "next/router";

import { Order } from "utils/setlistView";

// Kept in the URL so the view survives the Spotify login round trip and
// shared links show the same playlist.
export const useViewParams = () => {
  const { query, pathname, replace } = useRouter();
  const setParam = (key: string, value?: string) => {
    const next = { ...query };
    if (value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
    replace({ pathname, query: next }, undefined, {
      shallow: true,
      scroll: false,
    });
  };
  return {
    tour: typeof query.tour === "string" ? query.tour : undefined,
    setTour: (tour?: string) => setParam("tour", tour),
    order: (query.order === "played" ? "played" : "running") as Order,
    includeExtras: query.extras === "1",
    hideCovers: query.covers === "0",
    setOrder: (order: Order) =>
      setParam("order", order === "running" ? undefined : order),
    setIncludeExtras: (include: boolean) =>
      setParam("extras", include ? "1" : undefined),
    setHideCovers: (hide: boolean) =>
      setParam("covers", hide ? "0" : undefined),
  };
};

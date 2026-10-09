// Request URLs shared by the SWR hooks, server-side rendering (as SWR
// fallback keys) and the share image, so all three always agree.
export const artistDataKey = (artist: string | undefined, mbid?: string) =>
  artist
    ? `/api/artists/${encodeURIComponent(artist)}/spotify${
        mbid ? `?mbid=${encodeURIComponent(mbid)}` : ""
      }`
    : null;

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

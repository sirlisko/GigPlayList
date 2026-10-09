import { getArtistSetlist } from "server/apis/setlistFm";
import { attachCoverOriginals } from "server/apis/spotify";
import { getAggregatedSetlists } from "server/setlists";

import { SetList } from "types";

export const getArtistSetlistSummary = async (
  artistName?: string,
  artistId?: string,
  tour?: string,
): Promise<SetList> => {
  const setList = await getArtistSetlist(artistName, artistId);
  const aggregated = getAggregatedSetlists(setList, tour);
  const tracks = await attachCoverOriginals(aggregated.tracks).catch(
    () => aggregated.tracks,
  );
  return { ...aggregated, tracks };
};

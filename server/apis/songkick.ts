import axios from "axios";

const URL = "https://api.songkick.com/api/3.0/events.json";

const { SKAPI } = process.env;

interface Event {
  id: number;
  performance: Array<{
    artist: {
      displayName: string;
    };
  }>;
  uri: string;
  start: { date: string; datetime: string | null };
  venue: { displayName: string };
  location: { city: string };
}

export const getArtistEvent = async (artist_name: string, ip: string) => {
  const { data } = await axios(URL, {
    params: {
      artist_name,
      location: `ip:${ip}`,
      apikey: SKAPI,
    },
  });
  return data?.resultsPage?.results?.event?.map((event: Event) => ({
    artist: event.performance[0].artist.displayName,
    id: String(event.id),
    buyUrl: event.uri,
    // Songkick leaves datetime null until the stage time is announced.
    date: event.start.datetime ?? event.start.date,
    venueName: event.venue.displayName,
    location: event.location.city,
  }));
};

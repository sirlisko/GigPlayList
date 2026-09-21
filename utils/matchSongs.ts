import { Link, Track } from "types";

export const normalizeSong = (str: string) =>
  str
    .normalize("NFD") // Decompose accents
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-zA-Z0-9\s]/g, "") // Remove special characters
    .toLowerCase(); // Convert to lowercase for case-insensitive comparison

export const isSameSong = (linkTitle: string, title: string) => {
  const song = normalizeSong(linkTitle);
  const normalizedTitle = normalizeSong(title);
  return (
    song === normalizedTitle ||
    normalizeSong(linkTitle.split(" - ")?.[0]) === normalizedTitle ||
    normalizeSong(linkTitle.split(" (feat. ")?.[0]) === normalizedTitle
  );
};

// Covers the artist recorded themselves must win over the original recording:
// "Hurt" belongs to Johnny Cash on a Johnny Cash playlist.
export const resolveTrack = ({ title, original }: Track, links: Link[]) =>
  links.find((link) => isSameSong(link.title, title)) ?? original;

export const matchSongs = (tracks: Track[], links: Link[]): Link[] =>
  tracks
    .map((track) => resolveTrack(track, links))
    .filter((link) => Boolean(link?.uri)) as Link[];

import { SetList, Track } from "types";

import {
  buildSetlistView,
  playlistTracks,
  typicalSetLength,
} from "./setlistView";

const track = (
  title: string,
  count: number,
  position: number,
  isEncore = false,
): Track => ({ title, count, position, isEncore, shows: [] });

// Sorted by play count, as the API returns them.
const tracks = [
  track("closer", 10, 0.9, true),
  track("opener", 10, 0),
  track("middle", 8, 0.5),
  track("early", 7, 0.2),
  track("rarity", 2, 0.4),
];

describe("typicalSetLength", () => {
  const setList = (totalTracks: number, totalSetLists: number) =>
    ({ totalTracks, totalSetLists }) as SetList;

  it("should round the average songs per show", () => {
    expect(typicalSetLength(setList(377, 19))).toBe(20);
  });

  it("should handle no shows", () => {
    expect(typicalSetLength(setList(0, 0))).toBe(0);
  });
});

describe("buildSetlistView", () => {
  it("should order a typical show by position with the encore last", () => {
    const view = buildSetlistView(tracks, 4, "running");
    expect(view.main.map(({ title }) => title)).toEqual([
      "opener",
      "early",
      "middle",
    ]);
    expect(view.encore.map(({ title }) => title)).toEqual(["closer"]);
    expect(view.extras.map(({ title }) => title)).toEqual(["rarity"]);
  });

  it("should keep play count order when sorting by most played", () => {
    const view = buildSetlistView(tracks, 4, "played");
    expect(view.main.map(({ title }) => title)).toEqual([
      "closer",
      "opener",
      "middle",
      "early",
    ]);
    expect(view.encore).toEqual([]);
    expect(view.extras.map(({ title }) => title)).toEqual(["rarity"]);
  });
});

describe("playlistTracks", () => {
  const view = buildSetlistView(tracks, 4, "running");

  it("should leave out the extras by default", () => {
    expect(playlistTracks(view, false).map(({ title }) => title)).toEqual([
      "opener",
      "early",
      "middle",
      "closer",
    ]);
  });

  it("should append the extras when asked", () => {
    expect(playlistTracks(view, true)).toHaveLength(5);
  });
});

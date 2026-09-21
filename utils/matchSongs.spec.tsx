import { Link, Track } from "types";

import { isSameSong, resolveTrack } from "./matchSongs";

describe("isSameSong", () => {
  it("should match same songs", () => {
    expect(isSameSong("freedom", "freedom")).toBeTruthy();
    expect(isSameSong("FREEDOM", "freedom")).toBeTruthy();
    expect(
      isSameSong("freedom (feat. kendrick lamar)", "freedom"),
    ).toBeTruthy();
    expect(
      isSameSong("frEEdom (feat. kendrick lamar)", "freedom"),
    ).toBeTruthy();
    expect(isSameSong("me gustas tú", "me gustas tu")).toBeTruthy();
    expect(
      isSameSong("now and then - remostered", "now and then"),
    ).toBeTruthy();
  });
});

describe("resolveTrack", () => {
  const link = (title: string): Link => ({
    title,
    uri: `spotify:track:${title}`,
    cover: "",
    previewUrl: "",
    duration_ms: 1000,
  });

  const track = (overrides: Partial<Track> = {}): Track => ({
    title: "hurt",
    count: 1,
    isEncore: false,
    shows: [],
    ...overrides,
  });

  it("should prefer the artist's own recording over the original", () => {
    const own = link("hurt");
    expect(
      resolveTrack(
        track({ cover: "Nine Inch Nails", original: link("hurt (original)") }),
        [own],
      ),
    ).toBe(own);
  });

  it("should fall back to the original when the artist never recorded it", () => {
    const original = link("hallelujah");
    expect(
      resolveTrack(
        track({ title: "hallelujah", cover: "Leonard Cohen", original }),
        [],
      ),
    ).toBe(original);
  });

  it("should resolve to nothing when neither is available", () => {
    expect(
      resolveTrack(track({ cover: "Nine Inch Nails" }), []),
    ).toBeUndefined();
  });
});

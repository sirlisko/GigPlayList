import { pickOriginal } from "./spotify";

const track = (name: string, artists: string[]) =>
  ({
    name,
    artists: artists.map((artist) => ({ name: artist })),
  }) as SpotifyApi.TrackObjectFull;

describe("pickOriginal", () => {
  it("should skip karaoke and tribute recordings", () => {
    const original = track("Hallelujah", ["Leonard Cohen"]);
    const items = [
      track("Hallelujah", ["Ameritz Karaoke Band"]),
      track("Hallelujah (Made Famous by Leonard Cohen)", ["The Tribute Co"]),
      original,
    ];
    expect(pickOriginal(items, "hallelujah", "Leonard Cohen")).toBe(original);
  });

  it("should match remastered releases", () => {
    const items = [track("Hallelujah - Remastered 2009", ["Leonard Cohen"])];
    expect(pickOriginal(items, "hallelujah", "Leonard Cohen")).toBe(items[0]);
  });

  it("should match a credited artist that is not the first", () => {
    const items = [track("Under Pressure", ["Queen", "David Bowie"])];
    expect(pickOriginal(items, "under pressure", "David Bowie")).toBe(items[0]);
  });

  it("should return nothing when the credited artist never appears", () => {
    const items = [track("Hallelujah", ["Ameritz Karaoke Band"])];
    expect(pickOriginal(items, "hallelujah", "Leonard Cohen")).toBeUndefined();
  });
});

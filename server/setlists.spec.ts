import { getAggregatedSetlists, Setlists } from "./setlists";

const fakeData: Setlists = {
  setlist: [
    {
      artist: { name: "best_artist" },
      eventDate: "2000-01-01",
      sets: {
        set: [
          {
            song: [
              { name: "fOo" },
              { name: "bar", cover: { name: "coverBand" } },
              { name: "foobar" },
              { name: "" },
            ],
          },
          { "@encore": "1", song: [{ name: "foo" }, { name: "barfoo" }] },
        ],
      },
    },
    { sets: "" },
    { sets: { set: { song: { name: "bar" } } }, eventDate: "1999-09-09" },
    {
      eventDate: "2000-01-01",
      sets: {
        set: [
          {
            song: [
              { name: "foo" },
              { name: "bar", cover: { name: "coverBand" } },
            ],
          },
          {
            "@encore": "1",
            song: [{ name: "BAR" }],
          },
          {
            encore: "2",
            song: [{ name: "bar" }, { name: "foobar" }],
          },
        ],
      },
    },
  ],
};

describe("setlists util", () => {
  describe("getAggregatedSetlists", () => {
    it("should return nomalized and aggregated data", () => {
      const d1 = { date: "2000-01-01", venue: undefined };
      const d1999 = { date: "1999-09-09", venue: undefined };
      expect(getAggregatedSetlists(fakeData)).toStrictEqual({
        encores: { "1": 2, "2": 1 },
        tour: null,
        from: "2000-01-01",
        to: "2000-01-01",
        totalSetLists: 3,
        totalTracks: 8,
        tracks: [
          {
            title: "bar",
            count: 3,
            cover: "coverBand",
            isEncore: false,
            position: (1 / 3 + 0 + 1 / 2) / 3,
            shows: [d1, d1999, d1],
          },
          {
            title: "fOo",
            count: 2,
            cover: undefined,
            isEncore: false,
            position: 0,
            shows: [d1, d1],
          },
          {
            title: "foobar",
            count: 2,
            cover: undefined,
            isEncore: false,
            position: (2 / 3 + 1) / 2,
            shows: [d1, d1],
          },
          {
            title: "barfoo",
            count: 1,
            cover: undefined,
            isEncore: true,
            position: 1,
            shows: [d1],
          },
        ],
      });
    });

    it("should return nomalized and aggregated data - with no encores", () => {
      const fakeSetNoEncores = {
        setlist: [
          {
            sets: { set: { song: { name: "bar" } } },
            eventDate: "1999-09-09",
          },
        ],
      };
      expect(getAggregatedSetlists(fakeSetNoEncores)).toStrictEqual({
        encores: null,
        tour: null,
        from: "1999-09-09",
        to: "1999-09-09",
        totalSetLists: 1,
        totalTracks: 1,
        tracks: [
          {
            title: "bar",
            count: 1,
            cover: undefined,
            isEncore: false,
            position: 0,
            shows: [{ date: "1999-09-09", venue: undefined }],
          },
        ],
      });
    });

    it("should return an empty shape without throwing when there are no legit setlists", () => {
      const fakeSetNoLegitSetlists: Setlists = {
        setlist: [{ sets: "" }],
      };
      expect(getAggregatedSetlists(fakeSetNoLegitSetlists)).toStrictEqual({
        tracks: [],
        totalSetLists: 0,
        totalTracks: 0,
        to: null,
        from: null,
        encores: null,
        tour: null,
      });
    });

    it("should format venue and mark encore-only songs", () => {
      const fakeSetWithVenue: Setlists = {
        setlist: [
          {
            eventDate: "2001-05-05",
            venue: { name: "The Forum", city: { name: "Inglewood" } },
            sets: {
              set: [
                { song: [{ name: "opener" }] },
                { "@encore": "1", song: [{ name: "closer" }] },
              ],
            },
          },
        ],
      };
      const result = getAggregatedSetlists(fakeSetWithVenue);
      expect(result.tracks).toStrictEqual([
        {
          title: "opener",
          count: 1,
          cover: undefined,
          isEncore: false,
          position: 0,
          shows: [{ date: "2001-05-05", venue: "The Forum, Inglewood" }],
        },
        {
          title: "closer",
          count: 1,
          cover: undefined,
          isEncore: true,
          position: 1,
          shows: [{ date: "2001-05-05", venue: "The Forum, Inglewood" }],
        },
      ]);
    });

    it("should name the tour only when every show belongs to it", () => {
      const show = (tour?: string) => ({
        eventDate: "2001-05-05",
        tour: tour ? { name: tour } : undefined,
        sets: { set: { song: { name: "song" } } },
      });
      expect(
        getAggregatedSetlists({ setlist: [show("Tour A"), show("Tour A")] })
          .tour,
      ).toBe("Tour A");
      expect(
        getAggregatedSetlists({ setlist: [show("Tour A"), show("Tour B")] })
          .tour,
      ).toBeNull();
      expect(
        getAggregatedSetlists({ setlist: [show("Tour A"), show()] }).tour,
      ).toBeNull();
    });
  });
});

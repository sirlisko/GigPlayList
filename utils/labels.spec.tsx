import { Link, SetList } from "types";
import {
  sanitiseDate,
  calculatePlaylistDuration,
  generateEncoreLabel,
} from "./labels";

describe("sanitiseDate", () => {
  it("should return null for empty date string", () => {
    expect(sanitiseDate("")).toBeNull();
  });

  it("should return a valid Date object for a correct date string", () => {
    const dateString = "07-10-2024";
    const result = sanitiseDate(dateString);
    expect(result).toBeInstanceOf(Date);
    expect(result?.getDate()).toBe(7);
    expect(result?.getMonth()).toBe(9);
    expect(result?.getFullYear()).toBe(2024);
  });

  it("should handle invalid date string", () => {
    const dateString = "invalid-date";
    const result = sanitiseDate(dateString);
    expect(result).toBeInstanceOf(Date);
    expect(isNaN(result?.getTime() as number)).toBe(true);
  });
});

describe("calculatePlaylistDuration", () => {
  it("should return 0 if no songs are passed", () => {
    expect(calculatePlaylistDuration([])).toBe(0);
  });

  it("should calculate duration correctly for a list of songs", () => {
    const songs = [{ duration_ms: 180000 }, { duration_ms: 240000 }] as Link[];
    const formattedDuration = "7 minutes";
    expect(calculatePlaylistDuration(songs)).toBe(formattedDuration);
  });
});

describe("generateEncoreLabel", () => {
  it("should return null if no encores are available", () => {
    const data = { totalSetLists: 10, encores: null } as unknown as SetList;
    expect(generateEncoreLabel(data)).toBeNull();
  });

  it("should generate the correct encore label", () => {
    const data = {
      totalSetLists: 10,
      encores: {
        1: 6,
        2: 3,
      },
    } as unknown as SetList;

    const result = generateEncoreLabel(data);
    const expectedLabel = (
      <>
        <strong>Encores: </strong>
        60% of shows had an encore, 30% a second
      </>
    );

    expect(result).toEqual(expectedLabel);
  });

  it("should handle encore number beyond the defined word list", () => {
    const data = {
      totalSetLists: 10,
      encores: {
        4: 5,
      },
    } as unknown as SetList;

    const result = generateEncoreLabel(data);
    const expectedLabel = (
      <>
        <strong>Encores: </strong>
        50% of shows had a 4th encore
      </>
    );

    expect(result).toEqual(expectedLabel);
  });
});

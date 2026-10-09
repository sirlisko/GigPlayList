import { blend, contrastWithWhite, readableUnderWhite, Rgb } from "./colors";

const DARK: Rgb = [40, 20, 10];

describe("contrastWithWhite", () => {
  it("should match the WCAG extremes", () => {
    expect(contrastWithWhite([0, 0, 0])).toBeCloseTo(21);
    expect(contrastWithWhite([255, 255, 255])).toBeCloseTo(1);
  });
});

describe("readableUnderWhite", () => {
  it("should keep a colour that is already dark enough", () => {
    expect(readableUnderWhite([150, 30, 20], 0.55, DARK)).toEqual([
      150, 30, 20,
    ]);
  });

  it("should darken a pale colour until white text passes AA", () => {
    const pale: Rgb = [250, 230, 120];
    const result = readableUnderWhite(pale, 0.55, DARK);
    expect(result).not.toEqual(pale);
    expect(
      contrastWithWhite(
        blend(result, 0.55, blend([255, 255, 255], 0.05, DARK)),
      ),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

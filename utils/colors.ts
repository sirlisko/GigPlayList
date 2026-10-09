export type Rgb = [number, number, number];

const WHITE: Rgb = [255, 255, 255];
// WCAG AA for body-size text.
const MIN_CONTRAST = 4.5;

const channel = (value: number) => {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
};

const luminance = ([r, g, b]: Rgb) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

export const contrastWithWhite = (rgb: Rgb) => 1.05 / (luminance(rgb) + 0.05);

export const blend = (top: Rgb, alpha: number, bottom: Rgb) =>
  top.map((value, i) => value * alpha + bottom[i] * (1 - alpha)) as Rgb;

// Artist palettes can be pale yellows or pastels; darken just enough that
// white text over the translucent colour stays readable.
export const readableUnderWhite = (
  color: Rgb,
  alpha: number,
  backdrop: Rgb,
): Rgb => {
  const base = blend(WHITE, 0.05, backdrop);
  let current = color;
  while (
    contrastWithWhite(blend(current, alpha, base)) < MIN_CONTRAST &&
    current.some((value) => value > 1)
  ) {
    current = current.map((value) => value * 0.9) as Rgb;
  }
  return current.map(Math.round) as Rgb;
};

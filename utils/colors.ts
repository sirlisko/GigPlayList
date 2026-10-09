export type Rgb = [number, number, number];

export const WHITE: Rgb = [255, 255, 255];
export const BLACK: Rgb = [0, 0, 0];
// WCAG AA for body-size text.
const MIN_CONTRAST = 4.5;
const MAX_STEPS = 40;

const channel = (value: number) => {
  const srgb = value / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
};

const luminance = ([r, g, b]: Rgb) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

export const contrast = (a: Rgb, b: Rgb) => {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
};

export const contrastWithWhite = (rgb: Rgb) => contrast(rgb, WHITE);

export const blend = (top: Rgb, alpha: number, bottom: Rgb) =>
  top.map((value, i) => value * alpha + bottom[i] * (1 - alpha)) as Rgb;

// Artist palettes can be anything from pale yellow to navy. Nudge the colour
// away from the text colour just enough that the text over it, laid
// translucently on the backdrop, stays readable.
export const readableUnder = (
  color: Rgb,
  alpha: number,
  backdrop: Rgb,
  text: Rgb,
): Rgb => {
  const away = luminance(text) > 0.5 ? BLACK : WHITE;
  let current = color;
  for (
    let step = 0;
    step < MAX_STEPS &&
    contrast(text, blend(current, alpha, backdrop)) < MIN_CONTRAST;
    step++
  ) {
    current = blend(away, 0.1, current);
  }
  return current.map(Math.round) as Rgb;
};

export const readableUnderWhite = (color: Rgb, alpha: number, backdrop: Rgb) =>
  readableUnder(color, alpha, blend(WHITE, 0.05, backdrop), WHITE);

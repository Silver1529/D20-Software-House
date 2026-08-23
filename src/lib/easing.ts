export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

export const progress = (t: number, from: number, to: number) =>
  clamp01((t - from) / (to - from))

export const easeOutQuart = (t: number) => 1 - (1 - t) ** 4

export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t))

export const easeInQuad = (t: number) => t * t

export const easeInOutQuint = (t: number) =>
  t < 0.5 ? 16 * t ** 5 : 1 - (-2 * t + 2) ** 5 / 2

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

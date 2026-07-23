export const psychotypeKeys = [
  "traditionalist",
  "independent",
  "aesthete",
  "hedonist",
] as const
export type PsychotypeKey = (typeof psychotypeKeys)[number]

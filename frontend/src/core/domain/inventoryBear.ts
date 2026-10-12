export type BearProp = "pot" | "box" | "books" | "wrench";

export type BearTone = "sky" | "rose" | "lilac" | "sun";

export type BearSymbol = "heart" | "star" | "rainbow" | "cloud";

export interface InventoryBear {
  id: string;
  name: string;
  room: string;
  label: string;
  prop: BearProp;
  tone: BearTone;
  symbol: BearSymbol;
  summary: string;
  quirk: string;
  items: string[];
}

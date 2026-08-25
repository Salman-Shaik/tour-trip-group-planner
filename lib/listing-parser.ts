import type { ListingPlatform } from "@/lib/types";

export type ParsedListing = {
  platform: ListingPlatform;
  normalizedUrl: string;
  metadata: Record<string, never>;
};

const PLATFORM_HOSTS: Array<[string, ListingPlatform]> = [
  ["airbnb.", "AIRBNB"],
  ["booking.com", "BOOKING"],
  ["agoda.", "AGODA"],
  ["makemytrip.com", "MAKEMYTRIP"],
  ["goibibo.com", "GOIBIBO"],
];

export function parseListingUrl(value: string): ParsedListing {
  const url = new URL(value);
  url.hash = "";
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  const platform = PLATFORM_HOSTS.find(([host]) => hostname.includes(host))?.[1] ?? "OTHER";

  return { platform, normalizedUrl: url.toString(), metadata: {} };
}

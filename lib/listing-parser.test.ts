import { describe,expect,it } from "vitest";
import { parseListingUrl } from "@/lib/listing-parser";

describe("listing URL parser",()=>{
  it.each([["https://www.airbnb.com/rooms/1","AIRBNB"],["https://booking.com/hotel/x","BOOKING"],["https://agoda.in/x","AGODA"],["https://makemytrip.com/hotels/x","MAKEMYTRIP"],["https://goibibo.com/hotels/x","GOIBIBO"],["https://example.com/stay","OTHER"]] as const)("detects %s",(url,platform)=>expect(parseListingUrl(url).platform).toBe(platform));
  it("normalizes www and removes fragments",()=>expect(parseListingUrl("https://www.booking.com/hotel/x#reviews").normalizedUrl).toBe("https://www.booking.com/hotel/x"));
  it("rejects malformed URLs",()=>expect(()=>parseListingUrl("not a url")).toThrow());
});

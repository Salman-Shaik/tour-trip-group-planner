import { describe,expect,it } from "vitest";
import { amenityKey } from "@/lib/amenity-key";
describe("amenity keys",()=>{it("normalizes ordinary labels",()=>expect(amenityKey(" Swimming Pool ")).toBe("swimming-pool"));it("preserves Unicode letters and numbers",()=>{expect(amenityKey("プール")).toBe("プール");expect(amenityKey("موقف سيارات")).toBe("موقف-سيارات")});it("uses a stable fallback for symbol-only labels",()=>{expect(amenityKey("🏊")).toMatch(/^amenity-[a-f0-9]{16}$/);expect(amenityKey("🏊")).toBe(amenityKey("🏊"));expect(amenityKey("🏊")).not.toBe(amenityKey("🚗"))});});

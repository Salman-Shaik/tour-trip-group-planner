import { describe,expect,it } from "vitest";
import { formatMoney,formatTripDates } from "@/lib/format";

describe("formatters",()=>{
  it("formats currencies in their corresponding locale",()=>{expect(formatMoney(4000,"INR")).toContain("4,000");expect(formatMoney(4000,"USD")).toContain("4,000");expect(formatMoney(4000,"EUR")).toContain("4,000")});
  it("compresses dates in the same month",()=>{const value=formatTripDates("2026-12-12","2026-12-15");expect(value).toContain("12");expect(value).toContain("December 15")});
  it("shows both months and the end year across a boundary",()=>{const value=formatTripDates("2026-12-30","2027-01-02");expect(value).toContain("Dec 30");expect(value).toContain("January 2, 2027")});
});

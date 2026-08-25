import { describe,expect,it } from "vitest";
import { calculateVoteScore,countVotes,VOTE_POINTS } from "@/lib/ranking";

describe("vote ranking",()=>{
  it("uses the expected weights",()=>expect(VOTE_POINTS).toEqual({LOVE:4,LIKE:3,MAYBE:2,NO:0}));
  it("scores unanimous love at 100",()=>expect(calculateVoteScore([{value:"LOVE"},{value:"LOVE"}],2)).toBe(100));
  it("includes eligible non-voters in the denominator",()=>expect(calculateVoteScore([{value:"LOVE"}],2)).toBe(50));
  it("returns zero without votes or eligible participants",()=>{expect(calculateVoteScore([],4)).toBe(0);expect(calculateVoteScore([{value:"LIKE"}],0)).toBe(0)});
  it("counts each response",()=>expect(countVotes([{value:"LOVE"},{value:"LIKE"},{value:"LOVE"},{value:"NO"}])).toEqual({LOVE:2,LIKE:1,MAYBE:0,NO:1}));
});

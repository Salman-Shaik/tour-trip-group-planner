import { describe,expect,it } from "vitest";
import { chooseFinalists,currentVotingRound,effectiveVotingState,finalistCount,isVotingOpen,usesSecondRound } from "@/lib/voting-lifecycle";
import type { Listing,Trip,Vote } from "@/lib/types";

const trip=(overrides:Partial<Trip>={}):Trip=>({id:"t",inviteCode:"t",name:"Trip",destination:"Goa",startDate:"2026-09-01",endDate:"2026-09-02",travellerCount:8,accommodationBudget:null,currency:"INR",creatorUserId:"u",creatorTokenHash:"",status:"ACTIVE",completedAt:null,selectedListingId:null,createdAt:"",updatedAt:"",votingMode:"AUTO",votingState:"ROUND_1_OPEN",votingDeadline:null,finalistListingIds:[],...overrides});
const listing=(id:string,totalPrice:number):Listing=>({id,tripId:"t",url:`https://example.com/${id}`,platform:"OTHER",propertyName:id,imageUrl:null,totalPrice,currency:"INR",maxGuests:8,bedrooms:null,beds:null,bathrooms:null,rating:null,reviewCount:null,location:"Goa",distanceNote:null,notes:null,tags:[],createdAt:id,updatedAt:""});

describe("voting lifecycle",()=>{
  it("locks an open round when its deadline passes",()=>expect(effectiveVotingState(trip({votingDeadline:"2026-08-25T00:00:00.000Z"}),new Date("2026-08-26T00:00:00.000Z"))).toBe("ROUND_1_LOCKED"));
  it("keeps a future deadline open",()=>expect(effectiveVotingState(trip({votingDeadline:"2026-08-27T00:00:00.000Z"}),new Date("2026-08-26T00:00:00.000Z"))).toBe("ROUND_1_OPEN"));
  it("does not change an explicitly locked round",()=>expect(effectiveVotingState(trip({votingState:"ROUND_2_LOCKED",votingDeadline:"2020-01-01T00:00:00.000Z"}))).toBe("ROUND_2_LOCKED"));
  it("defaults migrated trips to an open first round",()=>expect(effectiveVotingState(trip({votingState:undefined}))).toBe("ROUND_1_OPEN"));
  it("recognizes the final round",()=>expect(currentVotingRound(trip({votingState:"ROUND_2_OPEN"}))).toBe(2));
  it("reports whether the current round accepts votes",()=>{expect(isVotingOpen(trip())).toBe(true);expect(isVotingOpen(trip({votingState:"ROUND_1_LOCKED"}))).toBe(false)});
  it("uses automatic thresholds and explicit overrides",()=>{expect(usesSecondRound(trip(),5)).toBe(false);expect(usesSecondRound(trip(),6)).toBe(true);expect(usesSecondRound(trip({votingMode:"SINGLE"}),20)).toBe(false);expect(usesSecondRound(trip({votingMode:"TWO_ROUND"}),2)).toBe(true);expect(finalistCount(10)).toBe(3);expect(finalistCount(11)).toBe(5);});
  it("selects finalists by round-one score then price",()=>{const listings=[listing("a",300),listing("b",200),listing("c",100),listing("d",50)];const votes=[{id:"1",participantId:"p",listingId:"a",value:"LOVE",round:1,createdAt:"",updatedAt:""},{id:"2",participantId:"p",listingId:"b",value:"LIKE",round:1,createdAt:"",updatedAt:""},{id:"3",participantId:"p",listingId:"c",value:"NO",round:1,createdAt:"",updatedAt:""}] satisfies Vote[];expect(chooseFinalists(listings,votes)).toEqual(["a","b","d"]);});
  it("ignores final-round votes while choosing finalists",()=>{const listings=[listing("a",200),listing("b",100)];const votes=[{id:"1",participantId:"p",listingId:"a",value:"NO",round:1,createdAt:"",updatedAt:""},{id:"2",participantId:"p",listingId:"a",value:"LOVE",round:2,createdAt:"",updatedAt:""}] satisfies Vote[];expect(chooseFinalists(listings,votes)).toEqual(["b","a"])});
  it("uses creation order as the final deterministic tie-break",()=>{const a=listing("a",100);const b=listing("b",100);a.createdAt="2";b.createdAt="1";expect(chooseFinalists([a,b],[])).toEqual(["b","a"])});
  it("treats migrated votes without a round as round one",()=>{const listings=[listing("a",100)];const votes=[{id:"1",participantId:"p",listingId:"a",value:"LOVE",createdAt:"",updatedAt:""}] satisfies Vote[];expect(chooseFinalists(listings,votes)).toEqual(["a"])});
  it("handles a stale vote whose listing no longer exists",()=>{const votes=[{id:"1",participantId:"p",listingId:"missing",value:"LOVE",createdAt:"",updatedAt:""}] satisfies Vote[];expect(chooseFinalists([listing("a",100)],votes)).toEqual(["a"])});
});

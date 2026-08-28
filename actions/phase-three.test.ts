import { beforeEach,describe,expect,it,vi } from "vitest";
import { emptyDatabase } from "@/lib/db";
import type { Database,Trip } from "@/lib/types";

const mocks=vi.hoisted(()=>({
  database:null as Database|null,
  creator:vi.fn(async()=>true),
  userId:vi.fn(async()=>"user-1" as string|null),
  currentParticipant:vi.fn(async()=>null),
  participantSession:vi.fn(async()=>undefined),
  revalidate:vi.fn(),
  redirect:vi.fn(()=>{throw new Error("REDIRECT");}),
}));

vi.mock("next/cache",()=>({revalidatePath:mocks.revalidate}));
vi.mock("next/navigation",()=>({redirect:mocks.redirect}));
vi.mock("@/lib/creator-session",()=>({
  hashToken:(value:string)=>`hash:${value}`,
  isTripCreator:mocks.creator,
  getCreatorUserId:mocks.userId,
}));
vi.mock("@/lib/participant-session",()=>({
  createParticipantToken:()=>"new-participant-token",
  getCurrentParticipant:mocks.currentParticipant,
  setParticipantSession:mocks.participantSession,
}));
vi.mock("@/lib/db",async(importOriginal)=>{
  const original=await importOriginal<typeof import("@/lib/db")>();
  return{
    ...original,
    readDatabase:vi.fn(async()=>mocks.database!),
    updateDatabase:vi.fn(async(mutation:(database:Database)=>unknown)=>mutation(mocks.database!)),
  };
});

import { joinTrip,removeParticipant } from "@/actions/participants";
import { selectFinalStay } from "@/actions/selection";
import { setTripCancelled } from "@/actions/settings";
import { lockVoting } from "@/actions/voting";

const trip=(overrides:Partial<Trip>={}):Trip=>({id:"trip-1",inviteCode:"goa",name:"Goa",destination:"Goa",startDate:"2026-12-01",endDate:"2026-12-03",travellerCount:1,accommodationBudget:null,currency:"INR",creatorUserId:"host-1",creatorTokenHash:"",status:"ACTIVE",completedAt:null,selectedListingId:null,createdAt:"",updatedAt:"",...overrides});
const database=()=>{const value=emptyDatabase();value.trips.push(trip());return value;};

describe("phase three server actions",()=>{
  beforeEach(()=>{vi.clearAllMocks();mocks.creator.mockResolvedValue(true);mocks.userId.mockResolvedValue("user-1");mocks.currentParticipant.mockResolvedValue(null);mocks.database=database();});

  it("recovers a linked participant before applying the trip capacity limit",async()=>{
    mocks.database!.participants.push({id:"p1",tripId:"trip-1",name:"Pavani",sessionHash:"old",userId:"user-1",createdAt:"",updatedAt:""});
    const form=new FormData();form.set("name","Pavani");
    await expect(joinTrip("goa",{},form)).rejects.toThrow("REDIRECT");
    expect(mocks.database!.participants).toHaveLength(1);
    expect(mocks.redirect).toHaveBeenCalledWith("/trip/goa");
  });

  it("cancels once with a reason and can reopen without losing the activity",async()=>{
    const form=new FormData();form.set("reason","Weather warning");
    await setTripCancelled("goa",true,form);await setTripCancelled("goa",true,form);
    expect(mocks.database!.trips[0]).toMatchObject({status:"CANCELLED",cancellationReason:"Weather warning",completedAt:null});
    expect(mocks.database!.activityEvents.filter((item)=>item.type==="TRIP_CANCELLED")).toHaveLength(1);
    await setTripCancelled("goa",false);
    expect(mocks.database!.trips[0]).toMatchObject({status:"ACTIVE",cancelledAt:null,cancellationReason:null});
  });

  it("rejects result selection and voting changes while a trip is cancelled",async()=>{
    mocks.database!.trips[0]=trip({status:"CANCELLED",votingState:"ROUND_1_LOCKED"});
    mocks.database!.listings.push({id:"stay",tripId:"trip-1",url:"https://example.com",platform:"OTHER",propertyName:"Stay",imageUrl:null,totalPrice:100,currency:"INR",maxGuests:1,bedrooms:null,beds:null,bathrooms:null,rating:null,reviewCount:null,location:"Goa",distanceNote:null,notes:null,tags:[],createdAt:"",updatedAt:""});
    await selectFinalStay("goa","stay");await lockVoting("goa");
    expect(mocks.database!.trips[0].selectedListingId).toBeNull();
    expect(mocks.database!.trips[0].votingState).toBe("ROUND_1_LOCKED");
  });

  it("records cleanup achievement activity only for an inactive participant",async()=>{
    mocks.database!.participants.push({id:"inactive",tripId:"trip-1",name:"Guest",sessionHash:"",userId:null,createdAt:"",updatedAt:""});
    await removeParticipant("goa","inactive");
    expect(mocks.database!.activityEvents).toEqual([expect.objectContaining({type:"PARTICIPANT_REMOVED",userId:"host-1"})]);
  });
});

import { beforeEach,describe,expect,it,vi } from "vitest";
import type { Database,Participant,Trip } from "@/lib/types";
import { hashToken } from "@/lib/creator-session";

const mocks=vi.hoisted(()=>({get:vi.fn(),set:vi.fn(),auth:vi.fn(async()=>null as {user:{id:string}}|null)}));
vi.mock("next/headers",()=>({cookies:vi.fn(async()=>({get:mocks.get,set:mocks.set}))}));
vi.mock("@/auth",()=>({auth:mocks.auth}));
import { createParticipantToken,getCurrentParticipant,setParticipantSession } from "@/lib/participant-session";

const trip={id:"trip",inviteCode:"trip",name:"Trip",destination:"Goa",startDate:"2026-01-01",endDate:"2026-01-02",travellerCount:2,accommodationBudget:null,currency:"INR",creatorUserId:null,creatorTokenHash:"",status:"ACTIVE",completedAt:null,selectedListingId:null,createdAt:"",updatedAt:""} satisfies Trip;
const participant:Participant={id:"p",tripId:"trip",name:"Pavani",sessionHash:hashToken("token"),userId:null,createdAt:"",updatedAt:""};
const database={users:[],trips:[trip],participants:[participant],listings:[],amenities:[],listingAmenities:[],votes:[],comments:[],preferences:[],participantPreferences:[],activityEvents:[]} satisfies Database;

describe("participant sessions",()=>{
  beforeEach(()=>{vi.clearAllMocks();mocks.auth.mockResolvedValue(null)});
  it("creates strong unique tokens",()=>{const first=createParticipantToken();const second=createParticipantToken();expect(first.length).toBeGreaterThan(30);expect(first).not.toBe(second)});
  it("sets the participant cookie",async()=>{await setParticipantSession("trip","token");expect(mocks.set).toHaveBeenCalledWith("roamly_participant_trip","token",expect.objectContaining({httpOnly:true,sameSite:"lax",path:"/"}))});
  it("returns null without a cookie or account",async()=>{mocks.get.mockReturnValue(undefined);expect(await getCurrentParticipant(trip,database)).toBeNull()});
  it("finds only the matching browser participant",async()=>{mocks.get.mockReturnValue({value:"token"});expect(await getCurrentParticipant(trip,database)).toEqual(participant);mocks.get.mockReturnValue({value:"wrong"});expect(await getCurrentParticipant(trip,database)).toBeNull()});
  it("recovers a linked participant through Google on another browser",async()=>{mocks.get.mockReturnValue(undefined);mocks.auth.mockResolvedValue({user:{id:"user"}});const linked={...participant,userId:"user"};expect(await getCurrentParticipant(trip,{...database,participants:[linked]})).toEqual(linked)});
  it("does not cross trip boundaries for linked accounts",async()=>{mocks.auth.mockResolvedValue({user:{id:"user"}});expect(await getCurrentParticipant(trip,{...database,participants:[{...participant,tripId:"other",userId:"user"}]})).toBeNull()});
});

import { beforeEach,describe,expect,it,vi } from "vitest";
import type { Database,Participant,Trip } from "@/lib/types";
import { hashToken } from "@/lib/creator-session";

const mocks=vi.hoisted(()=>({get:vi.fn(),set:vi.fn()}));
vi.mock("next/headers",()=>({cookies:vi.fn(async()=>({get:mocks.get,set:mocks.set}))}));
vi.mock("@/auth",()=>({auth:vi.fn(async()=>null)}));
import { createParticipantToken,getCurrentParticipant,setParticipantSession } from "@/lib/participant-session";

const trip={id:"trip",inviteCode:"trip",name:"Trip",destination:"Goa",startDate:"2026-01-01",endDate:"2026-01-02",travellerCount:2,accommodationBudget:null,currency:"INR",creatorUserId:null,creatorTokenHash:"",status:"ACTIVE",completedAt:null,selectedListingId:null,createdAt:"",updatedAt:""} satisfies Trip;
const participant:Participant={id:"p",tripId:"trip",name:"Pavani",sessionHash:hashToken("token"),createdAt:"",updatedAt:""};
const database={users:[],trips:[trip],participants:[participant],listings:[],amenities:[],listingAmenities:[],votes:[],comments:[],preferences:[],participantPreferences:[]} satisfies Database;
describe("participant sessions",()=>{beforeEach(()=>vi.clearAllMocks());it("creates strong unique tokens",()=>{const first=createParticipantToken();const second=createParticipantToken();expect(first.length).toBeGreaterThan(30);expect(first).not.toBe(second)});it("sets the participant cookie",async()=>{await setParticipantSession("trip","token");expect(mocks.set).toHaveBeenCalledWith("roamly_participant_trip","token",expect.objectContaining({httpOnly:true,sameSite:"lax",path:"/"}))});it("returns null without a cookie",async()=>{mocks.get.mockReturnValue(undefined);expect(await getCurrentParticipant(trip,database)).toBeNull()});it("finds only the matching participant in the trip",async()=>{mocks.get.mockReturnValue({value:"token"});expect(await getCurrentParticipant(trip,database)).toEqual(participant);mocks.get.mockReturnValue({value:"wrong"});expect(await getCurrentParticipant(trip,database)).toBeNull()});});

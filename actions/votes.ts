"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { readDatabase, updateDatabase } from "@/lib/db";
import { getCurrentParticipant } from "@/lib/participant-session";
import type { VoteValue } from "@/lib/types";
import { voteSchema } from "@/lib/validation";

export type VoteResult={ok:boolean;message?:string;counts?:Record<VoteValue,number>};
export async function castVote(inviteCode:string,listingId:string,value:VoteValue):Promise<VoteResult>{
  const parsed=voteSchema.safeParse(value);if(!parsed.success)return{ok:false,message:"Choose a valid vote."};
  const database=await readDatabase();const trip=database.trips.find((item)=>item.inviteCode===inviteCode);if(!trip)return{ok:false,message:"Trip not found."};
  const participant=await getCurrentParticipant(trip,database);if(!participant)return{ok:false,message:"Join the trip before voting."};
  if(!database.listings.some((item)=>item.id===listingId&&item.tripId===trip.id))return{ok:false,message:"Stay not found."};
  const counts=await updateDatabase((data)=>{const existing=data.votes.find((vote)=>vote.participantId===participant.id&&vote.listingId===listingId);const now=new Date().toISOString();if(existing){existing.value=parsed.data;existing.updatedAt=now;}else data.votes.push({id:randomUUID(),participantId:participant.id,listingId,value:parsed.data,createdAt:now,updatedAt:now});const result:Record<VoteValue,number>={LOVE:0,LIKE:0,MAYBE:0,NO:0};data.votes.filter((vote)=>vote.listingId===listingId).forEach((vote)=>result[vote.value]++);return result;});
  revalidatePath(`/trip/${inviteCode}`);return{ok:true,counts};
}

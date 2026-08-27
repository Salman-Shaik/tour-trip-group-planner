"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { hashToken } from "@/lib/creator-session";
import { getCreatorUserId,isTripCreator } from "@/lib/creator-session";
import { readDatabase, updateDatabase } from "@/lib/db";
import { formValues, type FormState } from "@/lib/form-state";
import { createParticipantToken, getCurrentParticipant, setParticipantSession } from "@/lib/participant-session";
import { participantSchema } from "@/lib/validation";

export async function joinTrip(inviteCode:string,_state:FormState,formData:FormData):Promise<FormState>{
  const values=formValues(formData);const parsed=participantSchema.safeParse(values);if(!parsed.success)return{errors:parsed.error.flatten().fieldErrors,values,message:"Please check your name."};
  const database=await readDatabase();const trip=database.trips.find((item)=>item.inviteCode===inviteCode);if(!trip)return{message:"This trip could not be found.",values};
  const current=await getCurrentParticipant(trip,database);if(current)redirect(`/trip/${inviteCode}`);
  const userId=await getCreatorUserId();
  const token=createParticipantToken();const now=new Date().toISOString();
  const error=await updateDatabase((data)=>{const target=data.trips.find((item)=>item.id===trip.id);if(!target)return"This trip could not be found.";if(data.participants.filter((item)=>item.tripId===trip.id).length>=target.travellerCount)return`This trip is full (${target.travellerCount} travellers). Ask the host to increase the limit or remove an inactive participant.`;if(data.participants.some((item)=>item.tripId===trip.id&&item.name.localeCompare(parsed.data.name,undefined,{sensitivity:"base"})===0))return"That name is already being used on this trip. Add an initial or nickname so the group can tell you apart.";if(userId&&data.participants.some((item)=>item.tripId===trip.id&&item.userId===userId))return"Your Google account has already joined this trip.";data.participants.push({id:randomUUID(),tripId:trip.id,name:parsed.data.name.replace(/\s+/g," ").trim(),sessionHash:hashToken(token),userId,createdAt:now,updatedAt:now});return null;});
  if(error)return{message:error,values};
  await setParticipantSession(trip.id,token);redirect(`/trip/${inviteCode}`);
}

export async function removeParticipant(inviteCode:string,participantId:string){
  const database=await readDatabase();const trip=database.trips.find((item)=>item.inviteCode===inviteCode);
  if(!trip||!(await isTripCreator(trip)))return{ok:false,message:"Only the host can remove participants."};
  await updateDatabase((data)=>{const participant=data.participants.find((item)=>item.id===participantId&&item.tripId===trip.id);if(!participant)return;data.participants=data.participants.filter((item)=>item.id!==participant.id);data.votes=data.votes.filter((item)=>item.participantId!==participant.id);data.comments=data.comments.filter((item)=>item.participantId!==participant.id);data.participantPreferences=data.participantPreferences.filter((item)=>item.participantId!==participant.id);});
  revalidatePath(`/trip/${inviteCode}`);revalidatePath(`/trip/${inviteCode}/participants`);revalidatePath(`/trip/${inviteCode}/results`);return{ok:true};
}

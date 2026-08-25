"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { hashToken } from "@/lib/creator-session";
import { readDatabase, updateDatabase } from "@/lib/db";
import { formValues, type FormState } from "@/lib/form-state";
import { createParticipantToken, getCurrentParticipant, setParticipantSession } from "@/lib/participant-session";
import { participantSchema } from "@/lib/validation";

export async function joinTrip(inviteCode:string,_state:FormState,formData:FormData):Promise<FormState>{
  const values=formValues(formData);const parsed=participantSchema.safeParse(values);if(!parsed.success)return{errors:parsed.error.flatten().fieldErrors,values,message:"Please check your name."};
  const database=await readDatabase();const trip=database.trips.find((item)=>item.inviteCode===inviteCode);if(!trip)return{message:"This trip could not be found.",values};
  const current=await getCurrentParticipant(trip,database);if(current)redirect(`/trip/${inviteCode}`);
  if(database.participants.some((item)=>item.tripId===trip.id&&item.name.localeCompare(parsed.data.name,undefined,{sensitivity:"base"})===0))return{message:"That name is already being used on this trip. Add an initial or nickname so the group can tell you apart.",values};
  const token=createParticipantToken();const now=new Date().toISOString();
  await updateDatabase((data)=>data.participants.push({id:randomUUID(),tripId:trip.id,name:parsed.data.name.replace(/\s+/g," ").trim(),sessionHash:hashToken(token),createdAt:now,updatedAt:now}));
  await setParticipantSession(trip.id,token);redirect(`/trip/${inviteCode}`);
}

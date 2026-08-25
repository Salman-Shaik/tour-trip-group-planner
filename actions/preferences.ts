"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { readDatabase,updateDatabase } from "@/lib/db";
import type { FormState } from "@/lib/form-state";
import { getCurrentParticipant } from "@/lib/participant-session";

const importance=z.enum(["NOT_IMPORTANT","NICE_TO_HAVE","IMPORTANT","MUST_HAVE"]);
export async function savePreferences(inviteCode:string,_state:FormState,formData:FormData):Promise<FormState>{const database=await readDatabase();const trip=database.trips.find((item)=>item.inviteCode===inviteCode);if(!trip)return{message:"Trip not found."};const participant=await getCurrentParticipant(trip,database);if(!participant)return{message:"Join the trip before saving preferences."};const preferences=database.preferences;const parsed=preferences.map((preference)=>({preference,value:importance.safeParse(formData.get(`preference_${preference.id}`))}));if(parsed.some((item)=>!item.value.success))return{message:"One or more importance choices were invalid."};const now=new Date().toISOString();await updateDatabase((data)=>{data.participantPreferences=data.participantPreferences.filter((item)=>item.participantId!==participant.id);data.participantPreferences.push(...parsed.map(({preference,value})=>({participantId:participant.id,preferenceId:preference.id,importance:value.data!,createdAt:now,updatedAt:now})));});revalidatePath(`/trip/${inviteCode}/preferences`);revalidatePath(`/trip/${inviteCode}/results`);return{message:"Your preferences are saved."};}

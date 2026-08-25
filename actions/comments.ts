"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readDatabase,updateDatabase } from "@/lib/db";
import { formValues,type FormState } from "@/lib/form-state";
import { getCurrentParticipant } from "@/lib/participant-session";
import { commentSchema } from "@/lib/validation";

export async function addComment(inviteCode:string,listingId:string,_state:FormState,formData:FormData):Promise<FormState>{const values=formValues(formData);const parsed=commentSchema.safeParse(values);if(!parsed.success)return{errors:parsed.error.flatten().fieldErrors,values};const database=await readDatabase();const trip=database.trips.find((item)=>item.inviteCode===inviteCode);if(!trip)return{message:"Trip not found.",values};const participant=await getCurrentParticipant(trip,database);if(!participant)return{message:"Join the trip before commenting.",values};if(!database.listings.some((item)=>item.id===listingId&&item.tripId===trip.id))return{message:"Stay not found.",values};const now=new Date().toISOString();await updateDatabase((data)=>data.comments.push({id:randomUUID(),participantId:participant.id,listingId,body:parsed.data.body,createdAt:now,updatedAt:now}));revalidatePath(`/trip/${inviteCode}`);redirect(`/trip/${inviteCode}/listings/${listingId}#discussion`);}

export async function deleteComment(inviteCode:string,listingId:string,commentId:string){const database=await readDatabase();const trip=database.trips.find((item)=>item.inviteCode===inviteCode);if(!trip)return;const participant=await getCurrentParticipant(trip,database);if(!participant)return;await updateDatabase((data)=>{const comment=data.comments.find((item)=>item.id===commentId&&item.listingId===listingId);if(!comment||comment.participantId!==participant.id)return;data.comments=data.comments.filter((item)=>item.id!==commentId);});revalidatePath(`/trip/${inviteCode}/listings/${listingId}`);}

"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readDatabase, updateDatabase } from "@/lib/db";
import { isTripCreator } from "@/lib/creator-session";
import { formValues, type FormState } from "@/lib/form-state";
import { tripSchema } from "@/lib/validation";

export async function updateTripSettings(inviteCode:string,_state:FormState,formData:FormData):Promise<FormState>{
  const values=formValues(formData); const parsed=tripSchema.safeParse(values);
  if(!parsed.success)return{errors:parsed.error.flatten().fieldErrors,values,message:"Please check the highlighted fields."};
  const trip=(await readDatabase()).trips.find((item)=>item.inviteCode===inviteCode);
  if(!trip||!(await isTripCreator(trip)))return{values,message:"Only the trip creator can change settings."};
  await updateDatabase((database)=>{const target=database.trips.find((item)=>item.id===trip.id);if(target)Object.assign(target,parsed.data,{accommodationBudget:parsed.data.accommodationBudget??null,updatedAt:new Date().toISOString()});});
  revalidatePath("/"); revalidatePath(`/trip/${inviteCode}`); revalidatePath(`/trip/${inviteCode}/settings`);
  return{values:{...values},message:"Trip settings saved."};
}

export async function setTripCompleted(inviteCode:string,completed:boolean){
  const trip=(await readDatabase()).trips.find((item)=>item.inviteCode===inviteCode);
  if(!trip||!(await isTripCreator(trip)))return;
  await updateDatabase((database)=>{const target=database.trips.find((item)=>item.id===trip.id);if(target){const now=new Date().toISOString();target.status=completed?"COMPLETED":"ACTIVE";target.completedAt=completed?now:null;target.cancelledAt=null;target.cancellationReason=null;target.updatedAt=now;}});
  revalidatePath("/"); revalidatePath(`/trip/${inviteCode}`); revalidatePath(`/trip/${inviteCode}/settings`);
}

export async function setTripCancelled(inviteCode:string,cancelled:boolean,formData?:FormData){
  const trip=(await readDatabase()).trips.find((item)=>item.inviteCode===inviteCode);
  if(!trip||!(await isTripCreator(trip)))return;
  const reason=cancelled?String(formData?.get("reason")??"").trim().slice(0,500)||null:null;
  await updateDatabase((database)=>{const target=database.trips.find((item)=>item.id===trip.id);if(!target||cancelled&&target.status==="COMPLETED")return;const now=new Date().toISOString();target.status=cancelled?"CANCELLED":"ACTIVE";target.cancelledAt=cancelled?now:null;target.cancellationReason=reason;target.completedAt=null;target.updatedAt=now;if(cancelled&&target.creatorUserId&&!database.activityEvents.some((item)=>item.userId===target.creatorUserId&&item.tripId===target.id&&item.type==="TRIP_CANCELLED"))database.activityEvents.push({id:randomUUID(),userId:target.creatorUserId,tripId:target.id,type:"TRIP_CANCELLED",createdAt:now});});
  revalidatePath("/");revalidatePath("/trips");revalidatePath(`/trip/${inviteCode}`);revalidatePath(`/trip/${inviteCode}/settings`);
}

export async function deleteTrip(inviteCode:string){
  const trip=(await readDatabase()).trips.find((item)=>item.inviteCode===inviteCode);
  if(!trip||!(await isTripCreator(trip)))return;
  await updateDatabase((database)=>{
    const participantIds=new Set(database.participants.filter((item)=>item.tripId===trip.id).map((item)=>item.id));
    const listingIds=new Set(database.listings.filter((item)=>item.tripId===trip.id).map((item)=>item.id));
    if(trip.creatorUserId)database.activityEvents.push({id:randomUUID(),userId:trip.creatorUserId,tripId:null,type:"TRIP_DELETED",createdAt:new Date().toISOString()});
    database.trips=database.trips.filter((item)=>item.id!==trip.id);
    database.participants=database.participants.filter((item)=>item.tripId!==trip.id);
    database.listings=database.listings.filter((item)=>item.tripId!==trip.id);
    database.listingAmenities=database.listingAmenities.filter((item)=>!listingIds.has(item.listingId));
    database.votes=database.votes.filter((item)=>!listingIds.has(item.listingId)&&!participantIds.has(item.participantId));
    database.comments=database.comments.filter((item)=>!listingIds.has(item.listingId)&&!participantIds.has(item.participantId));
    database.participantPreferences=database.participantPreferences.filter((item)=>!participantIds.has(item.participantId));
  });
  revalidatePath("/");revalidatePath("/trips");redirect("/trips");
}

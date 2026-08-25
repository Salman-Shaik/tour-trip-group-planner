"use server";

import { revalidatePath } from "next/cache";
import { isTripCreator } from "@/lib/creator-session";
import { readDatabase,updateDatabase } from "@/lib/db";

export async function selectFinalStay(inviteCode:string,listingId:string){const database=await readDatabase();const trip=database.trips.find((item)=>item.inviteCode===inviteCode);if(!trip||!(await isTripCreator(trip)))return;if(!database.listings.some((item)=>item.id===listingId&&item.tripId===trip.id))return;await updateDatabase((data)=>{const target=data.trips.find((item)=>item.id===trip.id);if(target){target.selectedListingId=listingId;target.updatedAt=new Date().toISOString();}});revalidatePath(`/trip/${inviteCode}`);revalidatePath(`/trip/${inviteCode}/results`);revalidatePath(`/trip/${inviteCode}/compare`);}

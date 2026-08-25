"use server";

import { redirect } from "next/navigation";
import { hashToken,setCreatorSession } from "@/lib/creator-session";
import { readDatabase } from "@/lib/db";
import { SEEDED_CREATOR_TOKEN,SEEDED_TRIP_INVITE_CODE } from "@/lib/seed-constants";

export async function openSeededTripAsCreator(){if(process.env.NODE_ENV==="production")return;const trip=(await readDatabase()).trips.find((item)=>item.inviteCode===SEEDED_TRIP_INVITE_CODE);if(!trip||trip.creatorTokenHash!==hashToken(SEEDED_CREATOR_TOKEN))return;await setCreatorSession(trip.id,SEEDED_CREATOR_TOKEN);redirect(`/trip/${trip.inviteCode}`);}

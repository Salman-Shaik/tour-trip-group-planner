import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { hashToken } from "@/lib/creator-session";
import type { Database, Participant, Trip } from "@/lib/types";

const cookieName=(tripId:string)=>`roamly_participant_${tripId}`;
export function createParticipantToken(){return randomBytes(32).toString("base64url");}
export async function setParticipantSession(tripId:string,token:string){(await cookies()).set(cookieName(tripId),token,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*24*365});}
export async function getCurrentParticipant(trip:Trip,database:Database):Promise<Participant|null>{const token=(await cookies()).get(cookieName(trip.id))?.value;if(!token)return null;const sessionHash=hashToken(token);return database.participants.find((item)=>item.tripId===trip.id&&item.sessionHash===sessionHash)??null;}

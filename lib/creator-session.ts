import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import type { Database, Trip } from "@/lib/types";

const cookieName = (tripId:string) => `roamly_creator_${tripId}`;
export const hashToken = (token:string) => createHash("sha256").update(token).digest("hex");

export async function setCreatorSession(tripId:string, token:string) {
  const store = await cookies();
  store.set(cookieName(tripId), token, { httpOnly:true, sameSite:"lax", secure:process.env.NODE_ENV === "production", path:"/", maxAge:60 * 60 * 24 * 180 });
}

export async function isTripCreator(trip:Trip) {
  const session=await auth();
  if (session?.user.id && trip.creatorUserId===session.user.id) return true;
  const token = (await cookies()).get(cookieName(trip.id))?.value;
  if (!token) return false;
  const actual = Buffer.from(hashToken(token));
  const expected = Buffer.from(trip.creatorTokenHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function getCreatorTrips(database:Database) {
  const session=await auth();
  const store=await cookies();
  return database.trips.filter((trip)=>{
    if(session?.user.id && trip.creatorUserId===session.user.id)return true;
    const token=store.get(cookieName(trip.id))?.value;
    if(!token)return false;
    const actual=Buffer.from(hashToken(token));
    const expected=Buffer.from(trip.creatorTokenHash);
    return actual.length===expected.length&&timingSafeEqual(actual,expected);
  });
}

export async function getCreatorUserId(){ return (await auth())?.user.id ?? null; }

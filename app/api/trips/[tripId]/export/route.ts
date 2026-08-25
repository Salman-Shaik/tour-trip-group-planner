import { NextResponse } from "next/server";
import { isTripCreator } from "@/lib/creator-session";
import { exportTripsDatabase } from "@/lib/database-export";
import { readDatabase } from "@/lib/db";
export async function GET(_request:Request,{params}:{params:Promise<{tripId:string}>}){const{tripId}=await params;const database=await readDatabase();const trip=database.trips.find((item)=>item.inviteCode===tripId);if(!trip)return NextResponse.json({error:"Trip not found"},{status:404});if(!(await isTripCreator(trip)))return NextResponse.json({error:"Forbidden"},{status:403});const backup=exportTripsDatabase(database,[trip.id]);return new NextResponse(`${JSON.stringify(backup,null,2)}\n`,{headers:{"Content-Type":"application/json; charset=utf-8","Content-Disposition":`attachment; filename="roamly-${trip.inviteCode}-backup.json"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});}

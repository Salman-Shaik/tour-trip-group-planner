import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { exportTripsDatabase } from "@/lib/database-export";
import { readDatabase } from "@/lib/db";
export async function GET(){const session=await auth();if(!session?.user.id)return NextResponse.json({error:"Unauthorized"},{status:401});const database=await readDatabase();const tripIds=database.trips.filter((item)=>item.creatorUserId===session.user.id).map((item)=>item.id);const backup=exportTripsDatabase(database,tripIds);return new NextResponse(`${JSON.stringify(backup,null,2)}\n`,{headers:{"Content-Type":"application/json; charset=utf-8","Content-Disposition":`attachment; filename="roamly-account-backup-${new Date().toISOString().slice(0,10)}.json"`,"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});}

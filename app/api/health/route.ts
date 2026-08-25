import { NextResponse } from "next/server";
import { readDatabase } from "@/lib/db";
export const dynamic="force-dynamic";
export async function GET(){try{await readDatabase();return NextResponse.json({status:"ok",timestamp:new Date().toISOString()},{headers:{"Cache-Control":"no-store"}})}catch{ return NextResponse.json({status:"unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});}}

"use server";
import { revalidatePath } from "next/cache";
import { readDatabase,updateDatabase } from "@/lib/db";
import { isTripCreator } from "@/lib/creator-session";
import { chooseFinalists,effectiveVotingState,usesSecondRound } from "@/lib/voting-lifecycle";

const refresh=(inviteCode:string)=>{revalidatePath(`/trip/${inviteCode}`);revalidatePath(`/trip/${inviteCode}/results`);revalidatePath(`/trip/${inviteCode}/settings`);};

export async function configureVoting(inviteCode:string,_state:unknown,formData:FormData){
  const database=await readDatabase();const trip=database.trips.find((item)=>item.inviteCode===inviteCode);if(!trip||!(await isTripCreator(trip)))return{message:"Only the host can configure voting."};
  const mode=formData.get("votingMode");if(!["AUTO","SINGLE","TWO_ROUND"].includes(String(mode)))return{message:"Choose a valid voting format."};
  const deadline=String(formData.get("votingDeadline")??"").trim();const offset=Number(formData.get("timezoneOffset")??0);const parts=deadline.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);const parsedDeadline=parts?new Date(Date.UTC(+parts[1],+parts[2]-1,+parts[3],+parts[4],+parts[5])+offset*60_000):null;if(deadline&&!parts)return{message:"Choose a valid voting deadline."};
  await updateDatabase((data)=>{const target=data.trips.find((item)=>item.id===trip.id);if(target){const currentState=effectiveVotingState(target);target.votingMode=mode as "AUTO"|"SINGLE"|"TWO_ROUND";target.votingState=currentState;target.votingDeadline=currentState.endsWith("LOCKED")?null:parsedDeadline?.toISOString()??null;target.updatedAt=new Date().toISOString();}});refresh(inviteCode);return{message:"Voting settings saved."};
}

export async function lockVoting(inviteCode:string){const database=await readDatabase();const trip=database.trips.find((item)=>item.inviteCode===inviteCode);if(!trip||!(await isTripCreator(trip)))return;await updateDatabase((data)=>{const target=data.trips.find((item)=>item.id===trip.id);if(!target)return;const state=effectiveVotingState(target);target.votingState=state.startsWith("ROUND_2")?"ROUND_2_LOCKED":"ROUND_1_LOCKED";target.votingDeadline=null;target.updatedAt=new Date().toISOString();});refresh(inviteCode);}

export async function reopenVoting(inviteCode:string){const database=await readDatabase();const trip=database.trips.find((item)=>item.inviteCode===inviteCode);if(!trip||!(await isTripCreator(trip)))return;await updateDatabase((data)=>{const target=data.trips.find((item)=>item.id===trip.id);if(!target)return;const state=effectiveVotingState(target);target.votingState=state.startsWith("ROUND_2")?"ROUND_2_OPEN":"ROUND_1_OPEN";target.votingDeadline=null;target.updatedAt=new Date().toISOString();});refresh(inviteCode);}

export async function startFinalRound(inviteCode:string){const database=await readDatabase();const trip=database.trips.find((item)=>item.inviteCode===inviteCode);if(!trip||!(await isTripCreator(trip))||effectiveVotingState(trip)!=="ROUND_1_LOCKED")return;const listings=database.listings.filter((item)=>item.tripId===trip.id);if(!usesSecondRound(trip,listings.length))return;const ids=chooseFinalists(listings,database.votes);await updateDatabase((data)=>{const target=data.trips.find((item)=>item.id===trip.id);if(target){target.finalistListingIds=ids;target.votingState="ROUND_2_OPEN";target.votingDeadline=null;target.updatedAt=new Date().toISOString();}});refresh(inviteCode);}

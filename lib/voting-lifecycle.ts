import { VOTE_POINTS } from "@/lib/ranking";
import type { Listing,Trip,Vote,VotingState } from "@/lib/types";

export function effectiveVotingState(trip:Trip,now=new Date()):VotingState{
  const state=trip.votingState??"ROUND_1_OPEN";
  if(!state.endsWith("_OPEN")||!trip.votingDeadline)return state;
  return new Date(trip.votingDeadline).getTime()<=now.getTime()?state.replace("_OPEN","_LOCKED") as VotingState:state;
}

export function currentVotingRound(trip:Trip,now=new Date()):1|2{return effectiveVotingState(trip,now).startsWith("ROUND_2")?2:1;}
export function isVotingOpen(trip:Trip,now=new Date()){return trip.status==="ACTIVE"&&effectiveVotingState(trip,now).endsWith("_OPEN");}
export function usesSecondRound(trip:Trip,listingCount:number){return trip.votingMode==="TWO_ROUND"||(trip.votingMode!=="SINGLE"&&listingCount>5);}
export function finalistCount(listingCount:number){return listingCount>10?5:3;}

export function chooseFinalists(listings:Listing[],votes:Vote[]){
  const scores=new Map(listings.map((listing)=>[listing.id,0]));
  votes.filter((vote)=>(vote.round??1)===1).forEach((vote)=>scores.set(vote.listingId,(scores.get(vote.listingId)??0)+VOTE_POINTS[vote.value]));
  return [...listings].sort((a,b)=>(scores.get(b.id)??0)-(scores.get(a.id)??0)||a.totalPrice-b.totalPrice||a.createdAt.localeCompare(b.createdAt)).slice(0,Math.min(finalistCount(listings.length),listings.length)).map((listing)=>listing.id);
}

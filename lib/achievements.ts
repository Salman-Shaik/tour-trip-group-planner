import type { Database } from "@/lib/types";

export type Achievement = { id:string; title:string; description:string; medal:"MILESTONE"|"BRONZE"|"SILVER"|"GOLD"; unlocked:boolean; progress:number; target:number };

function tiered(id:string,title:string,count:number,thresholds:[number,number,number],unit:string):Achievement[]{
  return (["BRONZE","SILVER","GOLD"] as const).map((medal,index)=>({id:`${id}-${medal.toLowerCase()}`,title:`${medal[0]}${medal.slice(1).toLowerCase()} ${title}`,description:`${thresholds[index]} ${unit}`,medal,unlocked:count>=thresholds[index],progress:Math.min(count,thresholds[index]),target:thresholds[index]}));
}

export function achievementsForUser(database:Database,userId:string):Achievement[]{
  const hosted=database.trips.filter((trip)=>trip.creatorUserId===userId);
  const joinedIds=new Set(database.participants.filter((participant)=>participant.userId===userId).map((participant)=>participant.tripId));
  const joined=database.trips.filter((trip)=>joinedIds.has(trip.id));
  const successful=hosted.filter((trip)=>{const participants=database.participants.filter((item)=>item.tripId===trip.id);const listingIds=new Set(database.listings.filter((item)=>item.tripId===trip.id).map((item)=>item.id));const voters=new Set(database.votes.filter((vote)=>listingIds.has(vote.listingId)).map((vote)=>vote.participantId));return trip.status==="COMPLETED"&&Boolean(trip.selectedListingId)&&participants.length>=2&&listingIds.size>=2&&voters.size>=Math.min(2,participants.length)});
  const participantIds=new Set(database.participants.filter((item)=>item.userId===userId).map((item)=>item.id));
  const voteCount=database.votes.filter((vote)=>participantIds.has(vote.participantId)).length;
  const finalized=joined.filter((trip)=>Boolean(trip.selectedListingId)).length;
  const event=(type:string)=>database.activityEvents.some((item)=>item.userId===userId&&item.type===type);
  const milestone=(id:string,title:string,description:string,unlocked:boolean):Achievement=>({id,title,description,medal:"MILESTONE",unlocked,progress:unlocked?1:0,target:1});
  return [
    milestone("first-takeoff","First Takeoff","Successfully host your first completed group trip.",successful.length>=1),
    milestone("plot-twist","Plot Twist","Cancel a trip when plans change.",event("TRIP_CANCELLED")),
    milestone("phoenix","Phoenix Trip","Complete a trip after previously cancelling it.",successful.some((trip)=>database.activityEvents.some((item)=>item.tripId===trip.id&&item.type==="TRIP_CANCELLED"))),
    milestone("fresh-start","Fresh Start","Delete a trip that no longer belongs in your plans.",event("TRIP_DELETED")),
    milestone("clean-roster","Clean Roster","Remove an inactive participant from a hosted trip.",event("PARTICIPANT_REMOVED")),
    ...tiered("host","Seasoned Host",successful.length,[5,15,40],"successfully hosted trips"),
    ...tiered("traveller","Group Traveller",joined.length,[10,30,75],"joined trips"),
    ...tiered("voter","Dedicated Voter",voteCount,[100,500,1500],"votes cast"),
    ...tiered("decision","Decision Maker",finalized,[5,20,50],"finalized trips"),
  ];
}

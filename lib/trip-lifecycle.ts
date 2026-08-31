import type { Trip } from "@/lib/types";

export type TripLifecycle="ACTIVE"|"PAST"|"COMPLETED"|"CANCELLED";
export function getTripLifecycle(trip:Trip,today=new Date().toISOString().slice(0,10)):TripLifecycle {
  if(trip.status==="CANCELLED")return "CANCELLED";
  if(trip.status==="COMPLETED")return "COMPLETED";
  return trip.endDate<today?"PAST":"ACTIVE";
}
export function groupTrips<T extends Trip>(trips:T[],today?:string){
  return trips.reduce((groups,trip)=>{groups[getTripLifecycle(trip,today)].push(trip);return groups;},{ACTIVE:[] as T[],PAST:[] as T[],COMPLETED:[] as T[],CANCELLED:[] as T[]});
}

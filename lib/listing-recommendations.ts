import type { Database,Listing,Trip } from "@/lib/types";

const words=(value:string)=>new Set(value.toLowerCase().normalize("NFKD").match(/[a-z0-9]+/g)??[]);
export function previousListingSuggestions(database:Database,target:Trip,limit=6):Listing[]{
  if(!target.creatorUserId)return[];const destinationWords=words(target.destination);const ownedTrips=new Map(database.trips.filter((trip)=>trip.id!==target.id&&trip.creatorUserId===target.creatorUserId).map((trip)=>[trip.id,trip]));
  return database.listings.flatMap((listing)=>{const source=ownedTrips.get(listing.tripId);if(!source||source.selectedListingId===listing.id)return[];const overlap=[...words(`${source.destination} ${listing.location}`)].filter((word)=>destinationWords.has(word)).length;if(!overlap)return[];const capacityFit=listing.maxGuests>=target.travellerCount?1:0;return[{listing,score:overlap*10+capacityFit-(Math.abs(listing.maxGuests-target.travellerCount)/100)}]}).sort((a,b)=>b.score-a.score||b.listing.updatedAt.localeCompare(a.listing.updatedAt)).slice(0,limit).map((item)=>item.listing);
}

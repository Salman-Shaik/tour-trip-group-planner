import Link from "next/link";
import { BedDouble, Plus } from "lucide-react";
import { ListingCard } from "@/components/listing/ListingCard";
import type { Amenity, Listing, VoteValue } from "@/lib/types";

type CardListing = Listing & { amenities:Amenity[]; voteCounts:Record<VoteValue,number>; currentVote:VoteValue|null; commentCount:number };
export function ListingGrid({ listings, travellerCount, inviteCode, isCreator, selectedListingId, canVote }: { listings:CardListing[]; travellerCount:number; inviteCode:string; isCreator:boolean; selectedListingId:string|null; canVote:boolean }) {
  if (!listings.length) return <div className="rounded-[2rem] border border-dashed border-[#cfd8d4] bg-white px-6 py-16 text-center sm:py-20"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#e7f1ed] text-[#1f7168]"><BedDouble size={27}/></span><h2 className="display-font mt-5 text-3xl">No stays yet.</h2><p className="mx-auto mt-3 max-w-lg leading-7 text-[#63716d]">Paste your first Airbnb, Booking.com, hotel, or other accommodation option and start comparing.</p>{isCreator ? <Link href={`/trip/${inviteCode}/listings/new`} className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#e85d3f] px-6 font-bold text-white"><Plus size={18}/> Add your first stay</Link> : <p className="mt-6 text-sm font-semibold text-[#52645f]">The trip creator will add options soon.</p>}</div>;
  return <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{listings.map((listing)=><ListingCard key={listing.id} listing={listing} travellerCount={travellerCount} inviteCode={inviteCode} isCreator={isCreator} selected={selectedListingId===listing.id} canVote={canVote}/>)}</div>;
}

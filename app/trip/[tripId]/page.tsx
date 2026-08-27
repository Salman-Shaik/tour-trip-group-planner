import type { Metadata } from "next";
import Link from "next/link";
import { notFound,redirect } from "next/navigation";
import { ListingGrid } from "@/components/listing/ListingGrid";
import { TripHeader } from "@/components/trip/TripHeader";
import { TripNavigation } from "@/components/trip/TripNavigation";
import { isTripCreator } from "@/lib/creator-session";
import { readDatabase } from "@/lib/db";
import { getCurrentParticipant } from "@/lib/participant-session";
import type { VoteValue } from "@/lib/types";
import { currentVotingRound } from "@/lib/voting-lifecycle";

type Props = { params:Promise<{ tripId:string }> };
export async function generateMetadata({ params }:Props): Promise<Metadata> { const { tripId }=await params; const trip=(await readDatabase()).trips.find((item)=>item.inviteCode===tripId); return { title:trip ? `${trip.name} — Roamly` : "Trip not found — Roamly" }; }

export default async function TripPage({ params }:Props) {
  const { tripId:inviteCode } = await params;
  const database = await readDatabase();
  const trip = database.trips.find((item)=>item.inviteCode===inviteCode);
  if (!trip) notFound();
  const creator = await isTripCreator(trip);
  const participant=await getCurrentParticipant(trip,database);
  if(!creator&&!participant)redirect(`/trip/${inviteCode}/join`);
  const round=currentVotingRound(trip);const finalistIds=new Set(trip.finalistListingIds??[]);
  const tripListings=database.listings.filter((item)=>item.tripId===trip.id);const visibleListings=round===2?tripListings.filter((item)=>finalistIds.has(item.id)):tripListings;
  const listings = visibleListings.map((listing)=>{
    const amenityIds=database.listingAmenities.filter((item)=>item.listingId===listing.id).map((item)=>item.amenityId);
    const counts:Record<VoteValue,number>={ LOVE:0,LIKE:0,MAYBE:0,NO:0 };
    database.votes.filter((vote)=>vote.listingId===listing.id&&(vote.round??1)===round).forEach((vote)=>counts[vote.value]++);
    const currentVote=participant?database.votes.find((vote)=>vote.listingId===listing.id&&vote.participantId===participant.id&&(vote.round??1)===round)?.value??null:null;
    return { ...listing,amenities:database.amenities.filter((amenity)=>amenityIds.includes(amenity.id)),voteCounts:counts,currentVote,commentCount:database.comments.filter((comment)=>comment.listingId===listing.id).length };
  }).sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  return <main className="min-h-screen"><TripHeader trip={trip} isCreator={creator}/><TripNavigation inviteCode={inviteCode} active="stays"/><section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10 lg:px-12">{creator&&!participant&&<div className="mb-7 flex flex-col items-start justify-between gap-3 rounded-2xl border border-[#d7e6e0] bg-[#eaf4f0] px-5 py-4 sm:flex-row sm:items-center"><div><p className="font-bold text-[#285f54]">Want to vote too?</p><p className="mt-0.5 text-sm text-[#58716a]">Join with your name; your creator controls will stay available.</p></div><Link href={`/trip/${inviteCode}/join`} className="inline-flex min-h-10 items-center rounded-full bg-[#1f7168] px-4 text-sm font-bold text-white">Join voting</Link></div>}<div className="mb-6 flex items-end justify-between"><div><p className="text-sm font-bold uppercase tracking-[.15em] text-[#1f7168]">Stay ideas</p><h2 className="display-font mt-1 text-3xl sm:text-4xl">The shortlist</h2></div><p className="text-sm font-semibold text-[#71807c]">{listings.length} option{listings.length===1?"":"s"}</p></div><ListingGrid listings={listings} travellerCount={trip.travellerCount} inviteCode={trip.inviteCode} isCreator={creator} selectedListingId={trip.selectedListingId} canVote={Boolean(participant)}/></section></main>;
}

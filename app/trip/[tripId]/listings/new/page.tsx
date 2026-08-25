import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect, notFound } from "next/navigation";
import { addListing } from "@/actions/listings";
import { ListingForm } from "@/components/listing/ListingForm";
import { Logo } from "@/components/brand/Logo";
import { isTripCreator } from "@/lib/creator-session";
import { readDatabase } from "@/lib/db";

export default async function NewListingPage({ params }: { params:Promise<{ tripId:string }> }) {
  const { tripId }=await params; const trip=(await readDatabase()).trips.find((item)=>item.inviteCode===tripId); if(!trip)notFound(); if(!(await isTripCreator(trip)))redirect(`/trip/${tripId}`);
  const action=addListing.bind(null,tripId);
  return <main className="min-h-screen bg-[#f6f4ef]"><header className="border-b border-[#e8e2d8] bg-white"><div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-8"><Link href="/"><Logo/></Link><Link href={`/trip/${tripId}`} className="flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-bold hover:bg-[#f3f3ef]"><ArrowLeft size={16}/> Back to trip</Link></div></header><div className="mx-auto max-w-3xl px-4 py-9 sm:px-8 sm:py-12"><div className="mb-8"><p className="text-sm font-bold text-[#e85d3f]">{trip.name}</p><h1 className="display-font mt-2 text-4xl font-medium sm:text-5xl">Add a stay</h1><p className="mt-3 text-[#63716d]">Add the essentials, then use quick suggestions and personal tags to make the option easy to scan.</p></div><div className="rounded-[2rem] border border-[#e5e1d9] bg-white p-5 shadow-[0_18px_55px_rgba(35,61,55,.07)] sm:p-9"><ListingForm action={action} tripCurrency={trip.currency} tripDestination={trip.destination}/></div></div></main>;
}

import { notFound,redirect } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { PreferencesForm } from "@/components/preferences/PreferencesForm";
import { TripHeader } from "@/components/trip/TripHeader";
import { TripNavigation } from "@/components/trip/TripNavigation";
import { isTripCreator } from "@/lib/creator-session";
import { readDatabase } from "@/lib/db";
import { getCurrentParticipant } from "@/lib/participant-session";
import type { PreferenceImportance } from "@/lib/types";

export default async function PreferencesPage({params}:{params:Promise<{tripId:string}>}){const{tripId}=await params;const database=await readDatabase();const trip=database.trips.find((item)=>item.inviteCode===tripId);if(!trip)notFound();const creator=await isTripCreator(trip);const participant=await getCurrentParticipant(trip,database);if(!participant)redirect(`/trip/${tripId}/join`);const current=Object.fromEntries(database.participantPreferences.filter((item)=>item.participantId===participant.id).map((item)=>[item.preferenceId,item.importance])) as Record<string,PreferenceImportance>;const selectedName=database.listings.find((item)=>item.id===trip.selectedListingId)?.propertyName;return <main className="min-h-screen"><TripHeader trip={trip} isCreator={creator} selectedListingName={selectedName}/><TripNavigation inviteCode={tripId} active="preferences"/><section className="mx-auto max-w-4xl px-4 py-9 sm:px-8 sm:py-12"><div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e7f1ed] text-[#1f7168]"><SlidersHorizontal size={23}/></span><div><p className="text-sm font-bold uppercase tracking-[.15em] text-[#1f7168]">Your priorities</p><h1 className="display-font mt-1 text-4xl sm:text-5xl">What matters to you?</h1><p className="mt-3 max-w-2xl leading-7 text-[#63716d]">Tell the group what you care about. Your choices contribute to the preference portion of recommendations without overriding the vote.</p></div></div><div className="mt-8"><PreferencesForm inviteCode={tripId} preferences={database.preferences} current={current}/></div></section></main>}

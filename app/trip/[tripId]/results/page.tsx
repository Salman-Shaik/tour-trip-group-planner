/* eslint-disable @next/next/no-img-element */
import { Award, BedDouble, ExternalLink, Heart, SlidersHorizontal, ThumbsDown, ThumbsUp, Users } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SelectStayButton } from "@/components/results/SelectStayButton";
import { TripHeader } from "@/components/trip/TripHeader";
import { TripNavigation } from "@/components/trip/TripNavigation";
import { isTripCreator } from "@/lib/creator-session";
import { readDatabase } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { getCurrentParticipant } from "@/lib/participant-session";
import { calculateRecommendations } from "@/lib/recommendations";
import { countVotes } from "@/lib/ranking";
import { currentVotingRound } from "@/lib/voting-lifecycle";

export default async function ResultsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const database = await readDatabase();
  const trip = database.trips.find((item) => item.inviteCode === tripId);
  if (!trip) notFound();

  const creator = await isTripCreator(trip);
  const participant = await getCurrentParticipant(trip, database);
  if (!creator && !participant) redirect(`/trip/${tripId}/join`);

  const round = currentVotingRound(trip);
  const participants = database.participants.filter((item) => item.tripId === trip.id);
  const allListings = database.listings.filter((item) => item.tripId === trip.id);
  const listings = round === 2
    ? allListings.filter((item) => trip.finalistListingIds?.includes(item.id))
    : allListings;
  const listingIds = new Set(listings.map((item) => item.id));
  const votes = database.votes.filter((item) => listingIds.has(item.listingId) && (item.round ?? 1) === round);
  const participantIds = new Set(participants.map((item) => item.id));
  const participantPreferences = database.participantPreferences.filter((item) => participantIds.has(item.participantId));
  const recommendationScores = calculateRecommendations({
    listings,
    amenities: database.amenities,
    listingAmenities: database.listingAmenities,
    votes,
    participantCount: participants.length,
    preferences: database.preferences,
    participantPreferences,
  });
  const ranked = listings.map((listing) => {
    const listingVotes = votes.filter((item) => item.listingId === listing.id);
    return { listing, votes: listingVotes, counts: countVotes(listingVotes), score: recommendationScores.get(listing.id)! };
  }).sort((a, b) => b.score.combinedScore - a.score.combinedScore || b.counts.LOVE - a.counts.LOVE || a.listing.totalPrice - b.listing.totalPrice);
  const selectedName = allListings.find((item) => item.id === trip.selectedListingId)?.propertyName;
  const preferenceParticipants = new Set(participantPreferences.filter((item) => item.importance !== "NOT_IMPORTANT").map((item) => item.participantId)).size;

  return <main className="min-h-screen">
    <TripHeader trip={trip} isCreator={creator} selectedListingName={selectedName} />
    <TripNavigation inviteCode={tripId} active="results" />
    <section className="mx-auto max-w-5xl px-4 py-9 sm:px-8 sm:py-12">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[.15em] text-[#1f7168]">Group verdict</p>
          <h1 className="display-font mt-1 text-4xl sm:text-5xl">Recommendations</h1>
          <p className="mt-3 max-w-2xl text-[#63716d]">Voting drives 75% of the recommendation. The remaining 25% reflects the preferences your group marked as meaningful.</p>
        </div>
        <div className="rounded-2xl bg-[#e7f1ed] px-4 py-3 text-sm text-[#285f54]">
          <p className="font-extrabold">{participants.length} participant{participants.length === 1 ? "" : "s"}</p>
          <p>{votes.length} votes · {preferenceParticipants} preference profile{preferenceParticipants === 1 ? "" : "s"}</p>
        </div>
      </div>
      {participant && <Link href={`/trip/${tripId}/preferences`} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-[#cfd8d4] bg-white px-4 text-sm font-bold"><SlidersHorizontal size={16} />Update my preferences</Link>}

      {ranked.length ? <div className="mt-9 space-y-5">{ranked.map(({ listing, votes: listingVotes, counts, score }, index) => {
        const selected = trip.selectedListingId === listing.id;
        const externalLinkProps = { href: listing.url, target: "_blank", rel: "noopener noreferrer" } as const;
        return <article key={listing.id} className={`overflow-hidden rounded-[1.75rem] border bg-white shadow-[0_12px_38px_rgba(35,61,55,.07)] ${selected ? "border-[#1f7168] ring-2 ring-[#1f7168]/20" : index === 0 ? "border-[#dfaa61]" : "border-[#e3e0d8]"}`}>
          <div className="grid sm:grid-cols-[12rem_1fr]">
            <a {...externalLinkProps} aria-label={`Open ${listing.propertyName} listing`} className="relative block min-h-44 bg-[#dfe9e4] outline-none transition-opacity hover:opacity-90 focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#1f7168]">
              {listing.imageUrl ? <img src={listing.imageUrl} alt={listing.propertyName} className="absolute inset-0 h-full w-full object-cover" referrerPolicy="no-referrer" /> : <div className="grid h-full place-items-center"><BedDouble size={38} /></div>}
              <span className={`absolute left-3 top-3 grid size-10 place-items-center rounded-full text-lg font-black shadow-md ${index === 0 ? "bg-[#f3b75f] text-[#3e2c14]" : "bg-white text-[#18342f]"}`}>{index + 1}</span>
              {selected && <span className="absolute bottom-3 left-3 rounded-full bg-[#18342f] px-3 py-1.5 text-xs font-extrabold text-white">🏆 Selected</span>}
            </a>
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-5">
                <a {...externalLinkProps} className="group rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#1f7168] focus-visible:ring-offset-4">
                  <div className="flex items-center gap-2">
                    {index === 0 && <Award size={20} className="text-[#c78328]" />}
                    <h2 className="text-xl font-extrabold group-hover:text-[#1f7168] group-hover:underline">{listing.propertyName}</h2>
                    <ExternalLink size={16} className="shrink-0 text-[#71807c] transition-colors group-hover:text-[#1f7168]" aria-hidden="true" />
                  </div>
                  <p className="mt-1 text-sm text-[#71807c] group-hover:text-[#1f7168]">{listing.location} · {formatMoney(listing.totalPrice, listing.currency)}</p>
                </a>
                <div className="shrink-0 text-right"><p className="display-font text-4xl font-semibold text-[#1f7168]">{score.combinedScore}%</p><p className="text-xs font-bold text-[#71807c]">recommendation</p></div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e7ece9]"><div className="h-full rounded-full bg-[#e85d3f]" style={{ width: `${score.combinedScore}%` }} /></div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm"><div className="rounded-xl bg-[#f3f5f2] px-3 py-2"><span className="text-[#71807c]">Vote score</span><b className="float-right">{score.voteScore}%</b></div><div className="rounded-xl bg-[#f3f5f2] px-3 py-2"><span className="text-[#71807c]">Preference fit</span><b className="float-right">{score.preferenceScore == null ? "Not set" : `${score.preferenceScore}%`}</b></div></div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-xs"><div className="rounded-xl bg-[#fff0eb] p-2"><Heart size={15} className="mx-auto text-[#d84c4c]" fill="currentColor" /><b className="mt-1 block">{counts.LOVE} Love</b></div><div className="rounded-xl bg-[#eef4ff] p-2"><ThumbsUp size={15} className="mx-auto text-[#4673a8]" /><b className="mt-1 block">{counts.LIKE} Like</b></div><div className="rounded-xl bg-[#fff7df] p-2"><span className="text-sm">😐</span><b className="mt-1 block">{counts.MAYBE} Maybe</b></div><div className="rounded-xl bg-[#f1f1ef] p-2"><ThumbsDown size={15} className="mx-auto text-[#6e7773]" /><b className="mt-1 block">{counts.NO} No</b></div></div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="flex items-center gap-1.5 text-xs font-semibold text-[#71807c]"><Users size={14} />{listingVotes.length} of {participants.length} participants voted</p>{creator && <SelectStayButton inviteCode={tripId} listingId={listing.id} selected={selected} />}</div>
            </div>
          </div>
        </article>;
      })}</div> : <div className="mt-9 rounded-[2rem] border border-dashed border-[#cfd8d4] bg-white px-6 py-16 text-center"><Award className="mx-auto text-[#80938d]" size={36} /><h2 className="display-font mt-4 text-3xl">No results yet</h2><p className="mt-2 text-[#63716d]">Add stays and collect votes to see the group ranking.</p></div>}

      <aside className="mt-8 rounded-2xl border border-[#e3e0d8] bg-white p-5 text-sm leading-6 text-[#63716d]"><strong className="text-[#29443e]">How scoring works:</strong> Vote points are divided by the maximum if every participant voted Love. When preferences exist, each listing is matched against their importance weights, then combined as 75% vote score and 25% preference fit. If no preferences are set, the recommendation is the vote score alone. Negative votes and missing votes remain visible.</aside>
    </section>
  </main>;
}

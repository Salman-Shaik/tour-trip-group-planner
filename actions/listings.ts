"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isTripCreator } from "@/lib/creator-session";
import { readDatabase, updateDatabase } from "@/lib/db";
import { formValues, type FormState } from "@/lib/form-state";
import { parseListingUrl } from "@/lib/listing-parser";
import { listingSchema } from "@/lib/validation";
import { amenityKey } from "@/lib/amenity-key";

function amenityLabels(value:string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 20);
}

async function creatorTrip(inviteCode:string) {
  const trip = (await readDatabase()).trips.find((item) => item.inviteCode === inviteCode);
  if (!trip || !(await isTripCreator(trip))) return null;
  return trip;
}

export async function addListing(inviteCode:string, _state:FormState, formData:FormData): Promise<FormState> {
  const trip = await creatorTrip(inviteCode);
  if (!trip) return { message:"Only the trip creator can add stays." };
  const values = formValues(formData);
  const parsed = listingSchema.safeParse(values);
  if (!parsed.success) return { errors:parsed.error.flatten().fieldErrors, values, message:"Please check the highlighted fields." };
  const normalized = parseListingUrl(parsed.data.url);
  const listingId = randomUUID();
  const now = new Date().toISOString();
  await updateDatabase((database) => {
    database.listings.push({ id:listingId,tripId:trip.id,url:normalized.normalizedUrl,platform:parsed.data.platform,propertyName:parsed.data.propertyName,imageUrl:parsed.data.imageUrl || null,totalPrice:parsed.data.totalPrice,currency:parsed.data.currency,maxGuests:parsed.data.maxGuests,bedrooms:parsed.data.bedrooms ?? null,beds:parsed.data.beds ?? null,bathrooms:parsed.data.bathrooms ?? null,rating:parsed.data.rating ?? null,reviewCount:parsed.data.reviewCount ?? null,location:parsed.data.location,distanceNote:parsed.data.distanceNote || null,notes:parsed.data.notes || null,tags:amenityLabels(parsed.data.tags),createdAt:now,updatedAt:now });
    for (const label of amenityLabels(parsed.data.amenities)) {
      const key = amenityKey(label);
      let amenity = database.amenities.find((item) => item.key === key);
      if (!amenity) { amenity = { id:randomUUID(),key,label }; database.amenities.push(amenity); }
      database.listingAmenities.push({ listingId,amenityId:amenity.id });
    }
  });
  redirect(`/trip/${inviteCode}`);
}

export async function editListing(inviteCode:string, listingId:string, _state:FormState, formData:FormData): Promise<FormState> {
  const trip = await creatorTrip(inviteCode);
  if (!trip) return { message:"Only the trip creator can edit stays." };
  const values = formValues(formData);
  const parsed = listingSchema.safeParse(values);
  if (!parsed.success) return { errors:parsed.error.flatten().fieldErrors, values, message:"Please check the highlighted fields." };
  const normalized = parseListingUrl(parsed.data.url);
  const updated = await updateDatabase((database) => {
    const listing = database.listings.find((item) => item.id === listingId && item.tripId === trip.id);
    if (!listing) return false;
    Object.assign(listing, { url:normalized.normalizedUrl,platform:parsed.data.platform,propertyName:parsed.data.propertyName,imageUrl:parsed.data.imageUrl || null,totalPrice:parsed.data.totalPrice,currency:parsed.data.currency,maxGuests:parsed.data.maxGuests,bedrooms:parsed.data.bedrooms ?? null,beds:parsed.data.beds ?? null,bathrooms:parsed.data.bathrooms ?? null,rating:parsed.data.rating ?? null,reviewCount:parsed.data.reviewCount ?? null,location:parsed.data.location,distanceNote:parsed.data.distanceNote || null,notes:parsed.data.notes || null,tags:amenityLabels(parsed.data.tags),updatedAt:new Date().toISOString() });
    database.listingAmenities = database.listingAmenities.filter((item) => item.listingId !== listingId);
    for (const label of amenityLabels(parsed.data.amenities)) {
      const key = amenityKey(label);
      let amenity = database.amenities.find((item) => item.key === key);
      if (!amenity) { amenity = { id:randomUUID(),key,label }; database.amenities.push(amenity); }
      database.listingAmenities.push({ listingId,amenityId:amenity.id });
    }
    return true;
  });
  if (!updated) return { message:"This stay could not be found." };
  redirect(`/trip/${inviteCode}`);
}

export async function deleteListing(inviteCode:string, listingId:string) {
  const trip = await creatorTrip(inviteCode);
  if (!trip) return;
  await updateDatabase((database) => {
    const owned = database.listings.some((item) => item.id === listingId && item.tripId === trip.id);
    if (!owned) return;
    database.listings = database.listings.filter((item) => item.id !== listingId);
    database.listingAmenities = database.listingAmenities.filter((item) => item.listingId !== listingId);
    database.votes = database.votes.filter((item) => item.listingId !== listingId);
    database.comments = database.comments.filter((item) => item.listingId !== listingId);
    if (trip.selectedListingId === listingId) trip.selectedListingId = null;
  });
  revalidatePath(`/trip/${inviteCode}`);
}

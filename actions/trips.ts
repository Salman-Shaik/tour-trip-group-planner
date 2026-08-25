"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { updateDatabase } from "@/lib/db";
import { getCreatorUserId } from "@/lib/creator-session";
import { formValues, type FormState } from "@/lib/form-state";
import { tripSchema } from "@/lib/validation";

const tripSlug = (name:string) => name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/[\s-]+/g, "-").slice(0, 36) || "trip";

export async function createTrip(_state:FormState, formData:FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = tripSchema.safeParse(values);
  if (!parsed.success) return { errors:parsed.error.flatten().fieldErrors, values, message:"Please check the highlighted fields." };
  const creatorUserId=await getCreatorUserId();
  if (!creatorUserId) return { values, message:"Sign in with Google before creating a trip." };

  const tripId = randomUUID();
  const now = new Date().toISOString();
  const inviteCode = await updateDatabase((database) => {
    let candidate = "";
    do candidate = `${tripSlug(parsed.data.name)}-${randomBytes(3).toString("hex")}`; while (database.trips.some((trip) => trip.inviteCode === candidate));
    database.trips.push({ id:tripId, inviteCode:candidate, name:parsed.data.name, destination:parsed.data.destination, startDate:parsed.data.startDate, endDate:parsed.data.endDate, travellerCount:parsed.data.travellerCount, accommodationBudget:parsed.data.accommodationBudget ?? null, currency:parsed.data.currency, creatorUserId, creatorTokenHash:"", status:"ACTIVE", completedAt:null, selectedListingId:null, createdAt:now, updatedAt:now });
    return candidate;
  });
  redirect(`/trip/${inviteCode}`);
}

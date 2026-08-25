import { z } from "zod";
import { currencies, listingPlatforms } from "@/lib/types";

const requiredText = (label:string, max=120) => z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);
const optionalNumber = (schema:z.ZodNumber) => z.preprocess((value) => value === "" || value == null ? undefined : Number(value), schema.optional());

export const tripSchema = z.object({
  name:requiredText("Trip name"),
  destination:requiredText("Destination"),
  startDate:z.iso.date("Choose a valid start date"),
  endDate:z.iso.date("Choose a valid end date"),
  travellerCount:z.coerce.number().int().min(1, "At least one traveller is required").max(100, "Traveller count must be 100 or less"),
  accommodationBudget:optionalNumber(z.number().positive("Budget must be greater than zero").max(100_000_000)),
  currency:z.enum(currencies),
}).refine(({ startDate, endDate }) => endDate >= startDate, { path:["endDate"], message:"End date must be on or after the start date" });

export const listingSchema = z.object({
  url:z.url("Enter a valid listing URL").refine((url) => ["http:", "https:"].includes(new URL(url).protocol), "Only HTTP or HTTPS links are allowed"),
  platform:z.enum(listingPlatforms),
  propertyName:requiredText("Property name", 160),
  imageUrl:z.union([z.literal(""), z.url("Enter a valid image URL")]).refine((url) => !url || new URL(url).protocol === "https:", "Image URL must use HTTPS"),
  totalPrice:z.coerce.number().positive("Total price must be greater than zero").max(100_000_000),
  currency:z.enum(currencies),
  maxGuests:z.coerce.number().int().min(1, "At least one guest is required").max(200),
  bedrooms:optionalNumber(z.number().int().min(0).max(100)),
  beds:optionalNumber(z.number().int().min(0).max(200)),
  bathrooms:optionalNumber(z.number().min(0).max(100)),
  rating:optionalNumber(z.number().min(0, "Rating cannot be negative").max(5, "Rating cannot exceed 5")),
  reviewCount:optionalNumber(z.number().int().min(0).max(10_000_000)),
  location:requiredText("Location", 200),
  distanceNote:z.string().trim().max(200).optional().default(""),
  notes:z.string().trim().max(2000).optional().default(""),
  amenities:z.string().trim().max(1000).optional().default(""),
  tags:z.string().trim().max(1000).optional().default(""),
});

export const participantSchema = z.object({
  name:requiredText("Name", 50).refine((name)=>/^[\p{L}\p{N} .'-]+$/u.test(name), "Use letters, numbers, spaces, apostrophes, periods, or hyphens"),
});

export const voteSchema = z.enum(["LOVE","LIKE","MAYBE","NO"]);
export const commentSchema = z.object({ body:z.string().trim().min(1,"Write something before posting").max(1000,"Keep comments under 1,000 characters") });

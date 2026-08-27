import { createHash } from "node:crypto";
import { writeDatabase } from "../lib/db.ts";
import type { Database, ListingPlatform, VoteValue } from "../lib/types.ts";
import { SEEDED_CREATOR_TOKEN,SEEDED_TRIP_INVITE_CODE } from "../lib/seed-constants.ts";

const now = "2026-08-24T00:00:00.000Z";
const hash = (value:string) => createHash("sha256").update(value).digest("hex");
const slug = (value:string) => value.toLowerCase().replaceAll(" ", "-");
const amenityLabels = ["Swimming Pool","Wi-Fi","Parking","Kitchen","Breakfast","Beach Access","Air Conditioning","Private Property","Balcony","Sea View"];
const preferenceLabels = ["Lowest price","Swimming pool","Near beach","More bedrooms","More bathrooms","High rating","Breakfast","Kitchen","Parking","Private villa","Good location"];
const stayInputs: Array<{ name:string; platform:ListingPlatform; price:number; guests:number; bedrooms:number; beds:number; bathrooms:number; rating:number; reviews:number; location:string; distance:string; image:string; amenities:string[] }> = [
  { name:"Casa Sol",platform:"AIRBNB",price:32000,guests:8,bedrooms:4,beds:5,bathrooms:4,rating:4.82,reviews:124,location:"Candolim, North Goa",distance:"8 min walk to Candolim Beach",image:"https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=1200&q=85",amenities:["Swimming Pool","Wi-Fi","Parking","Kitchen","Beach Access"] },
  { name:"The Palm House",platform:"BOOKING",price:29200,guests:8,bedrooms:3,beds:4,bathrooms:3,rating:4.67,reviews:89,location:"Anjuna, North Goa",distance:"Near Anjuna Market",image:"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85",amenities:["Swimming Pool","Wi-Fi","Breakfast","Air Conditioning","Balcony"] },
  { name:"Salt & Sky Villa",platform:"AGODA",price:35200,guests:10,bedrooms:5,beds:6,bathrooms:4.5,rating:4.91,reviews:62,location:"Vagator, North Goa",distance:"1.2 km from Vagator Beach",image:"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85",amenities:["Swimming Pool","Wi-Fi","Kitchen","Private Property","Sea View"] },
  { name:"Mango Grove Retreat",platform:"DIRECT",price:26800,guests:8,bedrooms:4,beds:4,bathrooms:3,rating:4.55,reviews:41,location:"Assagao, North Goa",distance:"10 min drive to Anjuna",image:"https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=1200&q=85",amenities:["Wi-Fi","Parking","Kitchen","Air Conditioning","Private Property"] },
];

async function main() {
  const tripId = "trip_goa_december";
  const participants = ["Pavani","Arjun","Meera","Rohan"].map((name,index) => ({ id:`participant_${index + 1}`,tripId,name,sessionHash:hash(`development-${tripId}-${name}`),createdAt:now,updatedAt:now }));
  const amenities = amenityLabels.map((label,index) => ({ id:`amenity_${index + 1}`,key:slug(label),label }));
  const defaultTags=[["Comfy","Great location"],["Cheap","Easy travel"],["Expensive","Sea view"],["Good value","Hard travel"]];
  const listings = stayInputs.map((stay,index) => ({ id:`listing_${index + 1}`,tripId,url:`https://example.com/${slug(stay.name)}`,platform:stay.platform,propertyName:stay.name,imageUrl:stay.image,totalPrice:stay.price,currency:"INR" as const,maxGuests:stay.guests,bedrooms:stay.bedrooms,beds:stay.beds,bathrooms:stay.bathrooms,rating:stay.rating,reviewCount:stay.reviews,location:stay.location,distanceNote:stay.distance,notes:null,tags:defaultTags[index],createdAt:now,updatedAt:now }));
  const patterns: VoteValue[][] = [["LOVE","LOVE","LIKE","LOVE"],["LIKE","LOVE","LIKE","MAYBE"],["LOVE","MAYBE","LIKE","MAYBE"],["LIKE","MAYBE","NO","LIKE"]];
  const preferences=preferenceLabels.map((label,index) => ({ id:`preference_${index + 1}`,key:slug(label),label,description:null,createdAt:now }));
  const database: Database = {
    users:[],
    trips:[{ id:tripId,inviteCode:SEEDED_TRIP_INVITE_CODE,name:"Goa December Trip",destination:"North Goa",startDate:"2026-12-12",endDate:"2026-12-15",travellerCount:10,accommodationBudget:40000,currency:"INR",creatorUserId:null,creatorTokenHash:hash(SEEDED_CREATOR_TOKEN),status:"ACTIVE",completedAt:null,selectedListingId:null,createdAt:now,updatedAt:now }],
    participants,
    listings,
    amenities,
    listingAmenities:stayInputs.flatMap((stay,index) => stay.amenities.map((label) => ({ listingId:`listing_${index + 1}`,amenityId:amenities.find((amenity) => amenity.label === label)!.id }))),
    votes:listings.flatMap((listing,i) => participants.map((participant,j) => ({ id:`vote_${i + 1}_${j + 1}`,listingId:listing.id,participantId:participant.id,value:patterns[i][j],createdAt:now,updatedAt:now }))),
    comments:[{ id:"comment_1",listingId:"listing_1",participantId:"participant_1",body:"The pool and location look perfect for our group.",createdAt:now,updatedAt:now },{ id:"comment_2",listingId:"listing_2",participantId:"participant_3",body:"Great value, and breakfast is a nice bonus.",createdAt:now,updatedAt:now },{ id:"comment_3",listingId:"listing_3",participantId:"participant_2",body:"A little expensive, but those sea views are hard to beat.",createdAt:now,updatedAt:now }],
    preferences,
    participantPreferences:[
      {participantId:"participant_1",preferenceId:"preference_2",importance:"MUST_HAVE",createdAt:now,updatedAt:now},
      {participantId:"participant_1",preferenceId:"preference_3",importance:"IMPORTANT",createdAt:now,updatedAt:now},
      {participantId:"participant_2",preferenceId:"preference_1",importance:"MUST_HAVE",createdAt:now,updatedAt:now},
      {participantId:"participant_3",preferenceId:"preference_4",importance:"IMPORTANT",createdAt:now,updatedAt:now},
      {participantId:"participant_4",preferenceId:"preference_8",importance:"NICE_TO_HAVE",createdAt:now,updatedAt:now},
    ],
  };
  await writeDatabase(database);
  console.log("Seeded Goa December Trip in data/db.json");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

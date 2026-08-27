import type { Preference } from "@/lib/types";

const preferenceInputs=[
  ["lowest-price","Lowest price","Prefer options that keep the total cost down."],
  ["swimming-pool","Swimming pool",null],
  ["near-beach","Near beach",null],
  ["more-bedrooms","More bedrooms",null],
  ["more-bathrooms","More bathrooms",null],
  ["high-rating","High rating",null],
  ["breakfast","Breakfast",null],
  ["kitchen","Kitchen",null],
  ["parking","Parking",null],
  ["private-property","Private property",null],
  ["good-location","Good location",null],
  ["wifi","Wi-Fi",null],
  ["air-conditioning","Air conditioning",null],
] as const;

export function defaultPreferences():Preference[]{
  return preferenceInputs.map(([key,label,description],index)=>({id:`preference_${index+1}`,key,label,description,createdAt:"2026-08-26T00:00:00.000Z"}));
}

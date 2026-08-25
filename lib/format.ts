import type { Currency } from "@/lib/types";

const locales: Record<Currency,string> = { INR:"en-IN",USD:"en-US",EUR:"en-IE",GBP:"en-GB",AUD:"en-AU",SGD:"en-SG",AED:"en-AE" };
export function formatMoney(value:number, currency:Currency) { return new Intl.NumberFormat(locales[currency], { style:"currency",currency,maximumFractionDigits:0 }).format(value); }
export function formatTripDates(start:string, end:string) {
  const startDate = new Date(`${start}T00:00:00`); const endDate = new Date(`${end}T00:00:00`);
  const sameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear();
  const first = new Intl.DateTimeFormat("en", sameMonth ? { day:"numeric" } : { day:"numeric",month:"short" }).format(startDate);
  const last = new Intl.DateTimeFormat("en", { day:"numeric",month:"long",year:endDate.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined }).format(endDate);
  return `${first}–${last}`;
}

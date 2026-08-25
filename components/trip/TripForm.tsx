"use client";

import { useActionState,useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { createTrip } from "@/actions/trips";
import { FormField, inputClass } from "@/components/forms/FormField";
import { initialFormState } from "@/lib/form-state";
import { currencies } from "@/lib/types";

export function TripForm() {
  const [state, action, pending] = useActionState(createTrip, initialFormState);
  const [startDate,setStartDate]=useState(state.values?.startDate??"");
  const [endDate,setEndDate]=useState(state.values?.endDate??"");
  const chooseStartDate=(next:string)=>{setStartDate(next);if(!next)return;if(!endDate||endDate<next){const followingDay=new Date(`${next}T00:00:00Z`);followingDay.setUTCDate(followingDay.getUTCDate()+1);setEndDate(followingDay.toISOString().slice(0,10));}};
  return <form action={action} className="space-y-6" noValidate>
    {state.message && <div role="alert" className="rounded-xl bg-[#fff0eb] px-4 py-3 text-sm font-semibold text-[#a83a25]">{state.message}</div>}
    <FormField label="Trip name" name="name" error={state.errors?.name}><input id="name" name="name" className={inputClass} defaultValue={state.values?.name} placeholder="Goa December Trip" autoComplete="off"/></FormField>
    <FormField label="Destination" name="destination" error={state.errors?.destination}><input id="destination" name="destination" className={inputClass} defaultValue={state.values?.destination} placeholder="North Goa" autoComplete="off"/></FormField>
    <div className="grid gap-5 sm:grid-cols-2"><FormField label="Start date" name="startDate" error={state.errors?.startDate}><input id="startDate" name="startDate" type="date" className={inputClass} value={startDate} onChange={(event)=>chooseStartDate(event.target.value)}/></FormField><FormField label="End date" name="endDate" error={state.errors?.endDate} hint={startDate?"Defaults to the following day; choose a later date if needed.":undefined}><input id="endDate" name="endDate" type="date" className={inputClass} value={endDate} min={startDate||undefined} onChange={(event)=>setEndDate(event.target.value)}/></FormField></div>
    <div className="grid gap-5 sm:grid-cols-2"><FormField label="Travellers" name="travellerCount" error={state.errors?.travellerCount}><input id="travellerCount" name="travellerCount" type="number" min="1" max="100" inputMode="numeric" className={inputClass} defaultValue={state.values?.travellerCount ?? "2"}/></FormField><FormField label="Currency" name="currency" error={state.errors?.currency}><select id="currency" name="currency" className={inputClass} defaultValue={state.values?.currency ?? "INR"}>{currencies.map((currency)=><option key={currency}>{currency}</option>)}</select></FormField></div>
    <FormField label="Overall accommodation budget" name="accommodationBudget" error={state.errors?.accommodationBudget} hint="Optional — use the total budget for the entire stay."><input id="accommodationBudget" name="accommodationBudget" type="number" min="0" step="0.01" inputMode="decimal" className={inputClass} defaultValue={state.values?.accommodationBudget} placeholder="40000"/></FormField>
    <button disabled={pending} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-[#e85d3f] px-6 font-bold text-white shadow-[0_12px_28px_rgba(232,93,63,.22)] transition hover:bg-[#c7442b] disabled:cursor-wait disabled:opacity-70">{pending ? <><LoaderCircle className="animate-spin" size={18}/> Creating trip…</> : <>Create my trip <ArrowRight size={18}/></>}</button>
  </form>;
}

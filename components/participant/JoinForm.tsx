"use client";

import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { joinTrip } from "@/actions/participants";
import { FormField, inputClass } from "@/components/forms/FormField";
import { initialFormState } from "@/lib/form-state";

export function JoinForm({ inviteCode }: { inviteCode:string }){const action=joinTrip.bind(null,inviteCode);const[state,formAction,pending]=useActionState(action,initialFormState);return <form action={formAction} className="space-y-5" noValidate>{state.message&&<div role="alert" className="rounded-xl bg-[#fff0eb] px-4 py-3 text-sm font-semibold text-[#a83a25]">{state.message}</div>}<FormField label="What should we call you?" name="name" error={state.errors?.name} hint="Your friends will see this name beside your votes and comments."><input id="name" name="name" className={inputClass} defaultValue={state.values?.name} placeholder="Pavani" autoFocus autoComplete="nickname"/></FormField><button disabled={pending} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-[#e85d3f] px-6 font-bold text-white shadow-[0_12px_28px_rgba(232,93,63,.22)] hover:bg-[#c7442b] disabled:opacity-70">{pending?<><LoaderCircle size={18} className="animate-spin"/>Joining…</>:<>Join the trip <ArrowRight size={18}/></>}</button></form>}

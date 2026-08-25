"use client";

import { useActionState } from "react";
import { LoaderCircle,Send } from "lucide-react";
import { addComment } from "@/actions/comments";
import { initialFormState } from "@/lib/form-state";

export function CommentForm({inviteCode,listingId}:{inviteCode:string;listingId:string}){const action=addComment.bind(null,inviteCode,listingId);const[state,formAction,pending]=useActionState(action,initialFormState);return <form action={formAction} className="rounded-2xl border border-[#dfe4e1] bg-white p-4 shadow-sm" noValidate>{state.message&&<p role="alert" className="mb-3 text-sm font-semibold text-[#b6422d]">{state.message}</p>}<label htmlFor="body" className="mb-2 block text-sm font-bold">Add to the discussion</label><textarea id="body" name="body" rows={3} maxLength={1000} defaultValue={state.values?.body} className="w-full resize-y rounded-xl border border-[#dcded8] bg-white px-3.5 py-3 text-[16px] outline-none focus:border-[#1f7168] focus:ring-4 focus:ring-[#1f7168]/10" placeholder="Great location, but is it worth the extra cost?"/>{state.errors?.body?.[0]&&<p className="mt-1 text-sm font-semibold text-[#b6422d]">{state.errors.body[0]}</p>}<div className="mt-3 flex justify-end"><button disabled={pending} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1f7168] px-5 text-sm font-bold text-white disabled:opacity-70">{pending?<LoaderCircle className="animate-spin" size={16}/>:<Send size={16}/>} Post comment</button></div></form>}

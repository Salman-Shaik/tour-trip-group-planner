"use client";
import { useState,useTransition } from "react";
import { LoaderCircle,Trash2 } from "lucide-react";
import { removeParticipant } from "@/actions/participants";

export function RemoveParticipantButton({inviteCode,participantId,name}:{inviteCode:string;participantId:string;name:string}){
  const[pending,startTransition]=useTransition();const[error,setError]=useState("");
  return <div className="text-right"><button type="button" disabled={pending} onClick={()=>{if(!window.confirm(`Remove ${name} and their votes, comments, and preferences?`))return;startTransition(async()=>{const result=await removeParticipant(inviteCode,participantId);if(!result.ok)setError(result.message??"Could not remove participant.");});}} className="grid size-10 place-items-center rounded-full text-[#a83a25] hover:bg-[#fff0eb] disabled:opacity-60" aria-label={`Remove ${name}`}>{pending?<LoaderCircle className="animate-spin" size={16}/>:<Trash2 size={16}/>}</button>{error&&<p className="text-xs text-[#a83a25]">{error}</p>}</div>;
}

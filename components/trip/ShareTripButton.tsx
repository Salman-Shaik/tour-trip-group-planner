"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareTripButton() {
  const [copied,setCopied] = useState(false);
  return <button type="button" onClick={async()=>{await navigator.clipboard.writeText(window.location.href);setCopied(true);setTimeout(()=>setCopied(false),1800);}} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d9dfdc] bg-white px-4 text-sm font-bold shadow-sm transition hover:border-[#b9c8c3]">{copied ? <><Check size={17} className="text-[#1f7168]"/> Copied</> : <><Share2 size={17}/> Share trip</>}</button>;
}

"use client";

import { useEffect,useRef,useState } from "react";
import { Check,Share2,TriangleAlert } from "lucide-react";

export function ShareTripButton(){
  const[state,setState]=useState<"idle"|"copied"|"error">("idle");const resetTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(resetTimer.current)clearTimeout(resetTimer.current)},[]);
  const share=async()=>{try{if(!navigator.clipboard?.writeText)throw new Error("Clipboard unavailable");await navigator.clipboard.writeText(window.location.href);setState("copied");}catch{setState("error");}finally{if(resetTimer.current)clearTimeout(resetTimer.current);resetTimer.current=setTimeout(()=>setState("idle"),2500)}};
  const label=state==="copied"?"Copied":state==="error"?"Copy failed":"Share trip";
  return <button type="button" onClick={share} aria-live="polite" title={state==="error"?"Copy unavailable. Select and copy the address from your browser.":undefined} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border bg-white px-4 text-sm font-bold shadow-sm transition ${state==="error"?"border-[#d85c48] text-[#a83a25]":"border-[#d9dfdc] hover:border-[#b9c8c3]"}`}>{state==="copied"?<Check size={17} className="text-[#1f7168]"/>:state==="error"?<TriangleAlert size={17}/>:<Share2 size={17}/>} {label}</button>;
}

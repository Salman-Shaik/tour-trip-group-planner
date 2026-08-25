"use client";

import { Check,Trophy } from "lucide-react";
import { selectFinalStay } from "@/actions/selection";

export function SelectStayButton({inviteCode,listingId,selected}:{inviteCode:string;listingId:string;selected:boolean}){const action=selectFinalStay.bind(null,inviteCode,listingId);return <form action={action} onSubmit={(event)=>{if(!selected&&!confirm("Mark this as the group’s selected stay? You can change the selection later."))event.preventDefault()}}><button disabled={selected} className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-extrabold ${selected?"bg-[#e7f1ed] text-[#285f54]":"bg-[#18342f] text-white hover:bg-[#285048]"}`}>{selected?<><Check size={15}/>Selected stay</>:<><Trophy size={15}/>Select this stay</>}</button></form>}

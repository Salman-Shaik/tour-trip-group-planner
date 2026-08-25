"use client";

import { Trash2 } from "lucide-react";
import { deleteListing } from "@/actions/listings";

export function DeleteListingButton({ inviteCode, listingId }: { inviteCode:string; listingId:string }) {
  const action = deleteListing.bind(null,inviteCode,listingId);
  return <form action={action} onSubmit={(event)=>{if(!window.confirm("Remove this stay from the shortlist? Votes and comments attached to it will also be removed."))event.preventDefault();}}><button type="submit" className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-bold text-[#a83a25] hover:bg-[#fff0eb]"><Trash2 size={15}/> Delete</button></form>;
}

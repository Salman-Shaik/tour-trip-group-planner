"use client";

import { Trash2 } from "lucide-react";
import { deleteComment } from "@/actions/comments";

export function DeleteCommentButton({inviteCode,listingId,commentId}:{inviteCode:string;listingId:string;commentId:string}){const action=deleteComment.bind(null,inviteCode,listingId,commentId);return <form action={action} onSubmit={(event)=>{if(!confirm("Delete your comment?"))event.preventDefault()}}><button className="inline-flex min-h-9 items-center gap-1 rounded-full px-2.5 text-xs font-bold text-[#a83a25] hover:bg-[#fff0eb]"><Trash2 size={13}/>Delete</button></form>}

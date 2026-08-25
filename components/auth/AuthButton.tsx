import Image from "next/image";
import Link from "next/link";
import { LogIn,LogOut } from "lucide-react";
import { auth } from "@/auth";
import { loginWithGoogle,logout } from "@/actions/auth";
export async function AuthButton(){const session=await auth();if(!session?.user)return <form action={loginWithGoogle}><button className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#d8dfdc] bg-white px-4 text-sm font-bold"><LogIn size={16}/>Sign in</button></form>;return <div className="flex items-center gap-2"><Link href="/trips" className="flex items-center gap-2" title="All trips">{session.user.image&&<Image src={session.user.image} alt="" width={32} height={32} className="rounded-full"/>}<span className="hidden max-w-32 truncate text-sm font-bold sm:block">{session.user.name}</span></Link><form action={logout}><button aria-label="Sign out" title="Sign out" className="grid size-11 place-items-center rounded-full border border-[#d8dfdc] bg-white"><LogOut size={16}/></button></form></div>}

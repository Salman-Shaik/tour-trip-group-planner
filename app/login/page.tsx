import Link from "next/link";
import { redirect } from "next/navigation";
import { LogIn, ShieldCheck } from "lucide-react";
import { auth } from "@/auth";
import { loginForE2E, loginWithGoogle } from "@/actions/auth";
import { Logo } from "@/components/brand/Logo";
import { isE2EAuthEnabled } from "@/lib/e2e-auth";

export default async function LoginPage() {
  if ((await auth())?.user) redirect("/");
  return <main className="grid min-h-screen place-items-center px-4"><section className="w-full max-w-md rounded-[2rem] border border-[#e3e0d8] bg-white p-8 text-center shadow-xl"><Link href="/" className="inline-block"><Logo/></Link><div className="mx-auto mt-8 grid size-14 place-items-center rounded-2xl bg-[#e7f1ed] text-[#1f7168]"><ShieldCheck/></div><h1 className="display-font mt-5 text-4xl">Your trips, on any device</h1><p className="mt-3 leading-7 text-[#63716d]">Creators sign in to create, manage, and return to multiple trips. Friends can still join shared trips without an account.</p><form action={loginWithGoogle}><button className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#18342f] px-6 font-bold text-white"><LogIn size={18}/>Continue with Google</button></form>{isE2EAuthEnabled()&&<form action={loginForE2E} className="mt-6 border-t border-[#e3e0d8] pt-6 text-left"><p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#63716d]">E2E test login</p><label htmlFor="e2e-name" className="text-sm font-bold">Name</label><input id="e2e-name" name="name" required defaultValue="Test Traveller" className="mb-3 mt-1 min-h-11 w-full rounded-xl border border-[#cfd8d4] px-3"/><label htmlFor="e2e-email" className="text-sm font-bold">Email</label><input id="e2e-email" name="email" type="email" required defaultValue="traveller@example.test" className="mt-1 min-h-11 w-full rounded-xl border border-[#cfd8d4] px-3"/><button className="mt-4 min-h-11 w-full rounded-full border border-[#18342f] font-bold">Sign in as test account</button></form>}</section></main>;
}

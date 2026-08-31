"use server";

import { signIn, signOut } from "@/auth";
import { isE2EAuthEnabled } from "@/lib/e2e-auth";

export async function loginWithGoogle() { await signIn("google", { redirectTo:"/" }); }
export async function loginForE2E(formData:FormData){if(!isE2EAuthEnabled())throw new Error("Test authentication is disabled.");await signIn("e2e",{email:String(formData.get("email")??""),name:String(formData.get("name")??""),redirectTo:"/"});}
export async function logout() { await signOut({ redirectTo:"/" }); }

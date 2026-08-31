import { createHash,randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { updateDatabase } from "@/lib/db";
import { isE2EAuthEnabled } from "@/lib/e2e-auth";

async function persistAccount(input:{subject:string;email:string;name:string;imageUrl:string|null}){
  const now=new Date().toISOString();
  const participantSessions=new Map((await cookies()).getAll().flatMap((cookie)=>cookie.name.startsWith("roamly_participant_")?[[cookie.name.slice("roamly_participant_".length),createHash("sha256").update(cookie.value).digest("hex")] as const]:[]));
  return updateDatabase((database)=>{
    let user=database.users.find((item)=>item.googleSubject===input.subject);
    if(!user){user={id:randomUUID(),googleSubject:input.subject,email:input.email,name:input.name,imageUrl:input.imageUrl,createdAt:now,updatedAt:now};database.users.push(user);}
    else{user.email=input.email;user.name=input.name;user.imageUrl=input.imageUrl;user.updatedAt=now;}
    for(const participant of database.participants){const sessionHash=participantSessions.get(participant.tripId);if(sessionHash&&participant.sessionHash===sessionHash)participant.userId=user.id;}
    return user.id;
  });
}

const e2eProvider=Credentials({id:"e2e",name:"E2E test account",credentials:{email:{label:"Email",type:"email"},name:{label:"Name",type:"text"}},async authorize(credentials){
  if(!isE2EAuthEnabled())return null;
  const email=String(credentials.email??"").trim().toLowerCase();const name=String(credentials.name??"").trim();
  if(!email.endsWith("@example.test")||name.length<1||name.length>80)return null;
  const id=await persistAccount({subject:`e2e:${email}`,email,name,imageUrl:null});
  return{id,email,name};
}});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers:[Google,...(isE2EAuthEnabled()?[e2eProvider]:[])],
  pages:{ signIn:"/login" },
  callbacks:{
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "google" && profile?.sub && profile.email) {
        token.userId=await persistAccount({subject:profile.sub,email:profile.email,name:profile.name??profile.email,imageUrl:typeof profile.picture==="string"?profile.picture:null});
      }
      if(account?.provider==="e2e"&&isE2EAuthEnabled()&&user.id)token.userId=user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.userId === "string") session.user.id=token.userId;
      return session;
    },
  },
});

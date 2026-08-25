import { randomUUID } from "node:crypto";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { updateDatabase } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers:[Google],
  pages:{ signIn:"/login" },
  callbacks:{
    async jwt({ token, account, profile }) {
      if (account?.provider === "google" && profile?.sub && profile.email) {
        const now=new Date().toISOString();
        const userId=await updateDatabase((database)=>{
          let user=database.users.find((item)=>item.googleSubject===profile.sub);
          if (!user) {
            user={ id:randomUUID(), googleSubject:profile.sub!, email:profile.email!, name:profile.name ?? profile.email!, imageUrl:typeof profile.picture === "string" ? profile.picture : null, createdAt:now, updatedAt:now };
            database.users.push(user);
          } else {
            user.email=profile.email!; user.name=profile.name ?? profile.email!; user.imageUrl=typeof profile.picture === "string" ? profile.picture : null; user.updatedAt=now;
          }
          return user.id;
        });
        token.userId=userId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && typeof token.userId === "string") session.user.id=token.userId;
      return session;
    },
  },
});

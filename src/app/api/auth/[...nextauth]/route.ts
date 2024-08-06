import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

import prisma from "../../../../../lib/prisma";

const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: "/signin",
    },
    events: {
        signIn: async (message: any) => {
            await prisma.userLogin.create({
                data: {
                    email: message.user.email,
                    provider: message.account.provider,
                },
            });
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

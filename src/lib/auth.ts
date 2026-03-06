import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "admin" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    throw new Error("Missing credentials")
                }

                const user = await prisma.user.findUnique({
                    where: { username: credentials.username }
                })

                if (!user) {
                    throw new Error("Invalid credentials")
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash)

                if (!isPasswordValid) {
                    throw new Error("Invalid credentials")
                }

                return {
                    id: user.id.toString(),
                    name: user.name,
                    username: user.username,
                    isAdmin: user.isAdmin,
                    canEdit: user.canEdit,
                    canAdd: user.canAdd,
                    canDelete: user.canDelete,
                }
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.username = (user as any).username
                token.isAdmin = (user as any).isAdmin
                token.canEdit = (user as any).canEdit
                token.canAdd = (user as any).canAdd
                token.canDelete = (user as any).canDelete
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).id = token.id;
                (session.user as any).username = token.username;
                (session.user as any).isAdmin = token.isAdmin;
                (session.user as any).canEdit = token.canEdit;
                (session.user as any).canAdd = token.canAdd;
                (session.user as any).canDelete = token.canDelete;
            }
            return session
        }
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_development_only",
}

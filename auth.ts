import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "Correo o celular", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const { identifier, password } = credentials as { identifier: string; password: string };
        if (!identifier || !password) return null;

        const isPhone = /^\d+$/.test(identifier.trim());
        const user = await prisma.user.findFirst({
          where: isPhone
            ? { phone: identifier.trim() }
            : { email: identifier.trim().toLowerCase() },
        });

        if (!user?.password) return null;
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      // @ts-ignore
      if (token?.id) session.user.id = token.id;
      return session;
    },
  },
  pages: { signIn: "/" },
});

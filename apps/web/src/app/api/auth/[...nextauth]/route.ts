import { createSessionToken } from '@groceryview/auth';
import { PrismaClient } from '@prisma/client';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import NextAuth, { type NextAuthOptions, type Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';

export const runtime = 'nodejs';

type GoogleProfile = {
  email?: string;
  email_verified?: boolean;
};

type GroceryViewSession = Session & {
  accessToken?: string;
  expiresAt?: string;
  user?: Session['user'] & {
    id?: string;
  };
};

type GroceryViewJwt = JWT & {
  groceryviewAccessToken?: string;
  groceryviewAccessTokenExpiresAt?: string;
};

const globalForPrisma = globalThis as typeof globalThis & {
  groceryviewAuthPrisma?: PrismaClient;
};

const prisma = globalForPrisma.groceryviewAuthPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.groceryviewAuthPrisma = prisma;

function googleProvider() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

  return [
    GoogleProvider({
      clientId,
      clientSecret,
      allowDangerousEmailAccountLinking: true
    })
  ];
}

function sessionExpiresAt(): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  return expiresAt.toISOString();
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async jwt({ token, user }) {
      const groceryviewToken = token as GroceryViewJwt;
      if (!user?.id || !process.env.AUTH_SECRET) return token;

      const expiresAt = sessionExpiresAt();
      groceryviewToken.groceryviewAccessToken = await createSessionToken(
        { userId: user.id, email: user.email ?? undefined, expiresAt },
        process.env.AUTH_SECRET
      );
      groceryviewToken.groceryviewAccessTokenExpiresAt = expiresAt;
      return groceryviewToken;
    },
    async session({ session, token }) {
      const groceryviewToken = token as GroceryViewJwt;
      const groceryviewSession = session as GroceryViewSession;
      groceryviewSession.accessToken = groceryviewToken.groceryviewAccessToken;
      groceryviewSession.expiresAt = groceryviewToken.groceryviewAccessTokenExpiresAt;
      groceryviewSession.user = {
        ...groceryviewSession.user,
        id: groceryviewToken.sub,
        email: groceryviewToken.email ?? groceryviewSession.user?.email
      };
      return groceryviewSession;
    },
    async signIn({ profile }) {
      return (profile as GoogleProfile | undefined)?.email_verified !== false;
    }
  },
  providers: googleProvider(),
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt'
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

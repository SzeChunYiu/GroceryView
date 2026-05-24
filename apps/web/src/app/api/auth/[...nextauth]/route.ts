import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaClient } from '@prisma/client';
import NextAuth, { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const prisma = new PrismaClient();
const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? '';
const sessionMaxAge = 30 * 24 * 60 * 60;

type JwtClaims = Record<string, unknown> & {
  exp?: number;
  iat?: number;
  sub?: string;
  userId?: string;
};

function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function signJwt(claims: JwtClaims, secret: string): string {
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify(claims));
  const data = `${header}.${payload}`;
  const signature = createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function decodeJwt(token: string, secret: string): JwtClaims | null {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !signature) return null;

    const data = `${encodedHeader}.${encodedPayload}`;
    const expected = createHmac('sha256', secret).update(data).digest('base64url');
    const actualSignature = Buffer.from(signature);
    const expectedSignature = Buffer.from(expected);
    if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) return null;

    const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8')) as { alg?: string };
    if (header.alg !== 'HS256') return null;

    const claims = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as JwtClaims;
    if (typeof claims.exp === 'number' && claims.exp < Math.floor(Date.now() / 1000)) return null;
    return claims;
  } catch {
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  secret: authSecret,
  session: {
    strategy: 'jwt',
    maxAge: sessionMaxAge,
  },
  jwt: {
    async encode({ token, maxAge }) {
      if (!token || !authSecret) return '';
      const issuedAt = Math.floor(Date.now() / 1000);
      const expiresAt = issuedAt + (maxAge ?? sessionMaxAge);
      return signJwt({ ...token, iat: issuedAt, exp: expiresAt }, authSecret);
    },
    async decode({ token }) {
      if (!token || !authSecret) return null;
      return decodeJwt(token, authSecret);
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      return Boolean(profile?.email);
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === 'google' && account.providerAccountId) {
        const linkedAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
        });

        if (linkedAccount) {
          token.userId = linkedAccount.userId;
          return token;
        }

        const email = token.email ?? profile?.email;
        if (!email) return token;

        const user = await prisma.user.upsert({
          where: { email },
          update: {
            name: token.name ?? undefined,
            image: token.picture ?? undefined,
          },
          create: {
            email,
            name: token.name ?? undefined,
            image: token.picture ?? undefined,
          },
        });

        await prisma.account.create({
          data: {
            userId: user.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refreshToken: account.refresh_token,
            accessToken: account.access_token,
            expiresAt: account.expires_at,
            tokenType: account.token_type,
            scope: account.scope,
            idToken: account.id_token,
            sessionState: account.session_state,
          },
        });

        token.userId = user.id;
      }

      return token;
    },
    async session({ session, token }) {
      const userId = typeof token.userId === 'string' ? token.userId : token.sub;
      if (session.user && userId) {
        (session.user as { id?: string }).id = userId;
        (session as Record<string, unknown>).accessToken = signJwt(
          {
            sub: userId,
            userId,
            email: token.email,
            name: token.name,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + sessionMaxAge,
          },
          authSecret,
        );
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
